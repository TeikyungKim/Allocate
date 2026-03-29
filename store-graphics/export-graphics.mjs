/**
 * Play Store 그래픽 에셋 PNG 변환 스크립트
 *
 * 사용법:
 *   npm install puppeteer   (최초 1회)
 *   node store-graphics/export-graphics.mjs
 *
 * 생성 파일:
 *   store-graphics/output/feature-graphic-1024x500.png
 *   store-graphics/output/icon-512x512.png
 *   store-graphics/output/screenshot-01.png ~ screenshot-08.png
 */

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, 'output');
mkdirSync(OUTPUT_DIR, { recursive: true });

async function exportHTML(browser, filePath, selector, outputName, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width: width + 100, height: height + 100, deviceScaleFactor: 1 });
  await page.goto(`file:///${filePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

  if (selector) {
    const element = await page.$(selector);
    if (!element) {
      console.error(`  ❌ Selector "${selector}" not found in ${filePath}`);
      await page.close();
      return;
    }
    await element.screenshot({ path: resolve(OUTPUT_DIR, outputName), type: 'png' });
  } else {
    await page.screenshot({
      path: resolve(OUTPUT_DIR, outputName),
      type: 'png',
      clip: { x: 0, y: 0, width, height },
    });
  }

  console.log(`  ✅ ${outputName} (${width}x${height})`);
  await page.close();
}

async function main() {
  console.log('🚀 Play Store 그래픽 에셋 생성 시작...\n');

  const browser = await puppeteer.launch({ headless: true });

  // 1. Feature Graphic
  console.log('[1/3] Feature Graphic');
  await exportHTML(
    browser,
    resolve(__dirname, '01-feature-graphic.html'),
    '.container',
    'feature-graphic-1024x500.png',
    1024, 500
  );

  // 2. App Icon
  console.log('[2/3] App Icon');
  await exportHTML(
    browser,
    resolve(__dirname, '02-icon-512.html'),
    '.icon',
    'icon-512x512.png',
    512, 512
  );

  // 3. Screenshots
  console.log('[3/3] Screenshots (8장)');
  const screenshotPath = resolve(__dirname, 'screenshots.html');
  for (let i = 1; i <= 8; i++) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 2000, deviceScaleFactor: 1 });
    await page.goto(`file:///${screenshotPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

    const el = await page.$(`#ss${i}`);
    if (el) {
      await el.screenshot({
        path: resolve(OUTPUT_DIR, `screenshot-0${i}.png`),
        type: 'png',
      });
      console.log(`  ✅ screenshot-0${i}.png (1080x1920)`);
    } else {
      console.error(`  ❌ #ss${i} not found`);
    }
    await page.close();
  }

  await browser.close();
  console.log(`\n✨ 완료! 파일 위치: ${OUTPUT_DIR}`);
}

main().catch(console.error);
