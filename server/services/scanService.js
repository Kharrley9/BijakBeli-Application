const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('../models/Category'); // registers the model that lookups populate
const BarcodeLink = require('../models/BarcodeLink');

/**
 * Scanning fresh produce: our own QR labels and the stores' barcodes.
 *
 * QR labels: fresh items carry no standard code, so BijakBeli prints its own. The
 * payload is the item's PriceCatcher item code, which is official and survives every
 * price re-import (unlike our Mongo _id):
 *
 *   BIJAKBELI:ITEM:<itemCode>        e.g. BIJAKBELI:ITEM:11
 *
 * Store barcodes: PriceCatcher has no barcodes, so buyers link an unknown barcode to
 * an item once (see models/BarcodeLink) and later scans resolve through that link.
 */
const PREFIX = 'BIJAKBELI:ITEM:';
const OWN = /^BIJAKBELI:ITEM:(\d{1,9})$/i;
const PRODUCT_FIELDS = 'productName unit image itemCode categoryId';

function payloadFor(product) {
  return `${PREFIX}${product.itemCode}`;
}

/** Mongo filter for a QR code's text, or null when it is not one of ours. */
function parseQrText(text) {
  const own = text.match(OWN);
  if (own) return { itemCode: Number(own[1]) };

  const link = text.match(/\/item\/(\d{1,9})(?:[/?#]|$)/i) || text.match(/[?&]itemCode=(\d{1,9})(?:&|#|$)/i);
  if (link) return { itemCode: Number(link[1]) };

  if (/^[a-f0-9]{24}$/i.test(text)) return { _id: text };

  // A QR holding just a short number is a bare item code (barcodes are 8+ digits).
  if (/^\d{1,7}$/.test(text)) return { itemCode: Number(text) };

  return null;
}

/**
 * The key a store barcode is linked under.
 *
 * Store scale labels (EAN-13 starting with 2, or UPC-A starting with 2, which
 * scanners report as EAN-13 "02…") are GS1 "restricted circulation" numbers: the
 * first 7 digits are a flag plus the store's item number, the rest is the price or
 * weight of that one pack plus a check digit. Only the first 7 digits stay the same
 * from pack to pack, so that is what we key on ("W:2101234"). Retail barcodes
 * (EAN-13/EAN-8/ITF-14) are keyed whole ("B:9556789012345"); anything else
 * (e.g. a store's own Code 128) by its text ("T:…").
 */
function normaliseBarcode(raw) {
  let text = String(raw || '').trim();
  if (!text || text.length > 64) return null;
  if (/^\d+$/.test(text)) {
    if (text.length === 12) text = `0${text}`; // UPC-A is EAN-13 with a leading 0
    if (text.length === 13 && /^0?2/.test(text)) return { key: `W:${text.slice(0, 7)}`, kind: 'weighed' };
    if ([8, 13, 14].includes(text.length)) return { key: `B:${text}`, kind: 'retail' };
  }
  return { key: `T:${text}`, kind: 'other' };
}

/** The product a barcode is linked to: the viewer's own vote, else the most-voted product. */
function pickLinkedProduct(link, userId) {
  if (!link?.votes?.length) return null;
  const mine = userId && link.votes.find((v) => String(v.user) === String(userId));
  if (mine) return mine.productId;
  const tally = new Map();
  for (const v of link.votes) {
    const k = String(v.productId);
    const t = tally.get(k) || { productId: v.productId, n: 0, first: v.at };
    t.n += 1;
    if (v.at < t.first) t.first = v.at;
    tally.set(k, t);
  }
  // Most votes wins; on a tie, the item linked first.
  return [...tally.values()].sort((a, b) => b.n - a.n || a.first - b.first)[0].productId;
}

const findVisible = (filter) =>
  Product.findOne({ ...filter, status: 'active' })
    .populate('categoryId', 'categoryName nameEn')
    .select(PRODUCT_FIELDS)
    .lean();

/**
 * Works out what a scanned code points to.
 * @param {string} raw   the scanned text
 * @param {string} [type] the symbology the camera reported ('qr', 'ean13', 'code128', …)
 * @param {string} [userId] the buyer, so their own barcode link wins for them
 * @returns {{ recognised: boolean, product: object|null, source?: 'item'|'barcode'|'link',
 *             barcode?: { code: string, kind: string } }}
 *   recognised=false: not a code we can use (e.g. a website QR)
 *   product=null with `barcode`: a barcode nobody has linked yet
 *   product=null without `barcode`: our item code, but the item has no prices
 */
async function resolveScan(raw, type, userId) {
  const text = String(raw || '').trim();
  if (!text || text.length > 512) return { recognised: false, product: null };
  const isQr = !type || String(type).toLowerCase() === 'qr';

  // Our own payload, in a QR or (if we ever print it) a Code 128
  const filter = isQr ? parseQrText(text) : OWN.test(text) ? parseQrText(text) : null;
  if (filter) return { recognised: true, product: await findVisible(filter), source: 'item' };

  // A QR that is not ours and not a number is a website, Wi-Fi code, etc.
  if (isQr && !/^\d{8,14}$/.test(text)) return { recognised: false, product: null };

  const norm = normaliseBarcode(text);
  if (!norm) return { recognised: false, product: null };
  const barcode = { code: norm.key, kind: norm.kind };

  // Products with a barcode of their own (none of the fresh items yet)
  if (norm.kind === 'retail') {
    const own = await findVisible({ barcode: text });
    if (own) return { recognised: true, product: own, source: 'barcode', barcode };
  }

  const link = await BarcodeLink.findOne({ code: norm.key }).lean();
  const productId = pickLinkedProduct(link, userId);
  const product = productId ? await findVisible({ _id: productId }) : null;
  return { recognised: true, product, source: product ? 'link' : undefined, barcode };
}

/**
 * Records that `userId` says barcode `raw` is product `productId` (replacing their
 * earlier vote for this barcode). Returns the product, or throws with statusCode.
 */
async function linkBarcode(raw, productId, userId) {
  const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
  const text = String(raw || '').trim();
  if (OWN.test(text)) throw fail(400, 'BijakBeli QR labels are already linked');
  const norm = normaliseBarcode(text);
  if (!norm) throw fail(400, 'Not a barcode');
  if (!mongoose.isValidObjectId(productId)) throw fail(400, 'Invalid product');
  const product = await findVisible({ _id: productId });
  if (!product) throw fail(404, 'Product not found');

  // An update pipeline is not cast by Mongoose, so pass real ObjectIds and Dates.
  const vote = { user: new mongoose.Types.ObjectId(String(userId)), productId: product._id, at: new Date() };
  const save = () =>
    BarcodeLink.findOneAndUpdate(
      { code: norm.key },
      [
        {
          $set: {
            kind: norm.kind,
            sample: { $ifNull: ['$sample', text.slice(0, 80)] },
            createdAt: { $ifNull: ['$createdAt', '$$NOW'] },
            updatedAt: '$$NOW',
            votes: {
              $concatArrays: [
                { $filter: { input: { $ifNull: ['$votes', []] }, cond: { $ne: ['$$this.user', vote.user] } } },
                [vote],
              ],
            },
          },
        },
      ],
      { upsert: true, new: true }
    );
  try {
    await save();
  } catch (e) {
    if (e.code !== 11000) throw e;
    await save(); // two first-links of the same barcode raced; the second now updates
  }
  return product;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Printable A4 page of QR labels for every visible product, grouped by category. */
async function renderLabelsPage({ categoryId } = {}) {
  const query = { status: 'active', itemCode: { $ne: null } };
  if (categoryId) query.categoryId = categoryId;
  const products = await Product.find(query)
    .populate('categoryId', 'categoryName nameEn')
    .select('productName unit itemCode categoryId')
    .sort({ productName: 1 })
    .lean();

  const groups = new Map();
  for (const p of products) {
    const name = p.categoryId?.categoryName || 'Lain-lain';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(p);
  }

  let sections = '';
  for (const [name, items] of groups) {
    const labels = await Promise.all(
      items.map(async (p) => {
        const svg = await QRCode.toString(payloadFor(p), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
        return `<figure class="label">${svg}<figcaption><strong>${esc(p.productName)}</strong><span>${esc(p.unit)} · kod ${p.itemCode}</span></figcaption></figure>`;
      })
    );
    sections += `<section><h2>${esc(name)}</h2><div class="grid">${labels.join('')}</div></section>`;
  }

  return `<!doctype html>
<html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Label QR BijakBeli</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 16px; color: #111; background: #fff; }
  h1 { font-size: 20px; margin: 0 0 4px; } p.hint { margin: 0 0 16px; color: #555; font-size: 13px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 2px solid #16a34a; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .label { margin: 0; border: 1px dashed #999; border-radius: 8px; padding: 8px; text-align: center; break-inside: avoid; }
  .label svg { width: 120px; height: 120px; }
  figcaption { font-size: 10px; line-height: 1.3; } figcaption strong { display: block; } figcaption span { color: #555; }
  @media print { body { margin: 8mm; } p.hint { display: none; } section { break-inside: auto; } }
</style></head><body>
<h1>Label QR barang basah — BijakBeli</h1>
<p class="hint">${products.length} barang. Cetak (Ctrl+P) dan tampal di rak, atau imbas terus dari skrin dengan butang imbas di aplikasi BijakBeli.</p>
${sections}
</body></html>`;
}

module.exports = { PREFIX, payloadFor, normaliseBarcode, resolveScan, linkBarcode, renderLabelsPage };
