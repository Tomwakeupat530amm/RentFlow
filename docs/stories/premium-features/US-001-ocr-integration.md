# US-001 Premium OCR Integration

## Status
planned

## Lane
normal

## Product Contract
The system allows premium users to scan images of CCCD (ID Cards) and utility meters. The data extracted from the images via internal `/api/ocr/*` endpoints is automatically filled into the respective form inputs in the dashboard. Free users will see the button disabled and clicking it will show an upgrade prompt.

## Relevant Product Docs
- None

## Acceptance Criteria
- [ ] CCCD upload button in `TenantFormModal` works for premium orgs.
- [ ] Free-tier orgs see a disabled CCCD upload button that shows an upgrade modal on click.
- [ ] OCR API returns JSON that populates `full_name`, `id_number`, `date_of_birth`, `permanent_address`.
- [ ] Meter scan button in `MetersClient` populates new electric/water readings.

## Design Notes
- UI surfaces: `TenantFormModal.tsx`, `MetersClient.tsx`
- Domain rules: Check `org.plan_type === 'premium'` before allowing API call.
- API: POST `/api/ocr/cccd`, POST `/api/ocr/meter`

## Validation
| Layer | Expected proof |
| --- | --- |
| Unit | |
| Integration | Verify API call logic handles errors gracefully |
| E2E | |
| Platform | |
| Release | |

## Harness Delta
None.

## Evidence
None.
