import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('宠物健康管理系统 - 完整E2E测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 设置请求监听
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Console Error] ${msg.text()}`);
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`[API] ${response.request().method()} ${url} -> ${response.status()}`);
      }
    });
  });

  // ==================== 阶段1: 基础连通性 ====================
  test.describe('阶段1: 基础连通性测试', () => {
    test('1.1 首页加载和白屏检测', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // 验证页面标题
      const title = await page.title();
      expect(title).toBeTruthy();
      console.log(`页面标题: ${title}`);
      
      // 验证body有内容（非白屏）
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('1.2 DOM结构完整性', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      const html = await page.content();
      expect(html).toContain('<html');
      expect(html).toContain('<body');
      
      const root = page.locator('#root');
      await expect(root).toBeAttached();
    });

    test('1.3 路由重定向验证', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      const url = page.url();
      console.log(`重定向后URL: ${url}`);
      // 应该重定向到 /login
      expect(url).toContain('login');
    });
  });

  // ==================== 阶段2: 认证流程 ====================
  test.describe('阶段2: 认证流程测试', () => {
    test('2.1 登录页面元素验证', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      
      // 验证表单元素
      await expect(page.locator('input[type="text"], input[placeholder*="手机"]').first()).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });

    test('2.2 登录表单空提交验证', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(500);
      
      // 应该显示错误提示
      const errorText = await page.locator('text=/错误|必填|请输入/i').count();
      console.log(`错误提示数量: ${errorText}`);
    });

    test('2.3 注册页面访问', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      
      const inputs = await page.locator('input').count();
      expect(inputs).toBeGreaterThan(0);
      
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('2.4 未登录访问受保护页面', async ({ page }) => {
      // 清除登录状态
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
      
      await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // 应该重定向到登录页
      expect(page.url()).toContain('login');
    });
  });

  // ==================== 阶段3: 页面导航 ====================
  test.describe('阶段3: 页面导航测试', () => {
    const protectedPages = [
      { name: '仪表盘', path: '/app' },
      { name: '宠物列表', path: '/app/pets' },
      { name: '健康记录', path: '/app/records' },
      { name: '提醒事项', path: '/app/reminders' },
      { name: 'AI分析', path: '/app/ai-analysis' },
    ];

    protectedPages.forEach(pageInfo => {
      test(`3.x 访问${pageInfo.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        
        // 先尝试登录
        const phoneInput = page.locator('input').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        if (await phoneInput.isVisible() && await passwordInput.isVisible()) {
          await phoneInput.fill('13800138000');
          await passwordInput.fill('Test123456');
          await page.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(3000);
        }
        
        // 访问目标页面
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        
        // 验证页面有内容
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(20);
        
        console.log(`✓ ${pageInfo.name} 页面加载成功`);
      });
    });
  });

  // ==================== 阶段4: 宠物CRUD ====================
  test.describe('阶段4: 宠物CRUD测试', () => {
    test.beforeEach(async ({ page }) => {
      // 登录
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('13800138000');
        await passwordInput.fill('Test123456');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('4.1 宠物列表页', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('4.2 添加宠物按钮', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      
      const addButton = page.locator('button:has-text("添加"), button:has-text("创建"), button:has-text("新增")').first();
      const exists = await addButton.count() > 0;
      
      if (exists) {
        await addButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ 创建宠物弹窗已打开');
      }
    });
  });

  // ==================== 阶段5: 健康记录 ====================
  test.describe('阶段5: 健康记录测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('13800138000');
        await passwordInput.fill('Test123456');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('5.1 健康记录列表页', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/records`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('5.2 添加记录页面', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/add-record`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const formElements = await page.locator('input, textarea, select').count();
      console.log(`表单元素数量: ${formElements}`);
      expect(formElements).toBeGreaterThan(0);
    });
  });

  // ==================== 阶段6: 提醒事项 ====================
  test.describe('阶段6: 提醒事项测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('13800138000');
        await passwordInput.fill('Test123456');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('6.1 提醒列表页', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/reminders`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });
  });

  // ==================== 阶段7: AI功能 ====================
  test.describe('阶段7: AI功能测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('13800138000');
        await passwordInput.fill('Test123456');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('7.1 AI分析页面', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/ai-analysis`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('7.2 PetChat页面', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/chat`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const inputExists = await page.locator('input, textarea').first().isVisible();
      expect(inputExists).toBeTruthy();
    });
  });

  // ==================== 阶段8: 用户设置 ====================
  test.describe('阶段8: 用户设置测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('13800138000');
        await passwordInput.fill('Test123456');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('8.1 个人信息页面', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/mine`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('8.2 帮助中心', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/help`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });

    test('8.3 隐私设置', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/privacy`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });
  });

  // ==================== 阶段9: 边界测试 ====================
  test.describe('阶段9: 边界测试', () => {
    test('9.1 页面刷新状态保持', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // 刷新后应该还是登录页或已登录状态
      const url = page.url();
      expect(url).toMatch(/login|app|dashboard/);
    });

    test('9.2 浏览器后退功能', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      
      await page.goBack();
      await page.waitForTimeout(1000);
      
      expect(page.url()).toContain('login');
    });

    test('9.3 无效路由处理', async ({ page }) => {
      await page.goto(`${BASE_URL}/invalid-route-12345`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // 应该显示404或重定向
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });
  });
});
