// Uses playwright to pay tuition with gift cards
import assert from 'node:assert';
import { error } from 'node:console';
import * as utils from './utils.ts';
import { clickTheStupidInitialPopup } from './utils.ts';
let Page: import('playwright').Page;

export const payWithInfo = async (page: typeof Page, cardNumber: string, cvv: string, zipCode: string, expirationDate: string, amount: number, assertFee: number | null = null) => {
  /*
  Pays tuition with a single gift card.
  */

  // Assert that expiration data is in the form NN/NN or N/NN
  const expDateRegex = /^(0?[1-9]|1[0-2])\/\d{2}$/;
  assert(expDateRegex.test(expirationDate), `Expiration date ${expirationDate} is not in the form MM/YY`);

  const unifiedExpirationDate = expirationDate.length === 4 ? '0' + expirationDate : expirationDate;

  await utils.goToMakePayment(page);

  await page.getByRole('textbox', { name: '$' }).click();
  await page.getByRole('textbox', { name: '$' }).fill('$' + amount.toString());

  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('option', { name: 'New credit or debit card A 2.' }).click();

  // Step 2: Fill in card details
  await fillCardDetails(page, cardNumber, cvv, zipCode, unifiedExpirationDate);

  await page.getByRole('button', { name: 'Continue' }).click();

  // Make sure that transaction fee exists, and optionally matches assertFee
  const transactionFeeArray = await page.getByText('$').first().textContent();
  if (transactionFeeArray) {
    const transactionFeeString = transactionFeeArray.replace('$', '').trim();
    const transactionFee = parseFloat(transactionFeeString);
    console.log(`Transaction fee: $${transactionFee.toFixed(2)}`);
    if (assertFee !== null) {
      assert(transactionFee === assertFee, `Transaction fee ${transactionFee} does not match expected fee ${assertFee}`);
    }
  } else {
    error('Could not find transaction fee');
  }
  // Me when I did not have
  await page.getByRole('checkbox', { name: 'I acknowledge that I have' }).click();
  await page.locator('bb-smart-pay-acknowledgment').getByRole('button', { name: 'Continue' }).click();

  // Last step: Review
  const totalArray = await page.getByLabel('Total').click();
  const totalString = (await page.getByLabel('Total').textContent())?.replace('Total $', '').trim();
  if (totalString) {
    const total = parseFloat(totalString);
    console.log(`Total charge: $${total.toFixed(2)}`);
    assert(total === 200.00, `Total charge ${total} does not match expected charge 200.00`); // Hardcoded FIXME
  } else {
    error('Could not find total charge');
  }

  // Submit
  await page.getByRole('button', { name: 'Pay $' }).click();

  assert((await page.title()).includes('Overview'), 'Did not return to Overview page after payment');
};

const fillCardDetails = async (page: typeof Page, cardNumber: string, cvv: string, zipCode: string, unifiedExpirationDate: string) => {
  /*
  Fills in card details on the payment page. Will break if not on the page where card details are entered.
  */
  await page.getByRole('textbox', { name: 'Card number' }).fill(cardNumber);
  await page.getByRole('textbox', { name: 'Expiration date' }).fill(unifiedExpirationDate);
  await page.getByRole('textbox', { name: 'Security code' }).fill(cvv);
  await page.getByRole('textbox', { name: 'Zip/Postal code' }).fill(zipCode);
}

export const getRemainingBalance = async (page: typeof Page): Promise<number> => {
  /*
  Gets the remaining balance after a payment.
  */

  // Return to overview
  await utils.goToOverview(page);

  console.log('Retrieving remaining balance...');

  // Locate balance indicator
  const balanceString: string = (await page.locator('bb-overview-header').getByText('$').allTextContents())[0];
  const balance: number = parseFloat(balanceString.replace('Balance: $', '').replace(',', '').trim());
  console.log(`Remaining balance: $${balance.toFixed(2)}`);
  return balance;
}

export const determineTransactionFeePercent = async (page: typeof Page): Promise<number> => {
  /*
  Determines the transaction fee by filling in the payment form. Returns the percent: i.e. 2.85% will return 2.85
  */

  await clickTheStupidInitialPopup(page);


  console.log(`Determining transaction fee...`);

  await utils.goToMakePayment(page);

  console.log('Filling in dummy amount...');

  await page.getByRole('textbox', { name: '$' }).click();
  await page.getByRole('textbox', { name: '$' }).fill("$0.01");

  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.waitForSelector('text=applies to credit and debit card payments');
  const feeArray = await page.getByText('applies to credit and debit card payments').allTextContents();


  console.log(feeArray);

  const feeMatch = feeArray[0].match(/(\d.\d\d)%/);
  if (feeMatch) {
    const feePercent = parseFloat(feeMatch[1]);
    console.log(`Determined transaction fee is (${feePercent}%)`);
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    return feePercent;
  } else {
    throw new Error('Could not determine transaction fee percentage');
  }
}

export const determineAmountToPayPerCard = (totalAmount: number, transactionFeePercent: number): number => {
  /*
  Determines the amount to pay such that after transaction fees, the totalAmount is paid.
  */
  const amountToPay = totalAmount / (1 + (transactionFeePercent / 100));
  return parseFloat(amountToPay.toFixed(2));
}