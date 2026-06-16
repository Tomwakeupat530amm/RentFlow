# Epic E03: Homestay Module

## Status
planned

## Lane
high-risk

## Product Contract
The Homestay module provides a separate management flow for short-term rentals, completely decoupled from the long-term `Contract` and `Tenant` flows. It introduces new data models for `Booking` and `HousekeepingTask`.

## Relevant Product Docs
- None

## Acceptance Criteria
- [ ] Database schema includes `Booking` table linked to a room.
- [ ] Database schema includes `HousekeepingTask` table linked to a room.
- [ ] RLS policies restrict access to homestay records based on the organization.

## Design Notes
- Tables: `bookings`, `housekeeping_tasks`
- Domain rules: A room used for homestay operates independently of long-term contracts.

## Validation
| Layer | Expected proof |
| --- | --- |
| Unit | |
| Integration | Supabase RLS tests |
| E2E | |
| Platform | |
| Release | |

## Harness Delta
None.

## Evidence
None.
