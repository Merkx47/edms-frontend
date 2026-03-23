import { chromium, Page } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://main.d29j032hx40434.amplifyapp.com';
const DEMO_DIR = path.resolve(__dirname, '../demo-recordings');
const TIMINGS_FILE = path.join(DEMO_DIR, 'timings.json');

interface Timing {
  id: string;
  route: string;
  screenTimeMs: number;
  prePauseMs: number;
  speechMs: number;
  actions: string[];
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Click a sidebar nav link by its text label
async function clickSidebarNav(page: Page, label: string) {
  try {
    const navLink = page.locator(`[data-testid="nav-link-${label.toLowerCase().replace(/\s+/g, '-')}"]`);
    if (await navLink.isVisible({ timeout: 2000 })) {
      await navLink.click({ timeout: 3000 });
      await sleep(1500);
      return;
    }
  } catch { /* fallback */ }

  // Fallback: find by text in the sidebar
  try {
    const link = page.locator(`aside a:has-text("${label}"), aside [href] >> text="${label}"`).first();
    if (await link.isVisible({ timeout: 2000 })) {
      await link.click({ timeout: 3000 });
      await sleep(1500);
      return;
    }
  } catch { /* fallback to goto */ }

  // Final fallback
  await page.goto(`${BASE}${sidebarRouteMap[label] || '/'}`, { waitUntil: 'load' });
  await sleep(1500);
}

const sidebarRouteMap: Record<string, string> = {
  'Overview': '/',
  'Cost Analytics': '/analytics',
  'Resources': '/resources',
  'Recommendations': '/recommendations',
  'Tenants': '/tenants',
  'Tag Governance': '/tags',
  'Budgets': '/budgets',
  'Cost Allocation': '/allocation',
  'Reports': '/reports',
  'Waste Detection': '/waste',
  'Notifications': '/notifications',
  'Support': '/support',
  'HCS Guide': '/guide',
  'Settings': '/settings',
  'Help': '/help',
};

// Map segment ID to sidebar label
const segToNav: Record<string, string> = {
  'dashboard': 'Overview',
  'analytics': 'Cost Analytics',
  'resources': 'Resources',
  'recommendations': 'Recommendations',
  'tenants': 'Tenants',
  'tags': 'Tag Governance',
  'budgets': 'Budgets',
  'allocation': 'Cost Allocation',
  'reports': 'Reports',
  'waste': 'Waste Detection',
  'notifications': 'Notifications',
  'support': 'Support',
  'guide': 'HCS Guide',
  'settings': 'Settings',
};

async function executeActions(page: Page, actions: string[], totalMs: number) {
  if (actions.length === 0) {
    await sleep(totalMs);
    return;
  }

  // Distribute time across actions, but respect explicit waits
  let explicitWaitMs = 0;
  let actionCount = 0;
  for (const a of actions) {
    if (a.startsWith('wait:')) {
      explicitWaitMs += parseFloat(a.split(':')[1]) * 1000;
    } else {
      actionCount++;
    }
  }
  const remainingMs = Math.max(0, totalMs - explicitWaitMs);
  const perActionMs = actionCount > 0 ? remainingMs / actionCount : 0;

  for (const action of actions) {
    if (action.startsWith('wait:')) {
      await sleep(parseFloat(action.split(':')[1]) * 1000);
    } else if (action === 'dismiss_tour') {
      try {
        const skip = page.locator('button:has-text("Skip")');
        if (await skip.isVisible({ timeout: 1000 })) await skip.click();
      } catch { /* ok */ }
      await sleep(perActionMs);
    } else if (action.startsWith('click_tab:')) {
      const tabName = action.split(':')[1];
      try {
        const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
        if (await tab.isVisible({ timeout: 2000 })) await tab.click({ timeout: 3000 });
      } catch { /* skip */ }
      await sleep(perActionMs);
    } else if (action === 'click_first_tenant') {
      try {
        const card = page.locator('[role="button"]').first();
        if (await card.isVisible({ timeout: 2000 })) await card.click({ timeout: 3000 });
      } catch { /* skip */ }
      await sleep(perActionMs);
    } else if (action === 'toggle_dark') {
      try {
        const btns = page.locator('header button');
        const count = await btns.count();
        for (let i = 0; i < count; i++) {
          await btns.nth(i).click({ timeout: 500 }).catch(() => {});
          await sleep(200);
          const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
          if (isDark) break;
        }
      } catch { /* skip */ }
      await sleep(perActionMs);
    } else if (action.startsWith('goto:')) {
      const route = action.split(':')[1];
      const label = Object.entries(sidebarRouteMap).find(([_, r]) => r === route)?.[0];
      if (label) {
        await clickSidebarNav(page, label);
      } else {
        await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
        await sleep(1500);
      }
      await sleep(Math.max(0, perActionMs - 1500));
    } else {
      await sleep(perActionMs);
    }
  }
}

async function main() {
  const timings: Timing[] = JSON.parse(fs.readFileSync(TIMINGS_FILE, 'utf-8'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: DEMO_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  console.log('Recording synced demo...\n');

  // Track cumulative target time vs actual elapsed to stay in sync
  const globalStart = Date.now();
  let targetCumulativeMs = 0;

  for (const seg of timings) {
    const segStart = Date.now();
    const label = segToNav[seg.id];
    const samePageAsPrevious = seg.preSpeechPause === 0; // sub-segments stay on same page

    // Navigate by clicking sidebar (visible to viewer)
    if (seg.id === 'intro') {
      await page.goto(BASE, { waitUntil: 'load' });
      await sleep(1500);
      await page.evaluate(() => {
        localStorage.setItem('onboarding-complete', 'true');
        localStorage.setItem('tour-dismissed', 'true');
      });
      try {
        const loginBtn = page.locator('button:has-text("Sign in"), button:has-text("Azure"), button:has-text("Continue")');
        if (await loginBtn.isVisible({ timeout: 2000 })) {
          await loginBtn.first().click();
          await sleep(1500);
        }
      } catch { /* ok */ }
      try {
        const skip = page.locator('button:has-text("Skip")');
        if (await skip.isVisible({ timeout: 1500 })) await skip.click();
      } catch { /* ok */ }
    } else if (seg.id === 'darkmode' || samePageAsPrevious) {
      // Stay on current page
    } else if (label) {
      await clickSidebarNav(page, label);
    } else {
      await page.goto(`${BASE}${seg.route}`, { waitUntil: 'load' });
      await sleep(1000);
    }

    // Calculate how much time navigation already consumed
    const navElapsed = Date.now() - segStart;

    // Pre-speech pause (subtract what navigation already took)
    const adjustedPause = Math.max(0, seg.prePauseMs - navElapsed);
    await sleep(adjustedPause);

    // Execute actions during speech time
    const actionsStart = Date.now();
    await executeActions(page, seg.actions, seg.speechMs);

    // Post-speech buffer: ensure total segment time matches target
    targetCumulativeMs += seg.screenTimeMs;
    const actualElapsed = Date.now() - globalStart;
    const drift = actualElapsed - targetCumulativeMs;

    // If we're ahead of schedule, add buffer. If behind, skip buffer.
    const buffer = Math.max(0, 1000 - drift);
    await sleep(buffer);

    const segElapsed = Date.now() - segStart;
    const totalElapsed = Date.now() - globalStart;
    console.log(`  ${seg.id} (target:${(seg.screenTimeMs/1000).toFixed(1)}s actual:${(segElapsed/1000).toFixed(1)}s) [drift: ${(drift/1000).toFixed(1)}s]`);
  }

  const totalElapsed = (Date.now() - globalStart) / 1000;
  const targetTotal = targetCumulativeMs / 1000;
  console.log(`\nRecording complete! Target: ${targetTotal.toFixed(0)}s Actual: ${totalElapsed.toFixed(0)}s Drift: ${(totalElapsed - targetTotal).toFixed(1)}s`);

  await page.close();
  await context.close();
  await browser.close();
}

main().catch(console.error);
