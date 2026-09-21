# Vercel Deployment — Nexus Global Safety 360 Demo

## Required project
Deploy only the frontend-only copy:

`C:\Users\Lenovo\Desktop\Nexus-Global-360`

Do not deploy or modify the original full-stack project at `C:\Users\Lenovo\Desktop\Nexus-Global`.

## Local verification
```powershell
cd C:\Users\Lenovo\Desktop\Nexus-Global-360
npm install
npm start
```
Open `http://localhost:7077`.

## Production build
```powershell
npm run build
```
Next.js creates the static export in `out`.

## Vercel
- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output: detected automatically from the Next.js static export
- Environment variables: none required

## Demo credentials
Employee:
- ID: `NGL-001`
- Password: `Nexus@2026!`

Administrator:
- ID: `NGL-ADMIN`
- Password: `NexusAdmin@2026!`

## Persistence limitation
Demo data is stored in browser `localStorage`. Each browser/device has an independent copy of the seeded data.
