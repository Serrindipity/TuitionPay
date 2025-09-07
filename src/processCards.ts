// Process a CSV of cards, turning each into a CreditCard object.

import fs from 'fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { env } from './envVars.js';

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

export function processCards() {
  const csvPath = env.CARDS_CSV ? path.resolve(env.CARDS_CSV) : path.resolve('./cards.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});
  return records.map((record: any) => new CreditCard(
    record.number,
    record.expMonth,
    record.expYear,
    record.cvv
  ));
}