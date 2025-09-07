// @ts-check
// Logs into CalCentral

import path from 'path';
import { env } from './envVars.ts';



export const authenticate = async (browser, page) => {
//   const authFile = path.join(__dirname, '../playwright/.auth/user.json');
  // Perform authentication steps. Replace these actions with your own.
  await page.goto(env.PORTAL_URL);
  await page.getByLabel('username-input').fill(env.USERNAME);
  await page.getByLabel('password_input').fill(env.PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
//   await expect(page.getByRole('button', { name: 'View profile and more' })).toBeVisible();

  // End of authentication steps.

  // await page.context().storageState({ path: authFile });
};