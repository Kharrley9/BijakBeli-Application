const sharp = require('sharp');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const logger = require('../utils/logger');
const Product = require('../models/Product');
require('../models/Category'); // registers the model that catalogue() populates
const AiScanUsage = require('../models/AiScanUsage');

/**
 * Photo scan: the buyer photographs a fresh item (a tomato, a fish, a tray of
 * chicken) and Google Gemini picks the matching items from our catalogue, so no
 * barcode is needed.
 *
 * Gemini's free tier has per-minute and per-day request limits (per Google Cloud
 * project, daily reset at midnight Pacific time). This service never sends more
 * than GEMINI_RPM / GEMINI_RPD, counts every request it sends (except ones Google
 * rejects outright, which Google does not count either), and if Gemini still answers
 * "quota exceeded" it stops until the limit resets instead of retrying.
 */

const PACIFIC = 'America/Los_Angeles';
const MALAYSIA = 'Asia/Kuala_Lumpur';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_SIDE_PX = 768; // plenty to recognise produce; keeps each request small

const client = config.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: config.GEMINI_API_KEY }) : null;

const fail = (statusCode, message, extra = {}) => Object.assign(new Error(message), { statusCode, ...extra });

// ── Quota ──────────────────────────────────────────────────────────────────

/** The Gemini quota day (Pacific-time date, YYYY-MM-DD) that `d` falls in. */
function quotaDay(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PACIFIC, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** When the daily quota next resets: the next midnight in Pacific time. */
function nextReset(now = new Date()) {
  const today = quotaDay(now);
  // Pacific offsets are whole hours, so midnight is always on the hour.
  let t = new Date(now);
  t.setUTCMinutes(0, 0, 0);
  while (quotaDay(t) === today) t = new Date(t.getTime() + 3600e3);
  return t;
}

const malaysiaTime = (d) =>
  d.toLocaleTimeString('en-MY', { timeZone: MALAYSIA, hour: 'numeric', minute: '2-digit', hour12: true });

// Requests in the last minute (one server process, so memory is enough)
let recent = [];
let minuteBlockedUntil = 0;

function minuteWaitSec(now = Date.now()) {
  recent = recent.filter((t) => now - t < 60e3);
  const byOurCount = recent.length >= config.GEMINI_RPM ? Math.ceil((recent[0] + 60e3 - now) / 1000) : 0;
  const byGemini = minuteBlockedUntil > now ? Math.ceil((minuteBlockedUntil - now) / 1000) : 0;
  return Math.max(byOurCount, byGemini, 0);
}

async function getQuota() {
  const usage = await AiScanUsage.findOne({ day: quotaDay() }).lean();
  const used = usage?.count || 0;
  const resetsAt = nextReset();
  return {
    configured: !!client,
    model: config.GEMINI_MODEL,
    perMinute: config.GEMINI_RPM,
    perDay: config.GEMINI_RPD,
    usedToday: used,
    remainingToday: usage?.exhausted ? 0 : Math.max(0, config.GEMINI_RPD - used),
    resetsAt: resetsAt.toISOString(),
    resetsAtMalaysia: malaysiaTime(resetsAt),
    waitSeconds: minuteWaitSec(),
  };
}

function dailyLimitError() {
  const resetsAt = nextReset();
  return fail(
    429,
    `Today's free photo scans are used up. They reset at ${malaysiaTime(resetsAt)} (Malaysia time). You can still scan barcodes or search.`,
    { limit: 'day', resetsAt: resetsAt.toISOString() }
  );
}

/** Takes one request from the quota, or throws 429 / 503. */
async function reserve() {
  if (!client) throw fail(503, 'Photo scan is not set up yet (no Gemini API key on the server).');
  const wait = minuteWaitSec();
  if (wait > 0) {
    throw fail(429, `Too many photo scans this minute. Try again in ${wait} s.`, { limit: 'minute', retryAfterSec: wait });
  }
  const day = quotaDay();
  try {
    // Only matches while there is quota left; otherwise the upsert's insert hits the
    // unique `day` index (E11000), which means "no quota left".
    await AiScanUsage.findOneAndUpdate(
      { day, count: { $lt: config.GEMINI_RPD }, exhausted: { $ne: true } },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
  } catch (e) {
    if (e.code === 11000) throw dailyLimitError();
    throw e;
  }
  recent.push(Date.now());
}

/**
 * Gives back a request Google rejected outright (400/401/403: bad request or key).
 * AI Studio's usage page showed those are not counted against the free quota.
 */
async function release() {
  recent.pop();
  await AiScanUsage.updateOne({ day: quotaDay(), count: { $gt: 0 } }, { $inc: { count: -1 } });
}

/** Gemini said 429: work out which limit, and stop sending until it resets. */
async function onGeminiRateLimit(err) {
  const text = `${err.message || ''} ${JSON.stringify(err.error || '')}`;
  if (/per ?day|perday|daily/i.test(text)) {
    await AiScanUsage.updateOne({ day: quotaDay() }, { $set: { exhausted: true } }, { upsert: true });
    return dailyLimitError();
  }
  const header = Number(err.headers?.get?.('retry-after'));
  const waitSec = Number.isFinite(header) && header > 0 ? Math.ceil(header) : 60;
  minuteBlockedUntil = Date.now() + waitSec * 1000;
  return fail(429, `Gemini is busy (free-tier limit). Try again in ${waitSec} s.`, { limit: 'minute', retryAfterSec: waitSec });
}

// ── Catalogue ──────────────────────────────────────────────────────────────

let catalogueCache = { at: 0, items: [] };

async function catalogue() {
  if (Date.now() - catalogueCache.at < 10 * 60e3 && catalogueCache.items.length) return catalogueCache.items;
  const items = await Product.find({ status: 'active', itemCode: { $ne: null } })
    .populate('categoryId', 'categoryName nameEn')
    .select('productName unit image itemCode categoryId')
    .sort({ itemCode: 1 })
    .lean();
  catalogueCache = { at: Date.now(), items };
  return items;
}

const SYSTEM_INSTRUCTION = `You identify fresh grocery items in photos for a Malaysian price-comparison app.
The catalogue below lists every item the app has prices for, as "itemCode: NAME (unit) [category]". Names are Malay; some include an English name in brackets.

Rules:
- Pick only items from the catalogue, by itemCode.
- Return up to 3 matches, most likely first, with a confidence from 0 to 1.
- When several catalogue items look alike in a photo (for example grades, sizes, local vs imported, or cuts), list the closest ones so the buyer can choose.
- If no item from the catalogue is clearly visible, return an empty "matches" list.
- "seen" is a short English description of what is in the photo (max 8 words).`;

function promptFor(items) {
  const lines = items.map((p) => {
    const cat = p.categoryId ? `${p.categoryId.categoryName}/${p.categoryId.nameEn || ''}` : '';
    return `${p.itemCode}: ${p.productName} (${p.unit}) [${cat}]`;
  });
  return `Catalogue:\n${lines.join('\n')}\n\nWhich catalogue items are in this photo?`;
}

function schemaFor(items) {
  return {
    type: 'object',
    properties: {
      seen: { type: 'string' },
      matches: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            itemCode: { type: 'integer', enum: items.map((p) => p.itemCode) },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['itemCode', 'confidence'],
        },
      },
    },
    required: ['seen', 'matches'],
  };
}

