// @ts-check
// Logs into CalCentral and navigates to the "Make a Payment" page.

// import path from 'node:path';
import { env } from './envVars.ts';
import { clickTheStupidInitialPopup } from './utils.ts';
let Page: import('playwright').Page;


export const authenticate = async (page: typeof Page) => {
  /*
  Logs into the Portal and gets to the "Make a Payment" page. Returns that page.
  */
  // const authFile = path.join(__dirname, '../playwright/.auth/user.json');
  await page.goto(env.PORTAL_URL);
  await page.getByTestId('sign-in').click();
  await page.getByRole('textbox', { name: 'CalNet ID:*' }).click();
  await page.getByRole('textbox', { name: 'CalNet ID:*' }).fill(env.USERNAME);
  await page.getByRole('textbox', { name: 'Passphrase:*' }).click();
  await page.getByRole('textbox', { name: 'Passphrase:*' }).fill(env.PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Yes, this is my device' }).click();

  await page.getByRole('link', { name: ' My Finances' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Make Payment , this link' }).click();
  const page1 = await page1Promise;
  await page1.waitForLoadState('domcontentloaded');
  // await page1.goto('https://commerce.cashnet.com/cashneti/static/epayment/ucbpay/overview');
  // await page.context().storageState({ path: authFile });
  console.log('Authenticated and navigated to Make a Payment page.');
  return page1;
};