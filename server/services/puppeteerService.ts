import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const checkBalanceViaPuppeteer = async (cardNumber: string, pin: string) => {
  // Try 2 times to avoid transient timeouts
  let lastError = null;
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    let browser = null;
    try {
      console.log(`[Puppeteer Attempt ${attempt}] Launching browser...`);
      browser = await puppeteer.launch({
        headless: true, // Use old headless for broader compatibility
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(15000);

      // Add stealth evasion
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
      });

      console.log(`[Puppeteer Attempt ${attempt}] Navigating to balance check URL...`);
      await page.goto("https://meribachat.in/check-balance", { waitUntil: "domcontentloaded" });

      console.log(`[Puppeteer Attempt ${attempt}] Filling inputs...`);
      
      // Selectors based on the actual meribachat.in interface, or generic placeholders if unknown.
      // Wait for input fields
      await page.waitForSelector('input[name="cardNumber"], input[type="text"]', { timeout: 10000 });
      
      const inputs = await page.$$('input');
      // Typically the first text input is card, password/text is pin.
      // But let's look for common names
      let cardInputFilled = false;
      let pinInputFilled = false;

      for (const input of inputs) {
        const type = await input.evaluate(el => el.getAttribute('type'));
        const name = (await input.evaluate(el => el.getAttribute('name')) || "").toLowerCase();
        const placeholder = (await input.evaluate(el => el.getAttribute('placeholder')) || "").toLowerCase();
        
        if (!cardInputFilled && (name.includes('card') || placeholder.includes('card') || type === 'text')) {
          await input.type(cardNumber, { delay: 50 });
          cardInputFilled = true;
          continue;
        }

        if (!pinInputFilled && (name.includes('pin') || placeholder.includes('pin') || type === 'password' || type === 'text')) {
          await input.type(pin, { delay: 50 });
          pinInputFilled = true;
          continue;
        }
      }

      console.log(`[Puppeteer Attempt ${attempt}] Submitting form...`);
      const buttons = await page.$$('button');
      let clicked = false;
      for (const btn of buttons) {
        const text = await btn.evaluate(el => (el as HTMLElement).innerText);
        if (text && text.toLowerCase().includes('check balance')) {
          await btn.click();
          clicked = true;
          break;
        }
      }
      
      if (!clicked && buttons.length > 0) {
        // Fallback: click first button if we couldn't find text
        await buttons[0].click();
      }

      console.log(`[Puppeteer Attempt ${attempt}] Waiting for response...`);
      await page.waitForTimeout(5000);

      // Scrape results
      const resultText = await page.evaluate(() => document.body.innerText);

      const balanceMatch = resultText.match(/(?:Balance|Amount)[\s:₹Rs.-]*([\d,]+\.?\d*)/i);
      if (balanceMatch) {
         console.log(`[Puppeteer Attempt ${attempt}] Success! Found balance.`);
         return { success: true, balance: balanceMatch[1], status: "Active" };
      }

      if (resultText.match(/invalid|expired|not found|deactivated/i)) {
         console.log(`[Puppeteer Attempt ${attempt}] Card issues detected.`);
         return { success: false, error: "Invalid Card Details or Expired." };
      }

      throw new Error("Could not extract balance natively. Possible anti-bot or structural change.");
      
    } catch (err: any) {
      console.error(`[Puppeteer Attempt ${attempt}] Error:`, err.message);
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  throw new Error(`Puppeteer extraction failed: ${lastError?.message || "Unknown error"}`);
};
