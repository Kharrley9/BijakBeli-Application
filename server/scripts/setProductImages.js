/**
 * setProductImages.js
 * ─────────────────────────────────────────────────────────────────────────
 * Gives each fresh item a photo of that item (ikan kembung, kangkung, betik…)
 * instead of its category's photo. PriceCatcher publishes no images and the
 * retailers' sites are off limits, so photos come from Wikimedia Commons (free
 * licences). Every photo in PHOTOS was viewed and checked by hand.
 *
 * Products are matched to a photo by name (RULES, first match wins). Items no
 * rule covers keep their category photo. Sets Product.image + imageCredit.
 *
 * Usage (from server/):
 *   node scripts/setProductImages.js --dry-run
 *   node scripts/setProductImages.js
 */
'use strict';

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');

const DRY_RUN = process.argv.includes('--dry-run');
const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'BijakBeli/1.0 (PSM student project; grocery price comparison app)';
const THUMB_WIDTH = 600;

/** Product name pattern → photo key. Order matters: specific before general. */
const RULES = [
  [/AYAM BERSIH/, 'ayam_whole'],
  [/DRUMSTICK/, 'ayam_drumstick'],
  [/DADA AYAM/, 'ayam_breast'],
  [/THIGH AYAM/, 'ayam_thigh'],
  [/WHOLE LEG AYAM/, 'ayam_leg'],
  [/KEPAK AYAM/, 'ayam_wing'],
  [/PAHA KAMBING/, 'mutton_leg'],
  [/KAMBING/, 'mutton'],
  [/KERBAU/, 'buffalo'],
  [/LEMBU/, 'beef'],
  [/KEPALA IKAN/, 'fish_head'],
  [/CENCARU/, 'cencaru'],
  [/BAWAL HITAM/, 'bawal_hitam'],
  [/BAWAL PUTIH/, 'bawal_putih'],
  [/PELALING/, 'pelaling'],
  [/KEMBUNG/, 'kembung'],
  [/SELAR KUNING/, 'selar_kuning'],
  [/SELAR/, 'selar'],
  [/SOTONG/, 'sotong'],
  [/KETAM/, 'ketam'],
  [/UDANG HARIMAU/, 'udang_harimau'],
  [/UDANG/, 'udang_putih'],
  [/SIAKAP/, 'siakap'],
  [/KERISI/, 'kerisi'],
  [/TENGGIRI/, 'tenggiri'],
  [/MABUNG/, 'mabung'],
  [/IKAN MERAH/, 'ikan_merah'],
  [/DEMUDUK|CERMIN/, 'cermin'],
  [/JENAHAK/, 'jenahak'],
  [/TONGKOL/, 'tongkol'],
  [/SELAYANG/, 'selayang'],
  [/KELI/, 'keli'],
  [/TILAPIA/, 'tilapia_merah'],
  [/CILI (API|PADI)/, 'cili_padi'],
  [/CILI.*HIJAU/, 'cili_hijau'],
  [/CILI/, 'cili_merah'],
  [/HALIA/, 'halia'],
  [/BENDI/, 'bendi'],
  [/BUNCIS/, 'buncis'],
  [/KACANG PANJANG/, 'kacang_panjang'],
  [/KUBIS BUNGA|CAULIFLOWER/, 'cauliflower'],
  [/KUBIS BULAT/, 'kubis'],
  [/TIMUN/, 'timun'],
  [/LOBAK MERAH/, 'lobak_merah'],
  [/LOBAK PUTIH/, 'lobak_putih'],
  [/KUNYIT/, 'kunyit'],
  [/TOMATO/, 'tomato'],
  [/LADA BENGGALA/, 'capsicum'],
  [/BROKOLI/, 'brokoli'],
  [/KANGKUNG/, 'kangkung'],
  [/BAYAM/, 'bayam'],
  [/KAILAN/, 'kailan'],
  [/PAK CHOY|SAWI PENDEK/, 'pakchoy'],
  [/SAWI/, 'sawi'],
  [/LENGKUAS/, 'lengkuas'],
  [/TERUNG BULAT/, 'terung_bulat'],
  [/BETIK/, 'betik'],
  [/TEMBIKAI SUSU/, 'tembikai_susu'],
  [/TEMBIKAI/, 'tembikai'],
  [/PISANG EMAS/, 'pisang_emas'],
  [/PISANG/, 'pisang_berangan'],
  [/DRAGON FRUIT/, 'dragon_fruit'],
  [/NENAS/, 'nenas'],
  [/ANGGUR HIJAU/, 'anggur_hijau'],
  [/ANGGUR MERAH/, 'anggur_merah'],
  [/^LAI\b/, 'lai'],
  [/JAMBU BATU/, 'jambu_batu'],
  [/LIMAU NIPIS/, 'limau_nipis'],
  [/LIMAU KASTURI/, 'limau_kasturi'],
  [/SANTAN/, 'santan'],
  [/KELAPA PARUT/, 'kelapa_parut'],
  [/KELAPA BIJI/, 'kelapa_biji'],
  [/^TELUR AYAM/, 'telur'],
  [/MEE KUNING/, 'mee_kuning'],
];