// ── Recognise ──────────────────────────────────────────────────────────────

/**
 * @param {string} imageBase64 a JPEG/PNG photo, base64 (a data: URL prefix is allowed)
 * @returns {{ seen: string, matches: Array<{ product: object, confidence: number }>, quota: object }}
 */
async function recognise(imageBase64) {
  const b64 = String(imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
  const raw = Buffer.from(b64, 'base64');
  if (!raw.length) throw fail(400, 'No photo received.');
  if (raw.length > MAX_UPLOAD_BYTES) throw fail(413, 'Photo is too large.');

  let jpeg;
  try {
    jpeg = await sharp(raw)
      .rotate() // respect the phone's EXIF orientation
      .resize(MAX_SIDE_PX, MAX_SIDE_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    throw fail(400, 'That file is not a photo we can read.');
  }

  const items = await catalogue();
  await reserve(); // counts this request; given back only if Google rejects it outright

  let interaction;
  try {
    interaction = await client.interactions.create(
      {
        model: config.GEMINI_MODEL,
        store: false, // nothing to look up later; don't keep the photo on Google's side
        system_instruction: SYSTEM_INSTRUCTION,
        // The v1 API takes input as steps; text and image go inside one user_input step.
        input: [
          {
            type: 'user_input',
            content: [
              { type: 'text', text: promptFor(items) },
              { type: 'image', data: jpeg.toString('base64'), mime_type: 'image/jpeg' },
            ],
          },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema: schemaFor(items) },
      },
      // No automatic retries: a retry would spend another request of the free quota.
      { maxRetries: 0, timeout: 30000 }
    );
  } catch (err) {
    if (err.status === 429) throw await onGeminiRateLimit(err);
    logger.error(`Gemini photo scan failed: ${err.status || ''} ${err.message} ${JSON.stringify(err.error ?? '').slice(0, 400)}`);
    if (err.status === 400 || err.status === 403 || err.status === 401) {
      await release();
      throw fail(503, 'Photo scan is not available right now (Gemini setup problem). Please try again later.');
    }
    throw fail(502, 'Could not reach the photo recognition service. Please try again.');
  }

  let parsed;
  try {
    parsed = JSON.parse(interaction.output_text || '{}');
  } catch {
    logger.error(`Gemini returned non-JSON output: ${String(interaction.output_text).slice(0, 200)}`);
    throw fail(502, 'Photo recognition gave an unreadable answer. Please try again.');
  }

  const byCode = new Map(items.map((p) => [p.itemCode, p]));
  const seenCodes = new Set();
  const matches = (Array.isArray(parsed.matches) ? parsed.matches : [])
    .filter((m) => byCode.has(m?.itemCode) && !seenCodes.has(m.itemCode) && seenCodes.add(m.itemCode))
    .map((m) => ({
      product: byCode.get(m.itemCode),
      confidence: Math.min(1, Math.max(0, Number(m.confidence) || 0)),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return { seen: String(parsed.seen || '').slice(0, 120), matches, quota: await getQuota() };
}

module.exports = { recognise, getQuota, quotaDay, nextReset };
