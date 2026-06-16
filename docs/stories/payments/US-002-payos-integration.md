# US-002 PayOS VietQR Integration

## Status
planned

## Lane
high-risk

## Product Contract
Tenants can pay their invoices using dynamically generated VietQR codes via the PayOS API. Upon successful payment, a webhook from PayOS is received, verified via checksum, and the invoice status is updated to `paid` in the database.

## Relevant Product Docs
- None

## Acceptance Criteria
- [ ] "Pay via VietQR" button available on the Invoice dashboard for unpaid invoices.
- [ ] `InvoicePaymentModal` opens and generates a PayOS checkout link/QR code.
- [ ] Webhook route `api/webhooks/payos/route.ts` correctly validates the checksum.
- [ ] Webhook successfully updates `Invoice.status` to `paid`.
- [ ] A local mock webhook script allows developers to simulate the payment success.

## Design Notes
- UI surfaces: `invoices/page.tsx`, `InvoicePaymentModal.tsx`
- Tables: `Invoice`
- API: POST `/api/webhooks/payos`
- Domain rules: Only unpaid invoices can generate payment links.

## Validation
| Layer | Expected proof |
| --- | --- |
| Unit | Checksum validation logic tested |
| Integration | PayOS API link generation tested |
| E2E | |
| Platform | |
| Release | |

## Harness Delta
None.

## Evidence
None.
