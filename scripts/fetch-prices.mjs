#!/usr/bin/env node
/**
 * Fetch historical weekly prices from Twelve Data API for all ETF tickers.
 * Outputs JSON files to data/prices/ directory for GitHub Pages hosting.
 *
 * Usage:
 *   TWELVE_DATA_API_KEY=xxx node scripts/fetch-prices.mjs
 *
 * Rate limit: 8 req/min (free tier) → batches of 6 with 12s delay
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'data', 'prices');
const API_BASE = 'https://api.twelvedata.com/time_series';
const API_KEY = process.env.TWELVE_DATA_API_KEY;

if (!API_KEY) {
  console.error('ERROR: TWELVE_DATA_API_KEY environment variable is required');
  process.exit(1);
}

// All tickers across three universes
const US_TICKERS = [
  'SPY', 'VOO', 'IVV', 'EFA', 'EEM', 'TLT', 'AGG', 'BND', 'IEF', 'SHY',
  'GLD', 'IAU', 'DBC', 'VNQ', 'QQQ', 'VTV', 'VBR', 'BIL', 'SCHD', 'HYG', 'LQD',
];

const KR_TICKERS = [
  '360750', '379800', '195930', '195980', '304660', '451540', '308620',
  '305080', '153130', '214330', '132030', '411060', '261220', '352560',
  '133690', '429760', '458730', '381180', '161510',
  '251350', '289040', '453850', '453810', '182490', '272580',
  '352540', '379810', '459580', '261060', '278530', '069500',
];

// Deduplicate
const ALL_TICKERS = [...new Set([...US_TICKERS, ...KR_TICKERS])];

const BATCH_SIZE = 7;
const BATCH_DELAY_MS = 62000; // 62s between batches — wait full minute for rate limit reset (8 req/min)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTicker(ticker) {
  const url = `${API_BASE}?symbol=${encodeURIComponent(ticker)}&interval=1week&outputsize=60&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${ticker}`);
  }
  const json = await res.json();
  if (json.status === 'error') {
    throw new Error(`API error for ${ticker}: ${json.message}`);
  }
  const values = json.values ?? [];
  if (values.length === 0) {
    throw new Error(`No data for ${ticker}`);
  }

  // Convert to our format: oldest → newest
  const prices = values
    .map((v) => ({
      date: v.datetime.split(' ')[0], // "2026-03-27" (remove time if present)
      close: parseFloat(v.close),
    }))
    .reverse();

  return prices;
}

async function main() {
  console.log(`Fetching prices for ${ALL_TICKERS.length} tickers...`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = { success: [], failed: [] };
  const allPrices = {};

  for (let i = 0; i < ALL_TICKERS.length; i += BATCH_SIZE) {
    const batch = ALL_TICKERS.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(', ')}`);

    const promises = batch.map(async (ticker) => {
      try {
        const prices = await fetchTicker(ticker);
        allPrices[ticker] = prices;
        results.success.push(ticker);
        console.log(`  ✓ ${ticker}: ${prices.length} data points`);
      } catch (e) {
        results.failed.push({ ticker, error: e.message });
        console.error(`  ✗ ${ticker}: ${e.message}`);
      }
    });

    await Promise.all(promises);

    // Rate limit delay between batches
    if (i + BATCH_SIZE < ALL_TICKERS.length) {
      console.log(`  Waiting ${BATCH_DELAY_MS / 1000}s (rate limit)...`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Write individual ticker files
  for (const [ticker, prices] of Object.entries(allPrices)) {
    const filePath = join(OUTPUT_DIR, `${ticker}.json`);
    writeFileSync(filePath, JSON.stringify({ ticker, prices, fetchedAt: new Date().toISOString() }));
  }

  // Write combined manifest
  const manifest = {
    tickers: Object.keys(allPrices),
    updatedAt: new Date().toISOString(),
    count: Object.keys(allPrices).length,
    failed: results.failed,
  };
  writeFileSync(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`Success: ${results.success.length} / ${ALL_TICKERS.length}`);
  if (results.failed.length > 0) {
    console.log(`Failed: ${results.failed.map((f) => f.ticker).join(', ')}`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
