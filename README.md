# Nexus Global Safety 360 — Frontend Demo Edition

Frontend-only assignment/demo build of Nexus Global Safety 360. The original full-stack project is intentionally separate and unchanged.

## Demo accounts

- Employee: `NGL-001` / `Nexus@2026!`
- Administrator: `NGL-ADMIN` / `NexusAdmin@2026!`

## Architecture

- Next.js 16 / React 19
- Static export for Vercel
- Browser-local demo authentication
- Browser `localStorage` for users, assignments, training records, profile settings, certificates and audit activity
- No database, Prisma, NestJS backend or backend environment variables

## Local

```powershell
npm install
npm start
```

Open `http://localhost:7077`.

## Build

```powershell
npm run build
```

The static deployment is generated in `out`.

## Vercel

Import the repository/project in Vercel. Framework preset: Next.js. Build command: `npm run build`. No environment variables are required.

## Demo-data behavior

Data persists only in the current browser. A different browser/device receives its own seeded demo workspace. This edition is intended for assignment demonstration, not production authentication or shared multi-user operation.
