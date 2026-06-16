// eslint-disable-next-line @typescript-eslint/no-require-imports
const PayOS = require('@payos/node').PayOS || require('@payos/node');

// Default mock values if env vars are missing
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || 'mock-client-id';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || 'mock-api-key';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || 'mock-checksum-key';

export const payos = new PayOS(
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY
);
