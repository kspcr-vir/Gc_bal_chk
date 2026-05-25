# Meribachat Gift Card Balance API

A full-stack Node.js + Express API wrapper and Vanilla JS Frontend for checking gift card balances from Meribachat. Built specifically with automated fallbacks (via Puppeteer) when direct API requests fail due to anti-bot measures.

## Features
* **Modular Backend:** Clean architecture (Express, Controllers, Services).
* **Direct API First:** Tries to fetch data quickly via standard requests.
* **Puppeteer Fallback:** Automatically spins up a headless Chromium instance using `puppeteer-extra-plugin-stealth` if direct API returns 403 or times out.
* **Vanilla JS UI:** No React, lightweight frontend serving static files directly.
* **Security & Reliability:** Helmet, Express Rate Limiting, CORS, and Compression included.
* **Docker & Render Ready:** Optimized for Docker execution on Render's free tier.

---

## 1. Local Run Steps (Without Docker)

### Prerequisites
* Node.js v18+

### Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.

### Run Development
```bash
npm run dev
```

### Build & Start Production
```bash
npm run build
npm start
```
The server will be available at `http://localhost:3000`.

---

## 2. Docker & PM2 Steps

### Docker Setup
```bash
# Build the Docker image
docker build -t meri-gift-card-api .

# Run the container (Map internal 3000 to external 3000)
docker run -p 3000:3000 meri-gift-card-api
```

### PM2 Setup (For traditional VPS like DigitalOcean/AWS)
If you want to use PM2 to manage processes, make sure PM2 is installed globally:
```bash
npm install -g pm2
npm run build
pm2 start dist/server.cjs --name "meribachat-api"
pm2 logs "meribachat-api"
```

---

## 3. Render Deployment Instructions (VERY IMPORTANT)

This application is strictly optimized for **Render**. Because it runs Puppeteer (headless Chrome), it requires standard Linux dependencies. We use Render's **Docker** environment because standard Web Service builds often lack the visual library dependencies (libnss3, libasound2) that Chrome needs.

### Deployment Steps
1. Push this entire repository to your GitHub.
2. Create an account on [Render](https://render.com).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. In the configuration options:
   - **Name**: `meri-gift-card-api` (or yours)
   - **Environment**: Select `Docker` (Important: Do not select Node).
   - **Region**: Choose the closest location.
   - **Branch**: `main`
6. Click **Advanced**:
   - Verify `Auto-Deploy` is set to Yes.
   - Ensure `Health Check Path` is set to `/api/health`.
7. Click **Create Web Service**.

Render will now use the included `Dockerfile` to build the app, install Chrome dependencies, and start the system listening on the port automatically hooked up via `$PORT`.

### Viewing Logs & Restarting
* **Logs**: Check the **Logs** tab on your Render dashboard.
* **Restarts**: Can be performed manually from the top right of the service dashboard in Render.

## Troubleshooting Render & Puppeteer Notes
* **Browser Launch Failed:** If Puppeteer fails to launch, ensure you are definitely using the `Docker` environment setting in Render, not Native Node.js.
* **Timeouts:** Anti-bot protections on Meribachat can cause slow requests. Rate Limits are in place (`express-rate-limit`) so you don't get banned. Puppeteer uses the `--no-sandbox` flag to operate inside the Render Docker container structure properly.

---

## 4. API Documentation

### Examples

**Check Balance**
```http
GET /api/checkBalance?cardNumber=1006770147949188&pin=194374
```

**Successful Response**
```json
{
  "success": true,
  "balance": "100.00",
  "status": "Active"
}
```

**Health Check**
```http
GET /api/health
```
```json
{ "status": "ok" }
```
