/**
 * Narrated demo recorder.
 *
 * Strategy: For each segment:
 * 1. Navigate to the page (click sidebar)
 * 2. Wait 2s pre-speech pause
 * 3. Sleep for EXACTLY the audio clip duration (audio gets overlaid later)
 * 4. Execute any mid-segment actions (tab clicks) at the right moment
 * 5. 1s buffer, then next segment
 *
 * The video timing is driven by the pre-measured audio durations,
 * so when we overlay audio later, they're perfectly synced.
 */
import { chromium, Page } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://main.d29j032hx40434.amplifyapp.com';
const DEMO_DIR = path.resolve(__dirname, '../demo-recordings');
const DURATIONS_FILE = path.join(DEMO_DIR, 'audio_durations.json');

interface Segment {
  id: string;
  route: string;
  preSpeechPause: number;
  narration: string;
  actions: string[];
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function clickSidebar(page: Page, label: string) {
  const routeMap: Record<string, string> = {
    'Overview': '/', 'Cost Analytics': '/analytics', 'Resources': '/resources',
    'Recommendations': '/recommendations', 'Tenants': '/tenants',
    'Tag Governance': '/tags', 'Budgets': '/budgets', 'Cost Allocation': '/allocation',
    'Reports': '/reports', 'Waste Detection': '/waste', 'Notifications': '/notifications',
    'Support': '/support', 'HCS Guide': '/guide', 'Settings': '/settings',
  };

  const testId = `nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`;
  try {
    const nav = page.locator(`[data-testid="${testId}"]`);
    if (await nav.isVisible({ timeout: 2000 })) {
      await nav.click({ timeout: 3000 });
      await sleep(2000);
      return;
    }
  } catch {}

  // Fallback
  await page.goto(`${BASE}${routeMap[label] || '/'}`, { waitUntil: 'load' });
  await sleep(2000);
}

const segToNav: Record<string, string> = {
  'dashboard': 'Overview', 'analytics': 'Cost Analytics', 'resources': 'Resources',
  'recommendations': 'Recommendations', 'tenants': 'Tenants', 'tags': 'Tag Governance',
  'budgets': 'Budgets', 'allocation': 'Cost Allocation', 'reports': 'Reports',
  'waste': 'Waste Detection', 'notifications': 'Notifications', 'support': 'Support',
  'guide': 'HCS Guide', 'settings': 'Settings',
};

async function main() {
  // Read segment definitions and pre-measured audio durations
  const segments: Segment[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'demo-segments.json'), 'utf-8')
  );
  const audioDurations: Record<string, number> = JSON.parse(
    fs.readFileSync(DURATIONS_FILE, 'utf-8')
  );

  const FRAMES_DIR = path.join(DEMO_DIR, 'frames');
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // renders at 3840x2160 pixel-perfect
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Screenshot-based recording for crystal clear 4K
  // Instead of real-time capture (which drifts due to screenshot overhead),
  // we take snapshots at key moments and duplicate frames to fill time.
  let frameCount = 0;
  const FPS = 5;

  // Take a screenshot and duplicate it for `durationMs` worth of frames
  async function captureHold(durationMs: number) {
    const numFrames = Math.max(1, Math.round((durationMs / 1000) * FPS));
    const padded = String(frameCount).padStart(6, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${padded}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    frameCount++;
    // Duplicate the same frame for the remaining count
    for (let i = 1; i < numFrames; i++) {
      const dupPadded = String(frameCount).padStart(6, '0');
      fs.copyFileSync(framePath, path.join(FRAMES_DIR, `frame_${dupPadded}.png`));
      frameCount++;
    }
  }

  console.log('Recording narrated demo (screenshot mode, 4K)...\n');

  // Replace sleep with frame-capturing version during recording.
  // This ensures video duration matches exactly what the audio expects.
  const origSleep = sleep;
  // Redefine sleep to capture frames + wait for page to settle
  const recSleep = async (ms: number) => {
    // First, wait for the page to settle (for transitions/animations)
    await origSleep(Math.min(ms, 1500));
    // Then capture frames for the full duration
    await captureHold(ms);
  };

  // Video time = frameCount / FPS (not wall clock)
  const videoTime = () => frameCount / FPS;

  // Write timestamps as we go (for subtitle generation)
  const timestamps: Record<string, { start: number; end: number; duration: number }> = {};

  // Helper: navigate via sidebar + capture the transition
  async function navTo(label: string) {
    await clickSidebar(page, label);
    await recSleep(1000); // capture the page load
  }

  for (const seg of segments) {
    const segStart = videoTime();
    const speechDur = audioDurations[seg.id] || 10;
    const prePause = seg.preSpeechPause;
    const isSubSegment = prePause === 0;
    const navLabel = segToNav[seg.id] || segToNav[seg.id.replace(/_.*/, '')];

    // === NAVIGATE ===
    if (seg.id === 'intro') {
      await page.goto(BASE, { waitUntil: 'load' });
      await origSleep(1500); // wait for page
      await recSleep(2000); // capture login page beauty
      await page.evaluate(() => {
        localStorage.setItem('onboarding-complete', 'true');
        localStorage.setItem('tour-dismissed', 'true');
      });
      try {
        const btn = page.locator('button:has-text("Sign in"), button:has-text("Azure"), button:has-text("Continue")');
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.first().click();
          await origSleep(1500);
          await recSleep(1500); // capture post-login
        }
      } catch {}
      try {
        const skip = page.locator('button:has-text("Skip")');
        if (await skip.isVisible({ timeout: 1500 })) await skip.click();
      } catch {}
    } else if (seg.id === 'darkmode') {
      // Navigate to Overview first, THEN toggle dark mode
      await navTo('Overview');
    } else if (isSubSegment) {
      // Stay on current page
    } else if (navLabel) {
      await navTo(navLabel);
    }

    // === PRE-SPEECH PAUSE ===
    if (prePause > 0) {
      await recSleep(prePause * 1000);
    }

    const speechStart = videoTime();

    // === HOLD SCREEN FOR SPEECH DURATION ===
    const actions = seg.actions || [];
    const speechFrames = Math.round(speechDur * FPS);

    if (actions.length === 0) {
      // No actions — hold steady for speech duration
      await recSleep(speechDur * 1000);
    } else {
      // Execute actions, capture frames between them
      let framesUsed = 0;
      for (const action of actions) {
        if (action.startsWith('wait:')) {
          const w = parseFloat(action.split(':')[1]) * 1000;
          await recSleep(w);
          framesUsed += Math.round((w / 1000) * FPS);
        } else if (action === 'dismiss_tour') {
          try {
            const skip = page.locator('button:has-text("Skip")');
            if (await skip.isVisible({ timeout: 1000 })) await skip.click();
          } catch {}
        } else if (action.startsWith('click_tab:')) {
          const tab = action.split(':')[1];
          try {
            const el = page.locator(`[role="tab"]:has-text("${tab}"), button:has-text("${tab}")`).first();
            if (await el.isVisible({ timeout: 2000 })) {
              await el.click({ timeout: 3000 });
              await origSleep(800); // let tab render
            }
          } catch {}
        } else if (action === 'click_first_tenant') {
          try {
            const card = page.locator('[role="button"]').first();
            if (await card.isVisible({ timeout: 2000 })) {
              await card.click({ timeout: 3000 });
              await origSleep(800);
            }
          } catch {}
        } else if (action === 'toggle_dark') {
          try {
            const toggleBtn = page.locator('[data-testid="button-theme-toggle"]');
            if (await toggleBtn.isVisible({ timeout: 3000 })) {
              await toggleBtn.click({ timeout: 3000 });
              await origSleep(800); // let dark mode transition render
            }
          } catch {}
          await recSleep(1500); // capture dark mode beauty
        } else if (action.startsWith('goto:')) {
          const route = action.split(':')[1];
          const routeToNav: Record<string, string> = {
            '/': 'Overview', '/analytics': 'Cost Analytics', '/resources': 'Resources',
            '/recommendations': 'Recommendations', '/tenants': 'Tenants',
            '/tags': 'Tag Governance', '/budgets': 'Budgets', '/allocation': 'Cost Allocation',
            '/reports': 'Reports', '/waste': 'Waste Detection', '/guide': 'HCS Guide',
          };
          const navLabel2 = routeToNav[route];
          if (navLabel2) { await clickSidebar(page, navLabel2); await origSleep(800); }
          else { await page.goto(`${BASE}${route}`, { waitUntil: 'load' }); await origSleep(1000); }
          await recSleep(500); // capture new page
        }
      }
      // Fill remaining speech time with held frame
      const framesNeeded = speechFrames - (Math.round((videoTime() - speechStart) * FPS));
      if (framesNeeded > 0) {
        await recSleep((framesNeeded / FPS) * 1000);
      }
    }

    // === POST-SPEECH BUFFER ===
    await recSleep(800);

    const segEnd = videoTime();
    timestamps[seg.id] = {
      start: segStart,
      end: segEnd,
      duration: segEnd - segStart,
    };

    console.log(`  ${seg.id.padEnd(25)} speech:${speechDur.toFixed(1)}s  video:${(segEnd - segStart).toFixed(1)}s`);
  }

  // Write timestamps
  fs.writeFileSync(
    path.join(DEMO_DIR, 'timestamps.json'),
    JSON.stringify(timestamps, null, 2)
  );

  const totalVideoSec = videoTime();
  console.log(`\nCapture done! ${frameCount} frames = ${totalVideoSec.toFixed(0)}s (${(totalVideoSec/60).toFixed(1)} min)`);
  console.log(`Assembling ${frameCount} frames into 4K video at ${FPS}fps...`);

  // Assemble frames into video with ffmpeg
  const framesPattern = path.join(FRAMES_DIR, 'frame_%06d.png');
  const rawVideo = path.join(DEMO_DIR, 'raw_4k.mp4');
  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${framesPattern}" -c:v libx264 -preset slow -crf 1 -pix_fmt yuv420p -movflags +faststart "${rawVideo}"`,
    { stdio: 'inherit', timeout: 300000 }
  );

  console.log(`4K video: ${rawVideo}`);
  console.log(`Cleaning up ${frameCount} frame files...`);
  fs.rmSync(FRAMES_DIR, { recursive: true });

  await page.close();
  await context.close();
  await browser.close();
}

main().catch(console.error);
