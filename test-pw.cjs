const { chromium } = require('playwright');

(async () => {
  console.log('脚本开始');
  const browser = await chromium.launch({ headless: true });
  console.log('浏览器已启动');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  console.log('页面已加载');
  await page.screenshot({ path: 'D:\\codebuddy\\pet_app\\test.png' });
  console.log('截图已保存');
  await browser.close();
})();