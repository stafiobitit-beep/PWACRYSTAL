# Crystal Clear Cleaning PWA - Phase 1 MVP

This is a mobile-first Progressive Web App designed to replace WhatsApp groups for cleaning companies.

## Quick Start (Local Run)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx ts-node src/seed.ts
npm start # Runs on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev # Runs on http://localhost:5173
```

## Demo Accounts
Use these for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | admin@example.com | password123 |
| **Cleaner** | cleaner1@example.com | password123 |
| **Customer** | customer1@example.com | password123 |

## Features (Phase 1)
- **Auth**: Role-based access (Customer, Cleaner, Admin).
- **Dashboard**: Minimalist view of tasks/locations.
- **Task Detail**: Status management (Start/Stop).
- **Chat**: WhatsApp-like interface per task.
- **Photos**: Image compression & upload (Mocked base64 in database for MVP).
- **Incidents**: Quick reporting of issues.
- **PWA**: Ready for "Add to Home Screen".

## Folder Structure
- `backend/`: Express + TypeScript + Prisma (SQLite).
- `frontend/`: React + Vite + TypeScript + Tailwind.

## Next Steps (Phase 2)
- Odoo Integration (XML-RPC).
- Push Notifications.
- Checklist logic detail.
- Multi-tenancy refinement.
