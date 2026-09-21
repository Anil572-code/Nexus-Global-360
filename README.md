# Nexus Global Safety 360

Nexus Global Safety 360 is a frontend-only safety training and administration platform built with Next.js. It includes employee training, progress tracking, certificates, achievements, account management, and an administration control plane.

## Access

- Employee ID: `NGL-001`
- Administrator ID: `NGL-ADMIN`

Credentials are configured in the client-side application for this deployment.

## Local development

```powershell
npm install
npm start
```

The application runs on `http://localhost:7077`.

## Production build

```powershell
npm run build
```

The project uses Next.js static export and can be deployed to Vercel without database or backend environment variables.

## Data model

Application state is persisted in browser storage. Training progress, account preferences, certificates, assignments and administrative records remain available in the same browser between sessions.
