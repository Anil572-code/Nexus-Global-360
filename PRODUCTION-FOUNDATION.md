# Nexus Global Safety 360 — Frontend Demo Foundation

This copy is the frontend-only assignment/demo edition of Nexus Global Safety 360.
The original full-stack project is intentionally separate and must remain unchanged.

## Runtime architecture
- Next.js 16 / React 19 frontend
- Static export (`output: "export"`)
- Vercel-compatible deployment
- Browser-local demo authentication
- Browser `localStorage` data authority
- No NestJS runtime
- No Prisma
- No PostgreSQL
- No backend API deployment
- No runtime environment variables required

## Preserved demonstration features
- Employee and administrator sign-in experiences
- Separate Employee and Administration portals
- Six safety-training modules
- Interactive findings, control decisions and knowledge checks
- Governed scoring, progress and retakes
- Achievements and leaderboard
- Certificates, PDF generation and browser-local verification
- Employee profile, premium avatars and local password-change workflow
- Administration users, departments, training modules and assignments
- Local audit-style administrative activity

## Persistence model
All changed data is stored in the current browser. Refreshing or reopening the same browser retains the demo workspace. A different browser or device starts from the seeded demo data.

This edition is designed for assignment presentation and demonstration. It is not a replacement for production authentication, centralized audit authority, cross-device synchronization or shared multi-user persistence.
