import { chromium } from "playwright";

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
  
  page.on('response', response => {
    if (response.url().includes('mcdindia') || response.url().includes('api')) {
      console.log('<<', response.status(), response.url());
    }
  });

  await page.goto("https://mcdindia.woohoo.in/en-gb/balenq", { waitUntil: "networkidle" });
  await page.type("#cardNumber", "1111222233334444", { delay: 50 });
  await page.type("#cardPin", "1234", { delay: 50 });
  await page.getByRole("button", { name: /check balance/i }).click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshot.png' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:\n", text.substring(0, 500));
  
  const alerts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.alert, .toast, .modal-content, [role="alert"]')).map(el => (el as HTMLElement).innerText);
  });
  console.log("ALERTS:", alerts);

  await browser.close();
}

test();
