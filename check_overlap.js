import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HTML_PATH = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;

async function checkOverlap() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(HTML_PATH);

  // Inspect bounding boxes of badges vs titles in cards
  const cards = await page.locator('.dim-card').all();
  console.log(`Found ${cards.length} cards rendered.`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const badge = await card.locator('.badge-pill').boundingBox();
    const title = await card.locator('.card-title-lg').boundingBox();
    const kicker = await card.locator('.card-kicker').boundingBox();
    
    console.log(`Card ${i + 1}:`);
    console.log(`  Kicker: y=${kicker.y}, right=${kicker.x + kicker.width}`);
    console.log(`  Title:  y=${title.y}, right=${title.x + title.width}`);
    console.log(`  Badge:  x=${badge.x}, y=${badge.y}, width=${badge.width}, height=${badge.height}`);

    // Check collision
    const overlapsTitle = (badge.x < title.x + title.width) && (badge.y < title.y + title.height);
    const overlapsKicker = (badge.x < kicker.x + kicker.width) && (badge.y < kicker.y + kicker.height);

    if (overlapsTitle || overlapsKicker) {
      console.warn(`  ⚠️ OVERLAP DETECTED on Card ${i + 1}! Badge intersects text.`);
    } else {
      console.log(`  ✅ Card ${i + 1} clean.`);
    }
  }

  await page.locator('#dimensiones').screenshot({ path: 'screenshots/overlap-debug.png' });
  await browser.close();
}

checkOverlap();
