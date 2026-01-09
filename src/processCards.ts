// Process a CSV of cards, turning each into a CreditCard object.

import fs from 'fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { env } from './envVars.ts';

export class CreditCard {
    number: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    zip: string;

  constructor(number: string, expMonth: string, expYear: string, cvv: string) {
    this.number = number;
    this.expMonth = expMonth;
    this.expYear = expYear;
    this.cvv = cvv;
    this.zip = env.ZIP_CODE;
  }
}

/**
 * Parses expiration date from various formats (MM/YY, MMYY, M/YY, MYY)
 * Returns [month, year] as strings
 */
export function parseExpirationDate(expDate: string): [string, string] {
  // Remove any slashes and spaces
  const cleaned = expDate.replace(/[\/\s]/g, '');
  
  // Should be 3 or 4 digits now
  if (cleaned.length === 3) {
    // Format: MYY (e.g., "323" for 03/23)
    return [cleaned.substring(0, 1), cleaned.substring(1)];
  } else if (cleaned.length === 4) {
    // Format: MMYY (e.g., "0323" for 03/23)
    return [cleaned.substring(0, 2), cleaned.substring(2)];
  } else {
    throw new Error(`Invalid expiration date format: ${expDate}. Expected MM/YY or MMYY`);
  }
}

export function processCards(csvPath: string): CreditCard[] {
  const csvPathToUse = csvPath ? path.resolve(csvPath) : env.CARDS_CSV ? path.resolve(env.CARDS_CSV) : path.resolve('./sample_cards.csv');
  const fileContent = fs.readFileSync(csvPathToUse, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});
  return records.map((record: any) => {
    // Check if expiration is in separate columns or single column
    if (record.expMonth && record.expYear) {
      // Separate columns: expMonth, expYear
      return new CreditCard(
        record.number,
        record.expMonth,
        record.expYear,
        record.cvv
      );
    } else if (record.expiration || record.exp || record.expirationDate) {
      // Single column format: parse it
      const expDate = record.expiration || record.exp || record.expirationDate;
      const [expMonth, expYear] = parseExpirationDate(expDate);
      return new CreditCard(
        record.number,
        expMonth,
        expYear,
        record.cvv
      );
    } else {
      throw new Error('CSV must have either expMonth/expYear columns or an expiration/exp/expirationDate column');
    }
  });
}