/** Photo key → Commons file (each viewed and checked). Missing key = keep category photo. */
const PHOTOS = {
  ayam_whole: 'File:Whole raw chicken - Japan Dec 22 2019.jpeg',
  ayam_drumstick: 'File:Raw chicken drumsticks (3312851753).jpg',
  ayam_breast: 'File:Raw chicken slices.jpg',
  ayam_thigh: 'File:Raw chicken thighs.jpg',
  ayam_leg: 'File:Raw leg chicken quarters.jpg',
  ayam_wing: 'File:Raw chicken wings.jpg',
  mutton: 'File:Raw lamb cutlets with shredded ginger and rosemary.jpg',
  buffalo: 'File:Boneless buffalo meat.jpg',
  beef: 'File:Standing-rib-roast.jpg',
  fish_head: 'File:DSC 9979 Fresh whole fish displayed on a decorative plate at a market tagged with a price marker.jpg',
  cencaru: 'File:Finny scad.JPG',
  bawal_hitam: 'File:Parastromateus niger Pakistan.jpg',
  bawal_putih: 'File:Pampus argenteus.jpg',
  kembung: 'File:Rastrelliger kanagurta in Aceh.jpg',
  pelaling: 'File:Pla thu831.jpg',
  selar_kuning: 'File:Selaroides leptolepis.jpg',
  selar: 'File:Atule mate palau.jpg',
  ketam: 'File:Portunus pelagicus male.jpg',
  udang_putih: 'File:Penaeus merguiensis.jpg',
  udang_harimau: 'File:Penaeus monodon.jpg',
  siakap: 'File:Lates calcarifer (barramundi), Airlie Beach IMGP0254.jpg',
  kerisi: 'File:Nemipterus sp. fish in Aceh.jpg',
  ikan_merah: 'File:13-08-06-abu-dhabi-marina-mall-64.jpg',
  cermin: 'File:Alectis indica 2.jpg',
  jenahak: 'File:Lutjanus argentimaculatus JNC2123 New Caledonia.JPG',
  tongkol: 'File:Euthynnus affinis.jpg',
  selayang: 'File:Pasar Raya Solok - Decapterus macrosoma 143420.jpg',
  keli: 'File:Clarias aff. batrachus (10.3897-BDJ.11.e100337) Figure 19.jpg',
  cili_merah: 'File:Fresh Red Curly Chili Peppers (Capsicum annuum) Pile.jpg',
  cili_hijau: 'File:Green chili peppers.jpg',
  cili_padi: 'File:Birdchili.jpg',
  bendi: 'File:Quiabo.jpg',
  buncis: 'File:Macro of Fresh Green Beans Buncis.jpg',
  kacang_panjang: 'File:Long Bean.JPG',
  timun: 'File:Ryerson Market cucumbers on sale.jpg',
  lobak_merah: 'File:Carrots at Ljubljana Central Market.JPG',
  kunyit: 'File:Organic Turmeric Rhizome (Root).jpg',
  tomato: 'File:Tomato je.jpg',
  capsicum: 'File:Green Bell Pepper.jpg',
  brokoli: 'File:Liat Portal for Foodie Disorder - Fresh Broccoli.jpg',
  cauliflower: 'File:Brassica oleracea var. botrytis (Coliflor).jpg',
  kangkung: 'File:Phak bung chin-ipomoea aquatica309.jpg',
  kailan: 'File:Gailan.jpg',
  sawi: 'File:Choy-sum.jpg',
  lengkuas: 'File:Galangal (562251733).jpg',
  terung_bulat: 'File:Small round eggplants 2017 A.jpg',
  lobak_putih: 'File:Daikon.Japan.jpg',
  pakchoy: 'File:Brassica rapa var. chinensis (leaf).jpg',
  betik: 'File:Papaya - longitudinal section.jpg',
  tembikai: 'File:البطيخ الأحمر.JPG',
  tembikai_susu: 'File:Honeydew.jpg',
  pisang_emas: 'File:Lady finger banana 1.jpg',
  pisang_berangan: 'File:Lacatan banana.JPG',
  dragon_fruit: 'File:Dragon Fruit Sliced.jpg',
  nenas: 'File:Pineapple fruit 2.jpg',
  anggur_hijau: 'File:Green grapes (20240716).jpg',
  anggur_merah: 'File:2021-07-11 13 07 30 Red table grapes in the Franklin Farm section of Oak Hill, Fairfax County, Virginia.jpg',
  lai: 'File:Ya pears 20250509 182727.jpg',
  jambu_batu: 'File:Guava ID.jpg',
  limau_nipis: 'File:Lime-Whole-Split.jpg',
  limau_kasturi: 'File:Citrus x microcarpa Kalamondin 2018-09-02 03.jpg',
  santan: 'File:Cononut milk.JPG',
  kelapa_parut: 'File:Grated Coconut - Howrah 2013-10-18 3544.JPG',
  kelapa_biji: 'File:Coconut 5.jpg',
  halia: 'File:Ginger rhizomes.jpg',
  kubis: 'File:Cabbages - Harbourside Market, Wellington, New Zealand - DSC09800.jpg',
  bayam: 'File:Aleho Vegetables at Bakin Dogo Market, Kaduna North.jpg',
  sotong: 'File:Uroteuthis duvaucelii 122342233.jpg',
  mutton_leg: 'File:Raw lamb cutlets with shredded ginger and rosemary.jpg',
  // no checked photo yet (keep category photo): tenggiri, mabung, tilapia_merah;
  // telur and mee_kuning: the category photos already show exactly these
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function imageInfo(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const qs = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      titles: titles.slice(i, i + 50).join('|'),
    });
    const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': USER_AGENT } });
    const json = await res.json();
    for (const p of Object.values(json.query?.pages || {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      const text = (v) => (v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const license = text(m.LicenseShortName?.value);
      if (!/^(cc|public domain|pd)/i.test(license)) continue;
      out.set(p.title, {
        url: ii.thumburl || ii.url,
        author: text(m.Artist?.value).slice(0, 120) || 'Wikimedia Commons contributor',
        license,
        sourceUrl: ii.descriptionurl,
      });
    }
    await sleep(1500);
  }
  return out;
}

const keyFor = (name) => RULES.find(([re]) => re.test(name))?.[1] || null;

async function main() {
  console.log(`Product photos from Wikimedia Commons${DRY_RUN ? ' (DRY RUN)' : ''}\n`);
  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find({ status: 'active' }).lean();
  const info = await imageInfo([...new Set(Object.values(PHOTOS))]);
  const missingInfo = Object.entries(PHOTOS).filter(([, t]) => !info.has(t));
  if (missingInfo.length) console.log('⚠️  No usable file info for:', missingInfo.map(([k]) => k).join(', '));

  const ops = [];
  const unmatched = [];
  const noPhoto = new Set();
  for (const p of products) {
    const key = keyFor(p.productName);
    if (!key) {
      unmatched.push(p.productName);
      continue;
    }
    const i = info.get(PHOTOS[key]);
    if (!i) {
      noPhoto.add(key);
      continue;
    }
    ops.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { image: i.url, imageCredit: { author: i.author, license: i.license, sourceUrl: i.sourceUrl } } },
      },
    });
  }

  console.log(`🖼️  ${ops.length} of ${products.length} products get their own photo`);
  if (noPhoto.size) console.log(`   keep category photo (no checked photo yet): ${[...noPhoto].join(', ')}`);
  if (unmatched.length) console.log(`   no rule: ${unmatched.join(' | ')}`);

  if (!DRY_RUN && ops.length) {
    const r = await Product.bulkWrite(ops, { ordered: false });
    console.log(`\n🎉 Updated ${r.modifiedCount} products.`);
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
