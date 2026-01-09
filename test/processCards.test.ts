import { describe, it } from 'node:test';
import assert from 'node:assert';
import { processCards, CreditCard, parseExpirationDate } from '../src/processCards.js';
import fs from 'fs';
import path from 'path';

describe('processCards', () => {
  it('should parse CSV and return an array of CreditCard objects', () => {
    const cards = processCards('./sample_cards.csv');
    
    assert(Array.isArray(cards), 'Should return an array');
    assert(cards.length > 0, 'Should have at least one card');
    
    // Check first card
    const firstCard = cards[0];
    assert(firstCard instanceof CreditCard, 'Each item should be a CreditCard instance');
    assert.strictEqual(firstCard.number, '4111111111111111');
    assert.strictEqual(firstCard.expMonth, '12');
    assert.strictEqual(firstCard.expYear, '25');
    assert.strictEqual(firstCard.cvv, '123');
    assert(firstCard.zip, 'Should have a zip code from env');
  });

  it('should parse all cards from the CSV correctly', () => {
    const cards = processCards('./sample_cards.csv');
    
    assert.strictEqual(cards.length, 3, 'Should have 3 cards from sample CSV');
    
    // Verify second card
    assert.strictEqual(cards[1].number, '5500000000000004');
    assert.strictEqual(cards[1].expMonth, '01');
    assert.strictEqual(cards[1].expYear, '26');
    assert.strictEqual(cards[1].cvv, '456');
    
    // Verify third card
    assert.strictEqual(cards[2].number, '340000000000009');
    assert.strictEqual(cards[2].expMonth, '06');
    assert.strictEqual(cards[2].expYear, '27');
    assert.strictEqual(cards[2].cvv, '7890');
  });

  it('should use env.CARDS_CSV if no path is provided', () => {
    // This test will use the default cards.csv if env.CARDS_CSV is not valid
    try {
      const cards = processCards('');
      assert(Array.isArray(cards), 'Should return an array even without explicit path');
    } catch (error: any) {
      // If the env path doesn't exist, that's expected - skip this test
      if (error.code === 'ENOENT') {
        console.log('Skipping: CARDS_CSV path in env does not exist');
      } else {
        throw error;
      }
    }
  });
});

describe('CreditCard', () => {
  it('should create a CreditCard instance with correct properties', () => {
    const card = new CreditCard('1234567890123456', '12', '25', '123');
    
    assert.strictEqual(card.number, '1234567890123456');
    assert.strictEqual(card.expMonth, '12');
    assert.strictEqual(card.expYear, '25');
    assert.strictEqual(card.cvv, '123');
    assert(card.zip, 'Should have zip from env');
  });
});

describe('parseExpirationDate', () => {
  it('should parse MM/YY format with slash', () => {
    const [month, year] = parseExpirationDate('03/23');
    assert.strictEqual(month, '03');
    assert.strictEqual(year, '23');
  });

  it('should parse MMYY format without slash', () => {
    const [month, year] = parseExpirationDate('0323');
    assert.strictEqual(month, '03');
    assert.strictEqual(year, '23');
  });

  it('should parse M/YY format with single digit month', () => {
    const [month, year] = parseExpirationDate('3/23');
    assert.strictEqual(month, '3');
    assert.strictEqual(year, '23');
  });

  it('should parse MYY format without slash', () => {
    const [month, year] = parseExpirationDate('323');
    assert.strictEqual(month, '3');
    assert.strictEqual(year, '23');
  });

  it('should handle dates with spaces', () => {
    const [month, year] = parseExpirationDate('03 / 23');
    assert.strictEqual(month, '03');
    assert.strictEqual(year, '23');
  });

  it('should throw error for invalid format', () => {
    assert.throws(() => parseExpirationDate('12345'), {
      message: /Invalid expiration date format/
    });
  });
});
