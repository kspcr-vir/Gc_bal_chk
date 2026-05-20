import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

async function test() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ]
  });
  const page = await browser.newPage();
  
  page.on('request', request => {
    if (request.method() === 'POST' && !request.url().includes('google') && !request.url().includes('facebook')) {
      console.log('>> POST', request.url(), request.postData());
    }
  });

  page.on('response', async response => {
    if (response.request().method() === 'POST' && !response.url().includes('google') && !response.url().includes('facebook')) {
      console.log('<< POST RESP', response.status(), response.url());
      try {
        const json = await response.json();
        console.log('<< BODY:', JSON.stringify(json).substring(0, 500));
      } catch (e) {
         try {
           const text = await response.text();
           console.log('<< TEXT:', text.substring(0, 500));
         } catch (e2) {}
      }
    }
  });

  await page.goto("https://mcdindia.woohoo.in/en-gb/balenq", { waitUntil: "networkidle" });
  await page.type("#cardNumber", "1111222233334444", { delay: 50 });
  await page.type("#cardPin", "1234", { delay: 50 });
  await page.getByRole("button", { name: /check balance/i }).click();
  await page.waitForTimeout(6000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:\n", text.substring(0, 1000));
  
  const alerts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.alert, .toast, .modal-content, [role="alert"], .error-msg, .text-danger, .msg-error')).map(el => (el as HTMLElement).innerText);
  });
  console.log("ALERTS:", alerts);
  
  await browser.close();
}

test();
