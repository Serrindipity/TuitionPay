import { chromium } from 'playwright';
import { env } from './envVars.ts';
import { authenticate } from './auth.ts';
import { determineTransactionFeePercent, determineAmountToPayPerCard } from './pay.ts';

// Start the browser

const browser = await chromium.launch({ headless : env.HEADLESS });
const context = await browser.newContext();
const page = await context.newPage();

const transactionPage = await authenticate(page);

const transactionFee = await determineTransactionFeePercent(transactionPage);

console.log(`Amount to pay per card: ${determineAmountToPayPerCard(200, transactionFee)}`);

if (env.HEADLESS === false) {
  console.log('Running in non-headless mode; keeping browser open for inspection.');
} else {
  console.log('Headless mode; closing browser.');
  await context.close();
  await browser.close();
}