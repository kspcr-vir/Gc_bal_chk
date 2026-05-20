import express from "express";
import path from "path";
import cors from "cors";
import { chromium } from "playwright-extra";
import type { Browser } from "playwright";
import stealth from "puppeteer-extra-plugin-stealth";
import { createServer as createViteServer } from "vite";

chromium.use(stealth());

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

let browser: Browser | null = null;

// Initialize browser persistently
async function initBrowser() {
  if (!browser) {
    console.log("Launching persistent browser session...");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });
    console.log("Persistent browser session initialized.");
  }
}

// Ensure browser is closed gracefully on app exit
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});

// GET /api/check-balance
app.get("/api/check-balance", async (req, res) => {
  const { card, pin } = req.query;

  if (!card || !pin) {
    return res.status(400).json({ success: false, error: "Card number and PIN are required." });
  }

  await initBrowser();

  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    let context;
    try {
      if (!browser) throw new Error("Browser not initialized");

      console.log(`[Attempt ${attempt}] Creating new isolated context...`);
      context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      
      // Default timeout for finding elements
      page.setDefaultTimeout(15000);

      console.log(`[Attempt ${attempt}] Navigating to balance check URL...`);
      await page.goto("https://mcdindia.woohoo.in/en-gb/balenq", { waitUntil: "domcontentloaded" });

      console.log(`[Attempt ${attempt}] Filling input fields...`);
      await page.type("#cardNumber", String(card), { delay: 50 });
      await page.type("#cardPin", String(pin), { delay: 50 });

      console.log(`[Attempt ${attempt}] Submitting form...`);
      await page.getByRole("button", { name: /check balance/i }).click();

      console.log(`[Attempt ${attempt}] Waiting for response...`);
      // Wait for network requests/DOM updates (handles CAPTCHA implicitly if passive)
      await page.waitForTimeout(6000); 

      const bodyText = await page.evaluate(() => document.body.innerText);

      const balanceMatch = bodyText.match(/(?:available\s*balance|current\s*balance)[\s:â¹₹Rs.]*([\d,]+\.\d{2}|[\d,]+)/i);
      
      if (balanceMatch) {
         console.log(`[Attempt ${attempt}] Success! Balance found.`);
         return res.json({ success: true, balance: balanceMatch[1], status: "Active" });
      } else if (bodyText.match(/invalid|expired|not found|deactivated/i) && !bodyText.match(/To view your card balance/i)) {
         console.log(`[Attempt ${attempt}] Card details issue detected.`);
         return res.status(400).json({ success: false, error: "Invalid Card Details or Card Expired." });
      }

      throw new Error("Could not extract balance. Possible CAPTCHA or timeout. Retrying...");

    } catch (err: any) {
      console.error(`[Attempt ${attempt}] Error:`, err.message);
      if (attempt >= maxRetries) {
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch balance after retries. Possible CAPTCHA block or invalid details.",
          details: err.message
        });
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2500));
    } finally {
      if (context) await context.close().catch(() => {});
    }
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server is running! Available at http://0.0.0.0:${PORT}`);
    // Warm start the persistent browser instance
    await initBrowser();
  });
}

startServer();
