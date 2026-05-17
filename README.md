# driftlog-frontend

The setup wizard and activity feed for [Driftlog](https://github.com/kavishkartha05/driftlog) — an autonomous architectural memory agent that captures and tracks architectural decisions from your GitHub pull requests.

## Features

- **Setup wizard** — step-by-step onboarding with live Notion API token and database ID validation
- **ADR activity feed** — polls your Notion database every 10 seconds and displays architectural decision records as cards
- **Drift detection** — banner warnings on cards where architectural drift has been flagged by the agent
- **Health scores** — color-coded health indicator per ADR (green 8–10, yellow 5–7, red 1–4)
- **Neon dark theme** — `#050510` background, indigo/cyan gradients, mouse-follow glow

## Running locally

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_WEBHOOK_URL=https://your-worker.your-subdomain.workers.dev/webhook
```

```bash
npm run dev
```

The dev server proxies all Notion API calls through `/notion-api` to avoid CORS issues. Open [http://localhost:5173](http://localhost:5173) and complete the setup wizard.

## Deploying to Vercel

1. Import the repository into [Vercel](https://vercel.com)
2. Add the environment variable `VITE_WEBHOOK_URL` with your Cloudflare Worker webhook URL
3. Deploy — Vercel auto-detects Vite and sets the build command to `npm run build` with output directory `dist`

> **Note:** The Notion API proxy is a Vite dev-server feature only. For production you will need a backend or Cloudflare Worker to relay Notion API requests, as the Notion API does not allow direct browser calls due to CORS.

## Related

- [driftlog](https://github.com/kavishkartha05/driftlog) — the main repo containing the Cloudflare Worker agent
# force rebuild Sun May 17 11:31:54 PDT 2026
