import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HTML_PATH = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const widths = [1440, 1200, 1024, 800, 500, 390];
  
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(HTML_PATH);
    const navScroll = await page.evaluate(() => {
      const el = document.querySelector('.dim-nav');
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        hasHorizontalScroll: el.scrollWidth > el.clientWidth
      };
    });
    console.log(`Width ${w}px -> .dim-nav scrollWidth: ${navScroll.scrollWidth}px, clientWidth: ${navScroll.clientWidth}px, Scrollbar Visible: ${navScroll.hasHorizontalScroll}`);
    await page.locator('#dimensiones').screenshot({ path: `screenshots/dim-section-${w}px.png` });
    await page.close();
  }
  await browser.close();
}
inspect();
