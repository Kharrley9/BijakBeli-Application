const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * GET /api/photos?src=<Wikimedia Commons image URL>
 *
 * Serves store photos through our server. Wikimedia rejects image requests
 * without an identifying User-Agent (Android's image loader sends "okhttp/x"
 * and gets HTTP 403), so we fetch them here with one, as its policy asks:
 * https://meta.wikimedia.org/wiki/User-Agent_policy
 *
 * Only Wikimedia upload/thumb URLs are accepted (this is not an open proxy).
 * Each image is cached on disk so Wikimedia is asked at most once per image.
 */
const router = express.Router();

const ALLOWED = /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\//;
const USER_AGENT = 'BijakBeli/1.0 (PSM student project; grocery price comparison app)';
const CACHE_DIR = path.join(__dirname, '..', 'cache', 'photos');
const MAX_BYTES = 5 * 1024 * 1024;

router.get('/', async (req, res, next) => {
  try {
    const src = String(req.query.src || '');
    if (!ALLOWED.test(src)) {
      return res.status(400).json({ success: false, message: 'Only Wikimedia Commons images are served' });
    }

    const key = crypto.createHash('sha1').update(src).digest('hex');
    const file = path.join(CACHE_DIR, `${key}.img`);
    const meta = path.join(CACHE_DIR, `${key}.type`);
    const send = (type) => {
      res.set('Content-Type', type || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=604800, immutable');
      fs.createReadStream(file).pipe(res);
    };

    if (fs.existsSync(file)) {
      return send(fs.existsSync(meta) ? fs.readFileSync(meta, 'utf8') : 'image/jpeg');
    }

    const upstream = await fetch(src, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(20000),
    });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !type.startsWith('image/')) {
      logger.warn(`Photo fetch failed: HTTP ${upstream.status} ${src}`);
      return res.status(502).json({ success: false, message: 'Photo unavailable' });
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    if (body.length > MAX_BYTES) {
      return res.status(502).json({ success: false, message: 'Photo too large' });
    }

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(file, body);
    fs.writeFileSync(meta, type);
    send(type);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
