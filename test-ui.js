import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_PATH = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;
const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

const DIMENSION_TABS = [
  { id: '#tab-balance', name: '1. La Mejor Balanceada' },
  { id: '#tab-precio', name: '2. Mejor Precio / Economía' },
  { id: '#tab-velocidad', name: '3. Velocidad Máxima' },
  { id: '#tab-capacidad', name: '4. Capacidad Máxima' },
  { id: '#tab-concurrencia', name: '5. Concurrencia & Agentes' }
];

async function runUITests() {
  console.log('='.repeat(70));
  console.log('🚀 PLAYWRIGHT UI QA & VISUAL OVERFLOW TEST SUITE');
  console.log(`📄 Target: ${HTML_PATH}`);
  console.log(`📁 Output: ${SCREENSHOTS_DIR}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  let totalIssues = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n🔍 Viewport Test: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      // Listen to console and page errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error(`   ❌ [${vp.name}] Console Error:`, msg.text());
          totalIssues++;
        }
      });
      page.on('pageerror', err => {
        console.error(`   ❌ [${vp.name}] Uncaught Page Error:`, err.message);
        totalIssues++;
      });

      await page.goto(HTML_PATH, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Check root overflow
      const rootOverflow = await page.evaluate(() => {
        const bodyW = document.body.clientWidth;
        const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        return { bodyW, scrollW, overflow: scrollW - bodyW };
      });

      if (rootOverflow.overflow > 1) {
        console.warn(`   ⚠️ [${vp.name}] Horizontal Root Overflow detected: +${rootOverflow.overflow}px`);
        totalIssues++;
      } else {
        console.log(`   ✅ [${vp.name}] Clean layout: No root overflow.`);
      }

      // Capture initial screenshots
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${vp.name}-viewport.png`) });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${vp.name}-fullpage.png`), fullPage: true });

      // Test all 5 Dimension Tabs
      console.log(`\n   🔘 Testing 5 Dimension Tabs in ${vp.name.toUpperCase()}:`);
      for (const tab of DIMENSION_TABS) {
        const tabBtn = page.locator(tab.id);
        await tabBtn.click();
        await page.waitForTimeout(300);

        // Verify podium rendered 3 cards
        const cardCount = await page.locator('.dim-card').count();
        const buildTotal = await page.locator('#parts-table .highlight').innerText();
        const simTps = await page.locator('#res-tps').innerText();

        if (cardCount !== 3) {
          console.error(`   ❌ [${tab.name}] Expected 3 cards in podium, got: ${cardCount}`);
          totalIssues++;
        } else {
          console.log(`   ✅ [${tab.name}] Rendered 3 cards | Build: ${buildTotal.replace(/\s+/g, ' ')} | Sim: ${simTps}`);
        }

        const safeName = tab.id.replace('#', '');
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `${vp.name}-${safeName}.png`)
        });
      }

      // Test Currency Switch
      console.log(`\n   💱 Testing Currency Switch (USD) in ${vp.name.toUpperCase()}:`);
      await page.click('#btn-usd');
      await page.waitForTimeout(200);
      const usdTotal = await page.locator('#parts-table .highlight').innerText();
      console.log(`   ✅ Currency switched to USD: ${usdTotal.replace(/\s+/g, ' ')}`);
      await page.click('#btn-clp');

      await context.close();
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    totalIssues++;
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 FINAL QA & VALIDATION REPORT: ${totalIssues === 0 ? 'ALL CHECKS PASSED ✅' : `${totalIssues} ISSUES FOUND ❌`}`);
  console.log('='.repeat(70));
}

runUITests();
