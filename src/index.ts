import { chromium } from 'playwright';
import { env } from './envVars.ts';
import { authenticate } from './auth.ts';
import { determineTransactionFeePercent, determineAmountToPayPerCard, payManually, payWithInfo, getRemainingBalance } from './pay.ts';
import { processCards, CreditCard, parseExpirationDate } from './processCards.ts';
import fs from 'fs';
import readline from 'node:readline';

// Helper Types
type PaymentContext = {
  page: any;
  initialBalance: number;
  payPerCard: number;
};

// Helper Functions

/**
 * Checks if we should stop before the next payment to avoid exceeding target
 * Returns true if should stop, false if should continue
 */
async function shouldStopBeforePayment(context: PaymentContext): Promise<boolean> {
  if (env.TARGET_PAYMENT === undefined) return false;

  const balance = await getRemainingBalance(context.page);
  const amountPaidSoFar = context.initialBalance - balance;
  const remainingToTarget = env.TARGET_PAYMENT - amountPaidSoFar;

  if (remainingToTarget <= 0) {
    console.log(`\nTarget payment of $${env.TARGET_PAYMENT.toFixed(2)} reached!`);
    console.log(`Total paid: $${amountPaidSoFar.toFixed(2)}`);
    console.log(`Remaining balance: $${balance.toFixed(2)}`);
    return true;
  }

  if (remainingToTarget < context.payPerCard) {
    console.log(`\n⚠️  Stopping before next payment to avoid exceeding target`);
    console.log(`Amount remaining to target: $${remainingToTarget.toFixed(2)}`);
    console.log(`Next payment would be: $${context.payPerCard.toFixed(2)}`);
    console.log(`Total paid so far: $${amountPaidSoFar.toFixed(2)}`);
    console.log(`Current balance: $${balance.toFixed(2)}`);
    return true;
  }

  return false;
}

/**
 * Logs payment progress including target information if applicable
 */
function logPaymentProgress(context: PaymentContext, balance: number): void {
  const amountPaid = context.initialBalance - balance;
  console.log(`Remaining balance: $${balance.toFixed(2)}`);

  if (env.TARGET_PAYMENT !== undefined) {
    const remainingToTarget = env.TARGET_PAYMENT - amountPaid;
    const paymentsRemaining = Math.ceil(remainingToTarget / context.payPerCard);
    console.log(`Amount paid towards target: $${amountPaid.toFixed(2)} / $${env.TARGET_PAYMENT.toFixed(2)}`);
    console.log(`Remaining to target: $${Math.max(0, remainingToTarget).toFixed(2)}`);
    console.log(`Estimated payments remaining: ${Math.max(0, paymentsRemaining)}`);
  }
}

/**
 * Processes a single card payment
 */
async function processCardPayment(
  context: PaymentContext,
  card: CreditCard,
  cardLabel: string
): Promise<{ balance: number; shouldStop: boolean }> {
  console.log(`\nProcessing ${cardLabel} ending in ${card.number.slice(-4)}...`);
  await payWithInfo(context.page, card, context.payPerCard);
  const balance = await getRemainingBalance(context.page);

  logPaymentProgress(context, balance);

  const shouldStop = balance <= 0;
  if (shouldStop) {
    console.log('Balance paid in full!');
  }

  return { balance, shouldStop };
}

/**
 * Displays initial target payment information
 */
function displayTargetInfo(initialBalance: number, payPerCard: number): void {
  if (env.TARGET_PAYMENT !== undefined) {
    const targetBalance = initialBalance - env.TARGET_PAYMENT;
    const paymentsNeeded = Math.ceil(env.TARGET_PAYMENT / payPerCard);
    console.log(`Target payment: $${env.TARGET_PAYMENT.toFixed(2)}`);
    console.log(`Target balance after payments: $${targetBalance.toFixed(2)}`);
    console.log(`Estimated payments needed: ${paymentsNeeded}`);
  }
}

/**
 * Displays current status for manual entry mode
 */
async function displayManualEntryStatus(context: PaymentContext): Promise<void> {
  const currentBalance = await getRemainingBalance(context.page);
  console.log('Current balance is $' + currentBalance.toFixed(2));

  if (env.TARGET_PAYMENT !== undefined) {
    const amountPaidSoFar = context.initialBalance - currentBalance;
    const remainingToTarget = env.TARGET_PAYMENT - amountPaidSoFar;
    console.log(`Target payment: $${env.TARGET_PAYMENT.toFixed(2)}`);
    console.log(`Amount paid so far: $${amountPaidSoFar.toFixed(2)}`);
    console.log(`Remaining to target: $${Math.max(0, remainingToTarget).toFixed(2)}`);
  }
}

