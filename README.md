# Gift Card Balance Checker

A modern web application to check the Woohoo McD India gift card balance using an Express API and Playwright browser automation.

## Project Architecture

This application consists of two parts:
1.  **Frontend (React/Vite)**: A static frontend (HTML, CSS, JS) that can be easily deployed anywhere.
2.  **Backend (Node.js/Express)**: A web server running Playwright to securely process the balance enquiry against the Woohoo site.

## Deployment Instructions

### 1. Backend (Render.com)

We will use Render to host the Express + Playwright server.

1. Create an account on [Render.com](https://render.com).
2. Connect your GitHub repository containing this codebase.
3. Render will automatically detect the `render.yaml` file at the root of the project.
4. Go to the **Blueprints** tab and click **New Blueprint Instance**.
5. Select your repository and proceed. Render will install dependencies, install the Chromium binary via Playwright, and start the frontend serving backend securely.

Alternatively, you can manually set it up by creating a **Web Service**:
- **Environment**: Node
- **Build Command**: `npm install && npx playwright install --with-deps chromium && npm run build`
- **Start Command**: `npm start`
- Add an Environment Variable: `NODE_VERSION=20`

### 2. Frontend (GitHub Pages)

If you'd like to host the frontend separately (e.g., GitHub Pages) while keeping the backend on Render, you can follow these steps:

1. Update the `VITE_API_URL` environment variable or directly modify the fetch URL in `/src/App.tsx` from `/api/balance` to your Render backend URL (e.g., `https://your-app.onrender.com/api/balance`).
2. Run `npm run build` in your terminal. This generates the static assets (HTML/CSS/JS) inside the `dist/` directory.
3. Deploy the contents of the `dist/` directory to GitHub Pages:
   - **Using GitHub Actions**: Go to Repository Settings -> Pages, select "GitHub Actions", and configure it to build via the Vite static export.
   - **Deploying Manually**: Push the `dist/` directory to a branch named `gh-pages` and configure settings to serve from that branch.

*Note: Since the backend proxy (Render.com) already serves the React frontend statically out of the `dist` folder, you don't actually need to deploy the frontend separately unless you specifically want to split them!*

## Local Development

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start the dev server
npm run dev
```
