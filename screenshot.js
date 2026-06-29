const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:5173/app');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'D:\\codebuddy\\pet_app\\homepetos_verify.png', fullPage: false });
  await browser.close();
  console.log('screenshot saved');
})();
