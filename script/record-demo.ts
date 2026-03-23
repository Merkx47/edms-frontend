import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://main.d29j032hx40434.amplifyapp.com';

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Total narration: ~397s. Each module gets proportional screen time.
// Intro (2 paragraphs) ~18s, then ~15 modules at ~25s each = ~375s + 22s outro

async function main() {
  const outputDir = path.resolve(__dirname, '../demo-recordings');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  console.log('🎬 Starting demo recording (synced to narration)...\n');

  // ==========================================
  // INTRO + LOGIN (~18s narration)
  // ==========================================
  console.log('1. Login + Intro');
  await page.goto(BASE, { waitUntil: 'load' });
  await sleep(2000);
  const loginBtn = page.locator('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Continue"), button:has-text("Azure")');
  if (await loginBtn.count() > 0) {
    await loginBtn.first().click();
    await sleep(3000);
  }
  // Dismiss tour
  await page.evaluate(() => {
    localStorage.setItem('onboarding-complete', 'true');
    localStorage.setItem('tour-dismissed', 'true');
  });
  try {
    const skip = page.locator('button:has-text("Skip")');
    if (await skip.isVisible({ timeout: 1500 })) await skip.click();
  } catch { /* ok */ }
  await sleep(8000); // Let intro narration play over dashboard

  // ==========================================
  // OVERVIEW DASHBOARD (~25s narration)
  // ==========================================
  console.log('2. Overview Dashboard');
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  try {
    const skip = page.locator('button:has-text("Skip")');
    if (await skip.isVisible({ timeout: 1000 })) await skip.click();
  } catch { /* ok */ }
  await sleep(6000);
  await page.mouse.wheel(0, 300);
  await sleep(5000);
  await page.mouse.wheel(0, 400);
  await sleep(5000);
  await page.mouse.wheel(0, 400);
  await sleep(4000);
  await page.mouse.wheel(0, -1100);
  await sleep(3000);

  // ==========================================
  // COST ANALYTICS (~30s narration - longest section)
  // ==========================================
  console.log('3. Cost Analytics');
  await page.goto(`${BASE}/analytics`, { waitUntil: 'load' });
  await sleep(5000);
  for (const tabName of ['By Service', 'By Region', 'By Tenant', 'Trend', 'Comparison']) {
    try {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible({ timeout: 1500 })) {
        await tab.click({ timeout: 3000 });
        await sleep(4000);
      }
    } catch { /* skip */ }
  }
  await page.mouse.wheel(0, 400);
  await sleep(4000);

  // ==========================================
  // RESOURCES (~25s narration)
  // ==========================================
  console.log('4. Resources');
  await page.goto(`${BASE}/resources`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 300);
  await sleep(5000);
  await page.mouse.wheel(0, 300);
  await sleep(5000);
  await page.mouse.wheel(0, -600);
  await sleep(4000);

  // ==========================================
  // RECOMMENDATIONS (~28s narration)
  // ==========================================
  console.log('5. Recommendations');
  await page.goto(`${BASE}/recommendations`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(5000);
  try {
    const histTab = page.locator('[role="tab"]:has-text("History")');
    if (await histTab.isVisible({ timeout: 1500 })) {
      await histTab.click({ timeout: 3000 });
      await sleep(5000);
    }
  } catch { /* skip */ }
  await sleep(5000);

  // ==========================================
  // TENANTS (~28s narration)
  // ==========================================
  console.log('6. Tenants');
  await page.goto(`${BASE}/tenants`, { waitUntil: 'load' });
  await sleep(5000);
  await page.mouse.wheel(0, 300);
  await sleep(4000);
  // Click into first tenant
  try {
    const tenantCard = page.locator('[role="button"]').first();
    if (await tenantCard.isVisible({ timeout: 1500 })) {
      await tenantCard.click({ timeout: 3000 });
      await sleep(4000);
      for (const tab of ['Resources', 'Activity', 'Access']) {
        try {
          const t = page.locator(`[role="tab"]:has-text("${tab}")`);
          if (await t.isVisible({ timeout: 1000 })) {
            await t.click({ timeout: 2000 });
            await sleep(3000);
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  await sleep(3000);

  // ==========================================
  // TAG GOVERNANCE (~25s narration)
  // ==========================================
  console.log('7. Tag Governance');
  await page.goto(`${BASE}/tags`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(6000);

  // ==========================================
  // BUDGETS (~22s narration)
  // ==========================================
  console.log('8. Budget Management');
  await page.goto(`${BASE}/budgets`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(5000);

  // ==========================================
  // COST ALLOCATION (~18s narration)
  // ==========================================
  console.log('9. Cost Allocation');
  await page.goto(`${BASE}/allocation`, { waitUntil: 'load' });
  await sleep(8000);
  await page.mouse.wheel(0, 300);
  await sleep(6000);

  // ==========================================
  // REPORTS (~20s narration)
  // ==========================================
  console.log('10. Reports');
  await page.goto(`${BASE}/reports`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(5000);

  // ==========================================
  // WASTE DETECTION (~20s narration)
  // ==========================================
  console.log('11. Waste Detection');
  await page.goto(`${BASE}/waste`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 500);
  await sleep(6000);
  await page.mouse.wheel(0, 400);
  await sleep(5000);

  // ==========================================
  // NOTIFICATIONS (~15s narration)
  // ==========================================
  console.log('12. Notifications');
  await page.goto(`${BASE}/notifications`, { waitUntil: 'load' });
  await sleep(6000);
  await page.mouse.wheel(0, 300);
  await sleep(5000);

  // ==========================================
  // SUPPORT (~15s narration)
  // ==========================================
  console.log('13. Support');
  await page.goto(`${BASE}/support`, { waitUntil: 'load' });
  await sleep(5000);
  for (const tab of ['Chat', 'Phone']) {
    try {
      const t = page.locator(`[role="tab"]:has-text("${tab}"), button:has-text("${tab}")`).first();
      if (await t.isVisible({ timeout: 1000 })) {
        await t.click({ timeout: 2000 });
        await sleep(4000);
      }
    } catch { /* skip */ }
  }

  // ==========================================
  // HCS GUIDE (~15s narration)
  // ==========================================
  console.log('14. HCS Guide');
  await page.goto(`${BASE}/guide`, { waitUntil: 'load' });
  await sleep(5000);
  await page.mouse.wheel(0, 500);
  await sleep(5000);
  await page.mouse.wheel(0, 500);
  await sleep(4000);

  // ==========================================
  // SETTINGS (~20s narration)
  // ==========================================
  console.log('15. Settings');
  await page.goto(`${BASE}/settings`, { waitUntil: 'load' });
  await sleep(4000);
  for (const tab of ['Users', 'API Keys', 'Security']) {
    try {
      const t = page.locator(`[role="tab"]:has-text("${tab}")`);
      if (await t.isVisible({ timeout: 1000 })) {
        await t.click({ timeout: 2000 });
        await sleep(4000);
      }
    } catch { /* skip */ }
  }

  // ==========================================
  // DARK MODE (~22s narration for outro)
  // ==========================================
  console.log('16. Dark Mode + Outro');
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2000);
  // Toggle dark mode
  try {
    const headerBtns = page.locator('header button');
    const count = await headerBtns.count();
    for (let i = 0; i < count; i++) {
      const btn = headerBtns.nth(i);
      await btn.click({ timeout: 500 }).catch(() => {});
      await sleep(300);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (isDark) break;
    }
  } catch { /* skip */ }
  await sleep(3000);
  await page.goto(`${BASE}/analytics`, { waitUntil: 'load' });
  await sleep(4000);
  await page.goto(`${BASE}/tenants`, { waitUntil: 'load' });
  await sleep(4000);
  await page.goto(`${BASE}/guide`, { waitUntil: 'load' });
  await sleep(4000);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(6000); // Final hold on dashboard for closing narration

  // ==========================================
  // END
  // ==========================================
  console.log('\n✅ Demo recording complete!');

  await page.close();
  await context.close();
  await browser.close();

  console.log(`📁 Video saved to: ${outputDir}/`);
}

main().catch(console.error);
