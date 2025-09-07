import { env } from './envVars.ts';
import { chromium } from 'playwright'
import { authenticate } from './auth.ts';

// Start the browser

const browser = await chromium.launch({ headless : env.HEADLESS });
const page = await browser.newPage();

await page.goto(env.PORTAL_URL);
await page.getByTestId('sign-in').click();
await page.getByRole('textbox', { name: 'CalNet ID:*' }).click();
await page.getByRole('textbox', { name: 'CalNet ID:*' }).fill(env.USERNAME);
await page.getByRole('textbox', { name: 'Passphrase:*' }).click();
await page.getByRole('textbox', { name: 'Passphrase:*' }).fill(env.PASSWORD);
await page.getByRole('button', { name: 'Sign In' }).click();
await page.getByRole('button', { name: 'Yes, this is my device' }).click();
await page.goto('https://calcentral.berkeley.edu/dashboard');
await page.getByRole('link', { name: ' My Finances' }).click();
const page1Promise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Make Payment , this link' }).click();
const page1 = await page1Promise;
await page1.goto('https://commerce.cashnet.com/cashneti/static/epayment/ucbpay/overview');
await page1.getByRole('link', { name: 'Make a Payment' }).click();
