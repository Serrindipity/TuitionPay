// Uses playwright to pay tuition with gift cards

import { chromium, devices } from 'playwright';

(async () => {
  // Setup
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 11']);
  const page = await context.newPage();

  // The actual interesting bit
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');


  // Teardown
  await context.close();
  await browser.close();
})();