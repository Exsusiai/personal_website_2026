# Production Deployment Checklist

Items that must be addressed when the site goes live (Vercel / custom domain).
Order roughly = priority. Each item links to relevant code or context.

## Token usage pipeline

### [BLOCKER] Move `INGEST_URL` off the LAN

**Today:** Both daemons POST to a LAN address backed by the laptop's `next dev`:

| Device       | `INGEST_URL`                                    |
| ------------ | ----------------------------------------------- |
| `mac-laptop` | `http://localhost:3000/api/usage/ingest`        |
| `cortana-box`| `http://192.168.178.166:3000/api/usage/ingest`  |

**Problem:** When the laptop leaves the home LAN (travel) or the dev server is
not running, the server's hourly `usage-ccusage.timer` cannot reach
`192.168.178.166`. The systemd service exits with HTTP error and the data
backs up locally on `cortana-box`. It only gets uploaded once the laptop is
back on the LAN with `next dev` running. The laptop's own usage during the
same trip works only if its `next dev` is up at `localhost:3000`.

**Fix at deploy time:**

1. Deploy to Vercel (or chosen host). Confirm public URL, e.g.
   `https://chjs.dev/api/usage/ingest`.
2. On `mac-laptop`:
   ```
   sed -i '' 's|^INGEST_URL=.*|INGEST_URL=https://chjs.dev/api/usage/ingest|' \
     ~/Project/personal_website_new/packages/usage-daemons/.env
   ```
3. On `cortana-box`:
   ```
   ssh cortana-box "sed -i \
     's|^INGEST_URL=.*|INGEST_URL=https://chjs.dev/api/usage/ingest|' \
     ~/projects/personal_website_2026/packages/usage-daemons/.env"
   ```
4. Confirm production has the same `INGEST_SECRET` env var in the Vercel
   dashboard (re-use the local one or rotate; if rotating, update both daemons).
5. Trigger one manual run on each device to confirm 2xx response:
   ```
   corepack pnpm --filter @personal-website/usage-daemons ccusage   # local
   ssh cortana-box 'cd ~/projects/personal_website_2026 && corepack pnpm --filter @personal-website/usage-daemons ccusage'
   ```
6. Verify the affected count matches expectation and that the homepage chart
   updates within a few seconds (`refresh_usage_daily` is called inline by the
   ingest route).

After this change the pipeline is location-independent: any laptop / server
running `ccusage-sync` can ship data from any network as long as it can reach
the public domain.

### Rotate secrets that were pasted in chat during development

- `NOTION_TOKEN` (currently the integration token from initial Notion setup).
- Supabase DB password (was used inline for psql migrations).
- `INGEST_SECRET` — optional rotation; new value must be set in BOTH daemons
  and Vercel env at the same time.

## Site essentials

- Custom domain DNS + Vercel project link.
- Set Vercel env vars: `NOTION_TOKEN`, all `NOTION_DS_*`, `NOTION_PAGE_*`,
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
  `INGEST_SECRET`.
- Confirm `images.remotePatterns` in `apps/web/next.config.ts` covers every
  external image host you actually use (`safe-url.ts` is in sync, but if you
  add a host there you must add it here too — see LRN-027).

## Post-deploy verification

- Hit the public domain, confirm Notion-backed pages render
  (about / projects / resume / thinking / uses).
- Confirm `TokenPreview` shows recent data (means ingest path works end-to-end).
- Confirm sitemap.xml and robots.txt return.
- Check that `next/image` doesn't 500 on any Notion-sourced image (run through
  every project + thinking page once).

## Nice-to-haves (not blockers)

- Add subscription / API cost reconciliation by ingesting Anthropic's
  `usage_report/cost` and OpenAI's `/v1/organization/costs`. Today the org
  pollers write `cost_usd: 0`, so the "$X Spend · est." figure on the homepage
  only reflects local ccusage estimates (`token-preview.tsx` already labels
  it as such).
- LICENSE file for the repo.
- Add a public-facing TZ hint to the chart if you start expecting overseas
  visitors (currently silently assumes operator's Berlin time — see
  `lib/date/local-tz.ts`).
