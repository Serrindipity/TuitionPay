
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config();

const requiredEnvVars = [
  'PORTAL_URL',
  'AMOUNT_PER_CARD',
  'ZIP_CODE',
  'USERNAME',
  'PASSWORD',
] as const;

type EnvVars = {
  PORTAL_URL: string;
  AMOUNT_PER_CARD: string;
  ZIP_CODE: string;
  CARDS_CSV?: string;
  USERNAME: string;
  PASSWORD: string;
  HEADLESS: boolean;
  TARGET_PAYMENT?: number;
};

function getEnvVars(): EnvVars {
  const env: Partial<EnvVars> = {};
  for (const key of requiredEnvVars) {
    const value = process.env[key];
    if (!value) throw new Error(`Missing ${key} in environment`);
    env[key] = value;
  }
  // Optional: handle CARDS_CSV and HEADLESS
  if (process.env.CARDS_CSV) {
  env.CARDS_CSV = process.env.CARDS_CSV;
  }
  if (process.env.HEADLESS !== undefined) {
    env.HEADLESS = process.env.HEADLESS === 'true';
  }
  if (process.env.TARGET_PAYMENT) {
    env.TARGET_PAYMENT = parseFloat(process.env.TARGET_PAYMENT);
  }
  return env as EnvVars;
}

export const env = getEnvVars();
