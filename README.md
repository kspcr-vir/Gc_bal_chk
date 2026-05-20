# Setup Gift Card Balance API

A robust NodeJS Express API wrapper over Woohoo McD India gift cards utilizing `playwright-extra` to securely bypass minimal checks, launch a persistent browser session, click elements, and scrape real balances back dynamically as JSON.

## Features Included

*   `GET /api/check-balance?card=xxx&pin=xxx` endpoint processing
*   Persistent Playwright Browser execution cache (for speedy handling)
*   Timeout handling and retry mechanics automatically engaged built-in
*   Realistic headers parsing using stealth plugin integrations
*   Docker container ready with dependencies
*   React frontend embedded directly

## Deployment Instructions (Render.com)

1. Create a [Render](https://render.com) account.
2. Link your GitHub account and select your repository containing this stack.
3. Because `render.yaml` specifies `env: docker`, Render will automatically use the provided `Dockerfile`.
4. The deployment will automatically build chromium headers natively without issues and hook up Port `3000`.

### Manual Deployment if not using `render.yaml`
1. Go to Render Dashboard -> New Web Service
2. Pick `Build and deploy from a Git repository`
3. Expand **Advanced**
4. Change **Environment** to `Docker`
5. Deploy Web Service!

### GitHub Pages (Frontend ONLY)
If you want to un-couple the React static files, set the repository variable `VITE_API_URL` locally as `https://your-back-end-render-app.onrender.com`. Run `npm run build` and put out `/dist` on the `gh-pages` branch. The app operates relative links easily!
