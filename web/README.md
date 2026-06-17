# Sahayata AI — Frontend (`web/`)

Next.js (App Router) + TypeScript + Tailwind officer copilot UI. Deploys to Vercel.

## Local development

```bash
npm install
cp .env.example .env.local         # set NEXT_PUBLIC_API_BASE_URL etc.
npm run dev                        # http://localhost:3000
```

The landing page calls the backend `/health` endpoint and shows a live connection status.

## Quality gates

```bash
npm run lint        # eslint (next/core-web-vitals + typescript)
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

All API responses are parsed with zod (`lib/api.ts`) before entering UI state, and the public
environment is validated at import time (`lib/env.ts`).
