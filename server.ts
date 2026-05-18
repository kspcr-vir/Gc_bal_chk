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
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
      // E.g., looking for balance container or an error toast.
      console.log("Waiting for results...");
      await page.waitForTimeout(5000); 

      // Attempt to extract information
      // Usually, there's a modal, toast, or specific div. 
      // We will capture inner text of likely elements, or just grab the whole page text.
      const pageContent = await page.content();
      
      // Let's use a broad extraction logic to find the balance:
      // Typically the balance is displayed like "â¹ 500" or similar.
      // We'll return the full text content bounded, so the frontend or further parsing can handle it,
      // but ideally we extract the relevant part.
      
      // Look for text that looks like a balance or error.
      // Common error messages in woohoo: "Invalid Card Number", "Card is expired"
      const bodyText = await page.evaluate(() => document.body.innerText);

      // Simple heuristic parsing (can be refined if real data is known)
      let balance = null;
      let status = "Unknown";
      let error = null;

      // Check for errors
      if (bodyText.includes("Invalid")) {
        error = "Invalid Card Details";
      } else if (bodyText.match(/balance.*?(\d+)/i)) {
        // Just extract numbers near balance
        const match = bodyText.match(/balance.*?([\d,]+)/i);
        if (match) balance = match[1];
        status = "Active";
      } else {
        // Fallback: send the raw body text but truncated
        error = "Could not parse balance from response.";
      }

      // To make this robust, we'll just return raw body text if no specific parsing triggers,
      // and let the client read it or we refine the parsing.
      // Using page evaluate to look for typical bootstrap/react alert classes or modal text
      const extractedInfo = await page.evaluate(() => {
        // often alerts are in .alert, .toast, or modals
        const alerts = Array.from(document.querySelectorAll('.alert, .toast, .modal-content, [role="alert"]')).map(el => (el as HTMLElement).innerText);
        // Maybe there's a specific balance class
        const balanceEls = Array.from(document.querySelectorAll('[class*="balance"], [class*="amount"]')).map(el => (el as HTMLElement).innerText);
        
        return {
          alerts,
          balances: balanceEls
        };
      });

      res.json({
        success: true,
        extractedInfo,
        rawText: bodyText.substring(0, 1000) // snippet for debugging
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
