# Blueprint: Sprint 4 — Polish, Incidents & Deploy

## Overview
This is the final sprint of the 4-week MBP, focusing on the remaining operations and polishing features. The overarching goal is to deploy a production-ready system capable of tracking tenant incidents, auto-generating billing reminders, exporting invoices, and ensuring optimal UX across all devices, culminating in a stable deploy.

## Project Type
**WEB** - Built with Next.js 14, Ant Design 5, and Supabase.

## Success Criteria
- [ ] Users can log and transition incidents (sự cố) smoothly.
- [ ] Users receive reminders for expired contracts and due invoices.
- [ ] Users can export an invoice to a document (PDF/Print).
- [ ] System is polished (empty states, loading spinners, errors).
- [ ] The app is successfully verified and deployed on Vercel + Supabase Production.

## Tech Stack
- **Frontend Layer**: Next.js App Router, Ant Design (React UI)
- **State & Data**: React hooks, Supabase Client
- **Auth & Storage**: Supabase Auth & Storage (production config)
- **Deployment**: Vercel
- **Scheduled Tasks**: pg_cron / Vercel Cron
- **PDF Export**: jsPDF / window.print() or React-to-Print

## File Structure (Planned)
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── incidents/       # Page: Incidents CRUD & board
│   │   ├── reminders/       # Page/bell dropdown logic
├── components/
│   ├── invoices/
│   │   └── InvoiceExport.tsx # PDF / Print layout
│   └── layout/
│       └── NotificationBell.tsx
supabase/
└── migrations/
    └── 006_incidents_reminders.sql # Table schemas & RLS
```

## Task Breakdown

| # | Task | Scope | Agent | Skill | INPUT → OUTPUT → VERIFY |
|---|---|---|---|---|---|
| 4.1 | **Incidents & Reminders Schema** | Add `incidents`, `reminders` table & RLS | `database-architect` | `database-design` | Read blueprint → Create SQL migration → Verify tables in Supabase Dashboard |
| 4.2 | **Incidents CRUD (Owner + Tenant)** | Build page for open/in_progress/resolved flow. Users can submit incidents with images. | `frontend-specialist` | `react-patterns` | Connect to DB → Table & Form modals → Verify state transitions & Image upload |
| 4.3 | **Reminders Automation (Cron)** | Set up DB triggers / `pg_cron` scheduling inside Supabase. | `backend-specialist` | `api-patterns` | Define rules → Write pg_cron script → Verify autogen works |
| 4.4 | **Notification Bell** | Create TopBar UI for unread reminders | `frontend-specialist` | `frontend-design` | Read reminders → Update badge count → Verify dropdown layout |
| 4.5 | **Invoice Export (jsPDF)** | Build PDF Export using `react-to-print` or `jspdf`. Leave placeholder for Logo. | `frontend-specialist` | `react-patterns` | Fetch invoice data → Render PDF layout → Verify PDF download |
| 4.6 | **UX Polish** | Complete all UI states & responsive tweaks | `frontend-specialist` | `frontend-design` | Identify gaps → Loaders/Errors added → Verify on mobile/desktop |
| 4.7 | **Full Testing** | Manual validation of the loop + automated testing | `test-engineer` | `testing-patterns` | Run checklist.py scripts → End-to-End flow test → Verify no critical bugs |
| 4.8 | **Deploy** | Config environment and push to Vercel/Supbase Prod | `devops-engineer` | `deployment-procedures` | Connect Vercel → Add ENV keys → Verify Live URL |

## Phase X: Verification
- [ ] `npm run lint && npx tsc --noEmit` passes cleanly.
- [ ] `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` shows no critical security warnings.
- [ ] Codebase follows `clean-code` and does not use standard purple/violet templates.
- [ ] The app builds locally (`npm run build`).
