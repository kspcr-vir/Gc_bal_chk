import express from "express";
import path from "path";
import cors from "cors";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Route
  app.post("/api/balance", async (req, res) => {
    const { cardNumber, pin } = req.body;

    if (!cardNumber || !pin) {
      return res.status(400).json({ error: "Card number and PIN are required." });
    }

    let browser;
    try {
      console.log("Launching playwright...");
      browser = await chromium.launch({
        args: [
          "--no-sandbox", 
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled" // Try to pass invisible recaptcha passively
        ],
        headless: true
      });
      console.log("Browser launched");

      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      });
      const page = await context.newPage();

      console.log("Navigating to balenq page...");
      await page.goto("https://mcdindia.woohoo.in/en-gb/balenq", { waitUntil: "networkidle" });
      
      console.log("Filling inputs...");
      // Fill in details based on the identified inputs
      await page.fill("#cardNumber", cardNumber);
      await page.fill("#cardPin", pin);
      
      console.log("Clicking check balance...");
      await page.getByRole("button", { name: /check balance/i }).click();

      // Wait for any network requests or dom mutations, likely 3-5 seconds.
      console.log("Waiting for results...");
      await page.waitForTimeout(6000); 

      const bodyText = await page.evaluate(() => document.body.innerText);

      let balance = null;
      let status = "Unknown";
      let error = null;

      // Better parsing:
      // Avoid matching instructions like "balance enter the 16 digit card number"
      // Look for typical balance indicators: "Available Balance", "Rs.", "â¹"
      const balanceMatch = bodyText.match(/(?:available\s*balance|current\s*balance)[\s:â¹₹Rs.]*([\d,]+\.\d{2}|[\d,]+)/i);
      
      if (balanceMatch) {
         balance = balanceMatch[1];
         status = "Active";
      } else if (bodyText.match(/invalid|expired|not found|deactivated/i) && !bodyText.match(/To view your card balance/i)) {
         // Some error on page
         error = "Invalid Card Details or Card Expired.";
      } else {
         error = "Could not fetch balance. (Possible CAPTCHA block or invalid details)";
      }

      const extractedInfo = await page.evaluate(() => {
        const alerts = Array.from(document.querySelectorAll('.alert, .toast, .modal-content, [role="alert"], .error-msg, .text-danger')).map(el => (el as HTMLElement).innerText);
        const balances = Array.from(document.querySelectorAll('[class*="balance"], [class*="amount"]')).map(el => (el as HTMLElement).innerText);
        return { alerts, balances };
      });

      res.json({
        success: balance !== null || extractedInfo.alerts.length > 0 || error !== "Could not fetch balance. (Possible CAPTCHA block or invalid details)",
        error,
        extractedInfo,
        rawText: bodyText.substring(0, 1500)
      });

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch balance", details: err.message });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
