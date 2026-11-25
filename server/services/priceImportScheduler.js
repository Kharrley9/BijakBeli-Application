/**
 * priceImportScheduler.js
 * ─────────────────────────────────────────────────────────────────────────
 * Keeps prices in step with KPDN PriceCatcher without anyone running the import:
 *
 *  - once a day at PRICE_IMPORT_HOUR (Malaysia time) it runs
 *    scripts/importPriceCatcher.js --auto, then scripts/fetchStorePhotos.js
 *    (gives any newly imported store a photo);
 *  - when the server starts and the last successful import is older than
 *    CATCH_UP_AFTER_H (the PC was off at the scheduled time), it runs one
 *    shortly after start-up;
 *  - each job runs as a child process, so a failed import never takes the API
 *    down, and never two at once;
 *  - keeps only the KEEP_AUTO_BACKUPS newest "before-pricecatcher-auto-*"
 *    backups (each ~5 MB); backups from manual runs are never touched.
 *
 * Status (last run, result, data date) is kept in cache/price-import.json and
 * shown by GET /api/health.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');

const SERVER_DIR = path.join(__dirname, '..');
const STATUS_FILE = path.join(SERVER_DIR, 'cache', 'price-import.json');
const BACKUP_DIR = path.join(SERVER_DIR, 'backups');
const MYT_OFFSET_H = 8; // Malaysia is UTC+8 all year
const CATCH_UP_AFTER_H = 20;
const START_DELAY_MS = 60 * 1000; // let the server settle first
const JOB_TIMEOUT_MS = 30 * 60 * 1000;
const KEEP_AUTO_BACKUPS = 7;

let running = false;
let timer = null;

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStatus(patch) {
  const next = { ...readStatus(), ...patch };
  try {
    fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
    fs.writeFileSync(STATUS_FILE, `${JSON.stringify(next, null, 2)}\n`);
  } catch (err) {
    logger.warn(`Price import: could not save status (${err.message})`);
  }
  return next;
}

/** Runs one node script; resolves { code, tail } where tail is its last output lines. */
function runScript(script, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SERVER_DIR, 'scripts', script), ...args], {
      cwd: SERVER_DIR,
      env: process.env,
      windowsHide: true,
    });
    let out = '';
    const keep = (d) => {
      out = (out + d.toString()).slice(-8000);
    };
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    const killer = setTimeout(() => {
      keep('\n[timed out]');
      child.kill();
    }, JOB_TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(killer);
      const tail = out
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(-6);
      resolve({ code, tail });
    });
    child.on('error', (err) => {
      clearTimeout(killer);
      resolve({ code: -1, tail: [err.message] });
    });
  });
}

/** Deletes all but the newest KEEP_AUTO_BACKUPS automatic backups. */
function pruneAutoBackups() {
  try {
    const dirs = fs
      .readdirSync(BACKUP_DIR)
      .filter((d) => d.startsWith('before-pricecatcher-auto-'))
      .sort(); // ISO timestamps sort by time
    for (const d of dirs.slice(0, Math.max(0, dirs.length - KEEP_AUTO_BACKUPS))) {
      fs.rmSync(path.join(BACKUP_DIR, d), { recursive: true, force: true });
    }
  } catch (err) {
    if (err.code !== 'ENOENT') logger.warn(`Price import: could not prune backups (${err.message})`);
  }
}

/** One full refresh: import prices, then photos for any new store. */
async function runImport(reason) {
  if (running) return;
  running = true;
  const startedAt = new Date();
  logger.info(`Price import started (${reason})`);
  writeStatus({ running: true, lastStartAt: startedAt.toISOString(), lastReason: reason });
  try {
    const imp = await runScript('importPriceCatcher.js', ['--auto']);
    const ok = imp.code === 0;
    const done = imp.tail.find((l) => /real stores/.test(l)) || '';
    const asOf = (done.match(/data up to (\d{4}-\d{2}-\d{2})/) || [])[1] || null;
    if (!ok) {
      logger.error(`Price import failed (exit ${imp.code}): ${imp.tail.join(' | ')}`);
      writeStatus({ running: false, lastRunAt: new Date().toISOString(), lastOk: false, lastError: imp.tail.join(' | ') });
      return;
    }
    logger.info(`Price import done: ${done || 'ok'}`);
    writeStatus({
      running: false,
      lastRunAt: new Date().toISOString(),
      lastOk: true,
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      dataAsOf: asOf || readStatus().dataAsOf || null,
      summary: done,
    });
    pruneAutoBackups();

    const photos = await runScript('fetchStorePhotos.js');
    if (photos.code !== 0) logger.warn(`Store photo refresh failed: ${photos.tail.join(' | ')}`);
  } finally {
    running = false;
    // Don't leave "running" behind if something above threw
    if (readStatus().running) writeStatus({ running: false });
  }
}

/** Milliseconds until the next PRICE_IMPORT_HOUR:00 Malaysia time. */
function msUntilNextRun(hourMyt, now = new Date()) {
  const next = new Date(now);
  next.setUTCHours((hourMyt - MYT_OFFSET_H + 24) % 24, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

function scheduleNext() {
  const ms = msUntilNextRun(config.PRICE_IMPORT_HOUR);
  writeStatus({ nextRunAt: new Date(Date.now() + ms).toISOString() });
  timer = setTimeout(async () => {
    await runImport('daily schedule');
    scheduleNext();
  }, ms);
  timer.unref?.();
}

function start() {
  if (!config.PRICE_IMPORT_ENABLED) {
    logger.info('Daily price import is off (PRICE_IMPORT_ENABLED=false)');
    return;
  }
  // A crash mid-run leaves "running" set; clear it on start.
  const status = writeStatus({ running: false });
  const last = status.lastSuccessAt ? new Date(status.lastSuccessAt) : null;
  const stale = !last || Date.now() - last.getTime() > CATCH_UP_AFTER_H * 3600 * 1000;
  if (stale) {
    setTimeout(() => runImport('catch-up on start'), START_DELAY_MS).unref?.();
  }
  scheduleNext();
  logger.info(
    `Daily price import at ${String(config.PRICE_IMPORT_HOUR).padStart(2, '0')}:00 Malaysia time` +
      (stale ? '; catching up in 1 minute' : '')
  );
}

/** For GET /api/health. */
function getStatus() {
  const s = readStatus();
  return {
    enabled: config.PRICE_IMPORT_ENABLED,
    running,
    dataAsOf: s.dataAsOf || null,
    lastSuccessAt: s.lastSuccessAt || null,
    lastOk: s.lastOk ?? null,
    nextRunAt: s.nextRunAt || null,
  };
}

module.exports = { start, getStatus, runImport, msUntilNextRun };