/**
 * Warns user if approaching target payment limit (for manual entry)
 */
async function warnIfApproachingTarget(context: PaymentContext): Promise<void> {
  if (env.TARGET_PAYMENT === undefined) return;

  const balance = await getRemainingBalance(context.page);
  const amountPaidSoFar = context.initialBalance - balance;
  const remainingToTarget = env.TARGET_PAYMENT - amountPaidSoFar;

  if (remainingToTarget > 0 && remainingToTarget < context.payPerCard) {
    console.log(`\n⚠️  Approaching target payment limit`);
    console.log(`Amount remaining to target: $${remainingToTarget.toFixed(2)}`);
    console.log(`Next payment would be: $${context.payPerCard.toFixed(2)}`);
    console.log(`Consider stopping or adjusting payment amount.`);
  }
}

// Main Script

// Start the browser
const browser = await chromium.launch({ headless : env.HEADLESS });
const context = await browser.newContext();
const page = await context.newPage();

const transactionPage = await authenticate(page);

const transactionFee = await determineTransactionFeePercent(transactionPage);

const amountPerCard = parseFloat(env.AMOUNT_PER_CARD);
const payPerCard = determineAmountToPayPerCard(amountPerCard, transactionFee);
console.log(`Amount to pay per card: ${payPerCard}`);

// Get initial balance
const initialBalance = await getRemainingBalance(transactionPage);
console.log(`Current balance: $${initialBalance.toFixed(2)}`);

// Display target information if set
displayTargetInfo(initialBalance, payPerCard);

// Create payment context
const paymentContext: PaymentContext = {
  page: transactionPage,
  initialBalance,
  payPerCard,
};

// Try to load cards from CSV, if invalid/missing, prompt for manual entry
let cards: CreditCard[] = [];
let useManualEntry = false;

if (env.CARDS_CSV) {
  try {
    // Check if file exists
    if (fs.existsSync(env.CARDS_CSV)) {
      cards = processCards(env.CARDS_CSV);
      console.log(`Loaded ${cards.length} cards from ${env.CARDS_CSV}`);
    } else {
      console.log(`Card CSV file not found at: ${env.CARDS_CSV}`);
      useManualEntry = true;
    }
  } catch (error) {
    console.error(`Error loading cards from CSV: ${error}`);
    useManualEntry = true;
  }
} else {
  console.log('No CARDS_CSV path specified in environment.');
  useManualEntry = true;
}

// Process cards from CSV
if (cards.length > 0) {
  let cardIndex = 0;
  for (const card of cards) {
    cardIndex++;
    
    // Check if we should stop before this payment
    if (await shouldStopBeforePayment(paymentContext)) {
      break;
    }
    
    const result = await processCardPayment(
      paymentContext,
      card,
      `card ${cardIndex}/${cards.length}`
    );
    
    if (result.shouldStop) {
      break;
    }
  }
}

// Manual entry mode
if (useManualEntry) {
  console.log('\n=== Manual Card Entry Mode ===');
  await displayManualEntryStatus(paymentContext);
  console.log('Enter card details. Type "done" for card number to stop, or Ctrl-c to cancel.\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (str: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(str, (answer) => {
        resolve(answer);
      });
    });
  };

  let continueEntry = true;
  let paymentCount = 0;
  
  while (continueEntry) {
    // Check if we should stop before prompting for next card
    if (await shouldStopBeforePayment(paymentContext)) {
      break;
    }
    
    // Warn if approaching target
    await warnIfApproachingTarget(paymentContext);
    
    const cardNumber = await question('Card Number (or "done" to finish): ');
    
    if (cardNumber.toLowerCase() === 'done') {
      continueEntry = false;
      break;
    }
    
    const expirationDate = await question('Expiration Date (MM/YY or MMYY): ');
    const cvv = await question('CVV: ');
    
    // Parse expiration date to get month and year
    const [expMonth, expYear] = parseExpirationDate(expirationDate);
    const card = new CreditCard(cardNumber, expMonth, expYear, cvv);
    
    paymentCount++;
    const result = await processCardPayment(
      paymentContext,
      card,
      `card #${paymentCount}`
    );
    
    // Add extra newline for readability in manual mode
    if (!result.shouldStop && env.TARGET_PAYMENT !== undefined) {
      console.log('');
    }
    
    if (result.shouldStop) {
      continueEntry = false;
    }
  }
  
  rl.close();
}

// Close the browser unless in non-headless mode
if (env.HEADLESS === false) {
  console.log('Running in non-headless mode; keeping browser open for inspection.');
} else {
  console.log('Headless mode; closing browser.');
  await context.close();
  await browser.close();
}