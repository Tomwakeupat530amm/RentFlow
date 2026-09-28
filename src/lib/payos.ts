// eslint-disable-next-line @typescript-eslint/no-require-imports
const PayOSModule = require('@payos/node');
const PayOSClass = PayOSModule.PayOS || PayOSModule;

// Wrap PayOS instance to ensure seamless support for both v1 and v2 SDK methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapPayOSInstance(instance: any) {
  if (!instance.createPaymentLink && instance.paymentRequests?.create) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.createPaymentLink = function(data: any) {
      return instance.paymentRequests.create(data);
    };
  }
  if (!instance.verifyPaymentWebhookData && instance.webhooks?.verify) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.verifyPaymentWebhookData = function(webhookData: any) {
      return instance.webhooks.verify(webhookData);
    };
  }
  return instance;
}

// Function to create a dynamic PayOS instance for specific landlords
export function createPayOSClient(clientId: string, apiKey: string, checksumKey: string) {
  try {
    const inst = new PayOSClass({ clientId, apiKey, checksumKey });
    return wrapPayOSInstance(inst);
  } catch {
    const inst = new PayOSClass(clientId, apiKey, checksumKey);
    return wrapPayOSInstance(inst);
  }
}

// Default mock values if env vars are missing
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || 'mock-client-id';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || 'mock-api-key';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || 'mock-checksum-key';

export const payos = createPayOSClient(
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY
);
