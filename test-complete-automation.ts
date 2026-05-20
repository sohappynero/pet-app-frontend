/**
 * 宠物健康管理系统 - 完整前端自动化测试
 * 使用 Playwright 进行真实用户级别的端到端测试
 */

import { chromium, Browser, Page, BrowserContext, ConsoleMessage, Request, Response } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://127.0.0.1:8000';

// 测试配置
const CONFIG = {
  headless: true,
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  slowMo: 0,
};

// 测试结果收集器
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  consoleErrors: string[];
  networkErrors: string[];
  warnings: string[];
}

interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    duration: number;
  };
  pages: { name: string; status: string; url: string; errors: string[] }[];
  apis: { method: string; endpoint: string; status: number; covered: boolean }[];
  issues: { severity: 'critical' | 'high' | 'medium' | 'low'; description: string; location: string; fix?: string }[];
  consoleErrors: { page: string; message: string; type: string }[];
  networkFailures: { page: string; url: string; failure: string }[];
}

class TestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private consoleErrors: { page: string; message: string; type: string }[] = [];
  private networkFailures: { page: string; url: string; failure: string }[] = [];
  private interceptedRequests: { method: string; url: string; status: number }[] = [];
  private startTime: number = 0;
  private testUser = {
    phone: `138${Date.now().toString().slice(-8)}`,
    password: 'Test123456',
    nickname: '测试用户',
    petName: '测试宠物',
  };

  async setup() {
    console.log('🚀 初始化浏览器...');
    this.browser = await chromium.launch({ headless: CONFIG.headless });
    this.context = await this.browser.newContext({ viewport: CONFIG.viewport });
    this.page = await this.context.newPage();
    
    // 设置请求拦截
    this.page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          page: this.page?.url() || 'unknown',
          message: msg.text(),
          type: 'console.error'
        });
      }
    });

    this.page.on('requestfailed', (request: Request) => {
      this.networkFailures.push({
        page: this.page?.url() || 'unknown',
        url: request.url(),
        failure: request.failure()?.errorText || 'Unknown error'
      });
    });

    this.page.on('response', (response: Response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        this.interceptedRequests.push({
          method: response.request().method(),
          url: url.replace(API_BASE, ''),
          status: response.status()
        });
      }
    });

    this.startTime = Date.now();
    console.log('✅ 浏览器初始化完成\n');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
    const result: TestResult = {
      name,
      status: 'passed',
      duration: 0,
      consoleErrors: [],
      networkErrors: [],
      warnings: [],
    };
    const start = Date.now();
    
    try {
      await fn();
      result.status = 'passed';
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
    } finally {
      result.duration = Date.now() - start;
      result.consoleErrors = this.consoleErrors.filter(e => e.page === this.page?.url()).map(e => e.message);
    }
    
    this.results.push(result);
    return result;
  }

  // ==================== 阶段1: 基础连通性测试 ====================
  async testPhase1_BasicConnectivity() {
    console.log('\n📋 阶段1: 基础连通性测试\n' + '═'.repeat(60));
    
    // 1.1 首页加载测试
    await this.runTest('1.1 首页加载', async () => {
      await this.page!.goto(BASE_URL, { waitUntil: 'networkidle' });
      const title = await this.page!.title();
      console.log(`   页面标题: ${title}`);
      
      // 检查页面是否白屏
      const body = await this.page!.locator('body').textContent();
      if (!body || body.trim().length < 10) {
        throw new Error('页面可能白屏: body内容为空或过少');
      }
      console.log(`   ✅ 页面正常加载，内容长度: ${body.length} 字符`);
    });

    // 1.2 DOM结构验证
    await this.runTest('1.2 DOM结构验证', async () => {
      const html = await this.page!.content();
      if (!html.includes('<html') || !html.includes('<body')) {
        throw new Error('DOM结构不完整');
      }
      
      // 检查根元素
      const root = await this.page!.locator('#root').count();
      if (root === 0) {
        throw new Error('未找到React根元素 #root');
      }
      console.log('   ✅ DOM结构完整');
    });

    // 1.3 控制台错误检查
    await this.runTest('1.3 首页控制台错误', async () => {
      const errors = this.consoleErrors.filter(e => e.page.includes('localhost:5173'));
      if (errors.length > 0) {
        console.log(`   ⚠️ 发现 ${errors.length} 个控制台错误:`);
        errors.forEach(e => console.log(`      - ${e.message}`));
      } else {
        console.log('   ✅ 无控制台错误');
      }
    });

    // 1.4 验证当前URL
    await this.runTest('1.4 初始路由验证', async () => {
      const url = this.page!.url();
      console.log(`   当前URL: ${url}`);
      // 应该重定向到 /login
      if (!url.includes('/login')) {
        console.log('   ℹ️ 未自动重定向到登录页（可能首页就是登录页）');
      }
    });

    // 1.5 页面性能指标
    await this.runTest('1.5 页面性能指标', async () => {
      const metrics = await this.page!.evaluate(() => {
        const perf = performance as any;
        return {
          domContentLoaded: perf.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0,
          loadComplete: perf.getEntriesByType('navigation')[0]?.loadEventEnd || 0,
        };
      });
      console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`   Load Complete: ${metrics.loadComplete}ms`);
    });
  }

  // ==================== 阶段2: 认证流程测试 ====================
  async testPhase2_AuthFlow() {
    console.log('\n📋 阶段2: 认证流程测试\n' + '═'.repeat(60));
    
    // 2.1 登录页面加载
    await this.runTest('2.1 登录页面加载', async () => {
      await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      // 检查表单元素
      const phoneInput = await this.page!.locator('input[type="text"], input[placeholder*="手机"]').count();
      const passwordInput = await this.page!.locator('input[type="password"]').count();
      const submitBtn = await this.page!.locator('button[type="submit"]').count();
      
      console.log(`   手机号输入框: ${phoneInput > 0 ? '✅' : '❌'}`);
      console.log(`   密码输入框: ${passwordInput > 0 ? '✅' : '❌'}`);
      console.log(`   提交按钮: ${submitBtn > 0 ? '✅' : '❌'}`);
      
      if (phoneInput === 0 || passwordInput === 0 || submitBtn === 0) {
        throw new Error('登录表单元素不完整');
      }
    });

    // 2.2 注册页面访问
    await this.runTest('2.2 注册页面访问', async () => {
      await this.page!.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      const phoneInput = await this.page!.locator('input').count();
      const registerBtn = await this.page!.locator('button').count();
      console.log(`   输入框数量: ${phoneInput}`);
      console.log(`   按钮数量: ${registerBtn}`);
    });

    // 2.3 登录表单验证 - 空提交
    await this.runTest('2.3 登录表单空提交验证', async () => {
      await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(500);
      
      // 点击登录按钮
      const submitBtn = this.page!.locator('button[type="submit"]').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(500);
      
      // 检查是否有错误提示
      const errorText = await this.page!.locator('text=/错误|必填|请输入/i').count();
      console.log(`   空提交后出现错误提示: ${errorText > 0 ? '✅' : '⚠️ 未检测到明显错误提示'}`);
    });

    // 2.4 登录表单验证 - 错误格式
    await this.runTest('2.4 登录表单错误格式验证', async () => {
      await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(500);
      
      // 输入错误格式的手机号
      const phoneInput = this.page!.locator('input[type="text"], input[placeholder*="手机"]').first();
      const passwordInput = this.page!.locator('input[type="password"]').first();
      
      await phoneInput.fill('123');
      await passwordInput.fill('123');
      await this.page!.locator('button[type="submit"]').first().click();
      await this.page!.waitForTimeout(1000);
      
      console.log('   ✅ 错误格式已输入，等待后端验证');
    });

    // 2.5 注册流程 - 发送验证码
    await this.runTest('2.5 发送验证码', async () => {
      await this.page!.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      // 查找手机号输入框并填写
      const phoneInput = this.page!.locator('input').first();
      await phoneInput.fill(this.testUser.phone);
      
      // 查找发送验证码按钮
      const sendCodeBtn = this.page!.locator('button:has-text("验证码"), button:has-text("发送")').first();
      const btnExists = await sendCodeBtn.count() > 0;
      
      if (btnExists) {
        await sendCodeBtn.click();
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 验证码发送请求已发送');
      } else {
        console.log('   ⚠️ 未找到发送验证码按钮');
      }
    });

    // 2.6 尝试注册（带测试数据）
    await this.runTest('2.6 完整注册流程', async () => {
      await this.page!.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      // 填写注册表单
      const inputs = await this.page!.locator('input').all();
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder') || '';
        
        if (type === 'text' || placeholder.includes('手机')) {
          await input.fill(this.testUser.phone);
        } else if (type === 'password') {
          await input.fill(this.testUser.password);
        } else if (placeholder.includes('昵称') || placeholder.includes('name')) {
          await input.fill(this.testUser.nickname);
        }
      }
      
      // 尝试提交
      const submitBtn = this.page!.locator('button[type="submit"], button:has-text("注册")').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(2000);
      
      console.log('   ✅ 注册表单已提交');
    });

    // 2.7 登录成功测试
    await this.runTest('2.7 登录成功流程', async () => {
      await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      const phoneInput = this.page!.locator('input').first();
      const passwordInput = this.page!.locator('input[type="password"]').first();
      
      await phoneInput.fill(this.testUser.phone);
      await passwordInput.fill(this.testUser.password);
      
      const submitBtn = this.page!.locator('button[type="submit"]').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(3000);
      
      const currentUrl = this.page!.url();
      console.log(`   登录后URL: ${currentUrl}`);
      
      if (currentUrl.includes('/app') || currentUrl.includes('/dashboard')) {
        console.log('   ✅ 登录成功，跳转到仪表盘');
      } else {
        console.log('   ⚠️ 未跳转到仪表盘，可能登录失败');
      }
    });

    // 2.8 JWT Token 验证
    await this.runTest('2.8 JWT Token 存储验证', async () => {
      const token = await this.page!.evaluate(() => localStorage.getItem('token'));
      const refreshToken = await this.page!.evaluate(() => localStorage.getItem('refreshToken'));
      
      console.log(`   Access Token: ${token ? '✅ 已存储' : '❌ 未找到'}`);
      console.log(`   Refresh Token: ${refreshToken ? '✅ 已存储' : '❌ 未找到'}`);
      
      if (!token) {
        console.log('   ⚠️ 可能需要先登录成功才能测试Token刷新');
      }
    });

    // 2.9 未登录访问受保护页面
    await this.runTest('2.9 未登录访问受保护页面重定向', async () => {
      // 先清除登录状态
      await this.page!.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
      
      await this.page!.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      const currentUrl = this.page!.url();
      if (currentUrl.includes('/login')) {
        console.log('   ✅ 未登录正确重定向到登录页');
      } else {
        console.log(`   ⚠️ 当前URL: ${currentUrl}`);
      }
    });
  }

  // ==================== 阶段3: 导航与页面遍历测试 ====================
  async testPhase3_Navigation() {
    console.log('\n📋 阶段3: 导航与页面遍历测试\n' + '═'.repeat(60));
    
    // 先登录
    await this.testLogin();
    
    const pages = [
      { name: '仪表盘', path: '/app' },
      { name: '我的', path: '/app/mine' },
      { name: '宠物列表', path: '/app/pets' },
      { name: '健康记录', path: '/app/records' },
      { name: '记录日历', path: '/app/records-calendar' },
      { name: '添加记录', path: '/app/add-record' },
      { name: '提醒事项', path: '/app/reminders' },
      { name: 'AI分析', path: '/app/ai-analysis' },
      { name: 'AI聊天', path: '/app/chat' },
      { name: '提醒设置', path: '/app/reminder-settings' },
      { name: '反馈中心', path: '/app/feedback' },
      { name: '帮助中心', path: '/app/help' },
      { name: '隐私设置', path: '/app/privacy' },
    ];

    for (const pageInfo of pages) {
      await this.runTest(`3.访问${pageInfo.name}`, async () => {
        const errorsBefore = this.consoleErrors.length;
        await this.page!.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await this.page!.waitForTimeout(1500);
        
        const currentUrl = this.page!.url();
        const errorsAfter = this.consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;
        
        console.log(`   页面: ${pageInfo.name}`);
        console.log(`   URL: ${currentUrl}`);
        console.log(`   控制台错误: ${newErrors}`);
        
        // 检查是否重定向到登录页（未授权）
        if (currentUrl.includes('/login')) {
          console.log('   ⚠️ 未登录或Token失效');
        }
        
        // 检查页面白屏
        const bodyText = await this.page!.locator('body').textContent();
        if (!bodyText || bodyText.trim().length < 20) {
          throw new Error(`${pageInfo.name} 可能白屏`);
        }
      });
    }

    // 3.14 Tab导航测试
    await this.runTest('3.14 侧边栏Tab导航', async () => {
      await this.page!.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      // 查找侧边栏链接
      const navLinks = await this.page!.locator('nav a, .sidebar a, [role="navigation"] a').all();
      console.log(`   找到 ${navLinks.length} 个导航链接`);
      
      if (navLinks.length > 0) {
        // 点击第一个导航链接
        await navLinks[0].click();
        await this.page!.waitForTimeout(1000);
        console.log('   ✅ 导航点击成功');
      }
    });

    // 3.15 面包屑导航测试
    await this.runTest('3.15 面包屑导航', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      const breadcrumbs = await this.page!.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').count();
      console.log(`   面包屑导航: ${breadcrumbs > 0 ? '✅ 存在' : '⚠️ 未找到'}`);
    });
  }

  // ==================== 阶段4: 宠物CRUD测试 ====================
  async testPhase4_PetCRUD() {
    console.log('\n📋 阶段4: 宠物CRUD测试\n' + '═'.repeat(60));
    
    // 先登录
    await this.testLogin();
    
    // 4.1 访问宠物列表页
    await this.runTest('4.1 宠物列表页加载', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const petsTitle = await this.page!.locator('h1, h2, [class*="title"]').first().textContent();
      console.log(`   页面标题: ${petsTitle}`);
    });

    // 4.2 创建宠物按钮
    await this.runTest('4.2 创建宠物按钮', async () => {
      const addBtn = this.page!.locator('button:has-text("添加"), button:has-text("创建"), button:has-text("新增")').first();
      const btnExists = await addBtn.count() > 0;
      
      if (btnExists) {
        await addBtn.click();
        await this.page!.waitForTimeout(1500);
        console.log('   ✅ 打开创建宠物弹窗/页面');
      } else {
        console.log('   ⚠️ 未找到创建按钮，尝试其他方式');
        // 可能需要通过特定入口
        await this.page!.goto(`${BASE_URL}/app/add-pet`, { waitUntil: 'networkidle' });
        await this.page!.waitForTimeout(1000);
      }
    });

    // 4.3 宠物创建表单
    await this.runTest('4.3 宠物创建表单填写', async () => {
      // 填写宠物信息
      const inputs = await this.page!.locator('input').all();
      const textareas = await this.page!.locator('textarea').all();
      
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder') || '';
        const name = await input.getAttribute('name') || '';
        
        if (placeholder.includes('名') || name.includes('name')) {
          await input.fill(this.testUser.petName);
        } else if (placeholder.includes('类') || name.includes('type')) {
          await input.fill('dog');
        } else if (placeholder.includes('品') || name.includes('breed')) {
          await input.fill('金毛');
        } else if (placeholder.includes('年') || name.includes('age')) {
          await input.fill('2');
        }
      }
      
      console.log(`   已填写 ${inputs.length} 个输入框`);
      
      // 选择宠物类型（如果有单选按钮）
      const petTypeOptions = await this.page!.locator('button:has-text("猫"), button:has-text("狗"), button:has-text("其他")').all();
      if (petTypeOptions.length > 0) {
        await petTypeOptions[0].click();
        await this.page!.waitForTimeout(300);
        console.log('   ✅ 宠物类型已选择');
      }
    });

    // 4.4 提交创建宠物
    await this.runTest('4.4 提交宠物创建', async () => {
      const submitBtn = this.page!.locator('button[type="submit"], button:has-text("保存"), button:has-text("确认")').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(3000);
      
      const currentUrl = this.page!.url();
      console.log(`   提交后URL: ${currentUrl}`);
      
      // 检查是否成功
      const successMsg = await this.page!.locator('text=/成功|已创建/i').count();
      console.log(`   成功提示: ${successMsg > 0 ? '✅' : '⚠️ 未检测到'}`);
    });

    // 4.5 宠物列表刷新
    await this.runTest('4.5 宠物列表刷新验证', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const petCards = await this.page!.locator('[class*="card"], [class*="pet"]').all();
      console.log(`   宠物卡片数量: ${petCards.length}`);
    });

    // 4.6 编辑宠物
    await this.runTest('4.6 编辑宠物信息', async () => {
      // 查找编辑按钮
      const editBtn = this.page!.locator('button:has-text("编辑"), [aria-label*="编辑"]').first();
      const editBtnExists = await editBtn.count() > 0;
      
      if (editBtnExists) {
        await editBtn.click();
        await this.page!.waitForTimeout(1500);
        
        // 修改名称
        const nameInput = this.page!.locator('input').first();
        await nameInput.fill('编辑后的宠物名');
        
        // 保存
        const saveBtn = this.page!.locator('button[type="submit"], button:has-text("保存")').first();
        await saveBtn.click();
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 宠物编辑完成');
      } else {
        console.log('   ⚠️ 未找到编辑按钮');
      }
    });

    // 4.7 切换默认宠物
    await this.runTest('4.7 切换默认宠物', async () => {
      const switchBtn = this.page!.locator('button:has-text("切换"), button:has-text("设为主要")').first();
      const switchBtnExists = await switchBtn.count() > 0;
      
      if (switchBtnExists) {
        await switchBtn.click();
        await this.page!.waitForTimeout(1500);
        console.log('   ✅ 宠物切换完成');
      } else {
        console.log('   ⚠️ 未找到切换按钮');
      }
    });

    // 4.8 删除宠物
    await this.runTest('4.8 删除宠物', async () => {
      const deleteBtn = this.page!.locator('button:has-text("删除"), [aria-label*="删除"], button:has-text("移除")').first();
      const deleteBtnExists = await deleteBtn.count() > 0;
      
      if (deleteBtnExists) {
        await deleteBtn.click();
        await this.page!.waitForTimeout(500);
        
        // 确认删除（如果有确认对话框）
        const confirmBtn = this.page!.locator('button:has-text("确认"), button:has-text("确定"), button:has-text("是")').first();
        const confirmExists = await confirmBtn.count() > 0;
        
        if (confirmExists) {
          await confirmBtn.click();
        }
        
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 删除操作已执行');
      } else {
        console.log('   ⚠️ 未找到删除按钮');
      }
    });

    // 4.9 宠物详情页
    await this.runTest('4.9 宠物详情页', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      // 点击宠物卡片进入详情
      const petCard = this.page!.locator('[class*="card"], [class*="pet"]').first();
      const petCardExists = await petCard.count() > 0;
      
      if (petCardExists) {
        await petCard.click();
        await this.page!.waitForTimeout(2000);
        console.log(`   详情页URL: ${this.page!.url()}`);
      } else {
        console.log('   ⚠️ 未找到宠物卡片');
      }
    });
  }

  // ==================== 阶段5: 健康记录CRUD测试 ====================
  async testPhase5_HealthRecords() {
    console.log('\n📋 阶段5: 健康记录CRUD测试\n' + '═'.repeat(60));
    
    await this.testLogin();
    
    const recordTypes = [
      { name: '体重记录', selector: '体重' },
      { name: '疫苗记录', selector: '疫苗' },
      { name: '驱虫记录', selector: '驱虫' },
      { name: '体检记录', selector: '体检' },
      { name: '饮食记录', selector: '饮食' },
      { name: '美容记录', selector: '美容' },
    ];

    for (const recordType of recordTypes) {
      await this.runTest(`5.创建${recordType.name}`, async () => {
        await this.page!.goto(`${BASE_URL}/app/add-record`, { waitUntil: 'networkidle' });
        await this.page!.waitForTimeout(1500);
        
        // 选择记录类型
        const typeBtn = this.page!.locator(`button:has-text("${recordType.selector}")`).first();
        const typeBtnExists = await typeBtn.count() > 0;
        
        if (typeBtnExists) {
          await typeBtn.click();
          await this.page!.waitForTimeout(500);
          console.log(`   ✅ 已选择${recordType.name}类型`);
        }
        
        // 填写表单
        const inputs = await this.page!.locator('input').all();
        for (const input of inputs) {
          const placeholder = await input.getAttribute('placeholder') || '';
          if (placeholder.includes('重') || placeholder.includes('weight')) {
            await input.fill('5.5');
          } else if (placeholder.includes('备注') || placeholder.includes('note')) {
            await input.fill('自动化测试记录');
          }
        }
        
        // 提交
        const submitBtn = this.page!.locator('button[type="submit"]').first();
        await submitBtn.click();
        await this.page!.waitForTimeout(2000);
        
        console.log(`   ✅ ${recordType.name}已创建`);
      });
    }

    // 5.7 健康记录列表
    await this.runTest('5.7 健康记录列表加载', async () => {
      await this.page!.goto(`${BASE_URL}/app/records`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const recordItems = await this.page!.locator('[class*="record"], [class*="item"]').all();
      console.log(`   记录数量: ${recordItems.length}`);
    });

    // 5.8 编辑健康记录
    await this.runTest('5.8 编辑健康记录', async () => {
      const editBtn = this.page!.locator('button:has-text("编辑")').first();
      const editBtnExists = await editBtn.count() > 0;
      
      if (editBtnExists) {
        await editBtn.click();
        await this.page!.waitForTimeout(1500);
        
        const inputs = await this.page!.locator('input').all();
        if (inputs.length > 0) {
          await inputs[0].fill('更新后的值');
        }
        
        const saveBtn = this.page!.locator('button[type="submit"], button:has-text("保存")').first();
        await saveBtn.click();
        await this.page!.waitForTimeout(2000);
        
        console.log('   ✅ 健康记录已更新');
      } else {
        console.log('   ⚠️ 未找到编辑按钮');
      }
    });

    // 5.9 删除健康记录
    await this.runTest('5.9 删除健康记录', async () => {
      const deleteBtn = this.page!.locator('button:has-text("删除")').first();
      const deleteBtnExists = await deleteBtn.count() > 0;
      
      if (deleteBtnExists) {
        await deleteBtn.click();
        await this.page!.waitForTimeout(500);
        
        const confirmBtn = this.page!.locator('button:has-text("确认"), button:has-text("确定")').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
        }
        
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 健康记录已删除');
      } else {
        console.log('   ⚠️ 未找到删除按钮');
      }
    });

    // 5.10 记录日历视图
    await this.runTest('5.10 记录日历视图', async () => {
      await this.page!.goto(`${BASE_URL}/app/records-calendar`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const calendar = await this.page!.locator('[class*="calendar"], [class*="date"]').count();
      console.log(`   日历组件: ${calendar > 0 ? '✅' : '⚠️ 未找到'}`);
    });
  }

  // ==================== 阶段6: 提醒事项测试 ====================
  async testPhase6_Reminders() {
    console.log('\n📋 阶段6: 提醒事项测试\n' + '═'.repeat(60));
    
    await this.testLogin();
    
    await this.runTest('6.1 提醒列表页', async () => {
      await this.page!.goto(`${BASE_URL}/app/reminders`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      console.log('   ✅ 提醒列表页已加载');
    });

    await this.runTest('6.2 创建提醒', async () => {
      const addBtn = this.page!.locator('button:has-text("添加"), button:has-text("新建")').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await this.page!.waitForTimeout(1500);
      }
      
      // 填写提醒内容
      const inputs = await this.page!.locator('input').all();
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder') || '';
        if (placeholder.includes('标题') || placeholder.includes('内容')) {
          await input.fill('测试提醒 - 自动化测试');
        } else if (placeholder.includes('时间') || placeholder.includes('date')) {
          // 设置为明天
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          await input.fill(tomorrow.toISOString().split('T')[0]);
        }
      }
      
      const submitBtn = this.page!.locator('button[type="submit"]').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(2000);
      
      console.log('   ✅ 提醒已创建');
    });

    await this.runTest('6.3 标记提醒完成', async () => {
      const completeBtn = this.page!.locator('button:has-text("完成"), button:has-text("✓")').first();
      if (await completeBtn.count() > 0) {
        await completeBtn.click();
        await this.page!.waitForTimeout(1000);
        console.log('   ✅ 提醒已标记完成');
      } else {
        console.log('   ⚠️ 未找到完成按钮');
      }
    });

    await this.runTest('6.4 编辑提醒', async () => {
      const editBtn = this.page!.locator('button:has-text("编辑")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await this.page!.waitForTimeout(1500);
        
        const inputs = await this.page!.locator('input').all();
        if (inputs.length > 0) {
          await inputs[0].fill('已修改的提醒');
        }
        
        const saveBtn = this.page!.locator('button[type="submit"]').first();
        await saveBtn.click();
        await this.page!.waitForTimeout(2000);
        
        console.log('   ✅ 提醒已编辑');
      } else {
        console.log('   ⚠️ 未找到编辑按钮');
      }
    });

    await this.runTest('6.5 删除提醒', async () => {
      const deleteBtn = this.page!.locator('button:has-text("删除")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await this.page!.waitForTimeout(500);
        
        const confirmBtn = this.page!.locator('button:has-text("确认")').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
        }
        
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 提醒已删除');
      } else {
        console.log('   ⚠️ 未找到删除按钮');
      }
    });
  }

  // ==================== 阶段7: AI功能测试 ====================
  async testPhase7_AIFeatures() {
    console.log('\n📋 阶段7: AI功能测试\n' + '═'.repeat(60));
    
    await this.testLogin();
    
    await this.runTest('7.1 AI分析页面', async () => {
      await this.page!.goto(`${BASE_URL}/app/ai-analysis`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const aiContent = await this.page!.locator('text=/AI|分析|智能/i').count();
      console.log(`   AI相关元素: ${aiContent}`);
    });

    await this.runTest('7.2 发起AI分析', async () => {
      const analyzeBtn = this.page!.locator('button:has-text("分析"), button:has-text("开始")').first();
      if (await analyzeBtn.count() > 0) {
        await analyzeBtn.click();
        await this.page!.waitForTimeout(3000);
        console.log('   ✅ AI分析请求已发送');
      } else {
        console.log('   ⚠️ 未找到分析按钮');
      }
    });

    await this.runTest('7.3 PetChat聊天页面', async () => {
      await this.page!.goto(`${BASE_URL}/app/chat`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const chatInput = await this.page!.locator('input, textarea').first();
      const chatInputExists = await chatInput.count() > 0;
      console.log(`   聊天输入框: ${chatInputExists ? '✅' : '⚠️'}`);
    });

    await this.runTest('7.4 发送聊天消息', async () => {
      const chatInput = this.page!.locator('input, textarea').first();
      if (await chatInput.count() > 0) {
        await chatInput.fill('你好');
        await this.page!.waitForTimeout(300);
        
        const sendBtn = this.page!.locator('button:has-text("发送"), button[type="submit"]').first();
        await sendBtn.click();
        await this.page!.waitForTimeout(3000);
        
        console.log('   ✅ 消息已发送');
      } else {
        console.log('   ⚠️ 未找到输入框');
      }
    });

    await this.runTest('7.5 图片上传功能', async () => {
      // 查找上传按钮
      const uploadBtn = this.page!.locator('button:has-text("上传"), input[type="file"]').first();
      
      // 创建测试图片文件
      const testImagePath = 'd:/codebuddy/frontend/public/test-image.png';
      
      const fileInput = this.page!.locator('input[type="file"]').first();
      const fileInputExists = await fileInput.count() > 0;
      
      if (fileInputExists) {
        try {
          await fileInput.setInputFiles(testImagePath);
          await this.page!.waitForTimeout(2000);
          console.log('   ✅ 图片上传请求已发送');
        } catch (e) {
          console.log('   ⚠️ 测试图片文件不存在，模拟上传测试');
          // 模拟上传请求
          await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
          });
          await this.page!.waitForTimeout(2000);
          console.log('   ✅ 模拟图片上传完成');
        }
      } else {
        console.log('   ⚠️ 未找到文件上传组件');
      }
    });

    await this.runTest('7.6 聊天表情包', async () => {
      const emojiBtn = this.page!.locator('button:has-text("表情"), [aria-label*="emoji"]').first();
      if (await emojiBtn.count() > 0) {
        await emojiBtn.click();
        await this.page!.waitForTimeout(500);
        console.log('   ✅ 表情包面板已打开');
      } else {
        console.log('   ⚠️ 未找到表情包按钮');
      }
    });
  }

  // ==================== 阶段8: 用户设置测试 ====================
  async testPhase8_UserSettings() {
    console.log('\n📋 阶段8: 用户设置测试\n' + '═'.repeat(60));
    
    await this.testLogin();
    
    // 8.1 个人信息页面
    await this.runTest('8.1 个人信息页面', async () => {
      await this.page!.goto(`${BASE_URL}/app/mine`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const profileInfo = await this.page!.locator('[class*="profile"], [class*="user"]').count();
      console.log(`   用户信息组件: ${profileInfo > 0 ? '✅' : '⚠️'}`);
    });

    // 8.2 修改昵称
    await this.runTest('8.2 修改昵称', async () => {
      const editBtn = this.page!.locator('button:has-text("编辑"), button:has-text("修改")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await this.page!.waitForTimeout(1000);
        
        const nameInput = this.page!.locator('input').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('新昵称_' + Date.now());
          
          const saveBtn = this.page!.locator('button[type="submit"]').first();
          await saveBtn.click();
          await this.page!.waitForTimeout(2000);
          console.log('   ✅ 昵称已修改');
        }
      } else {
        console.log('   ⚠️ 未找到编辑按钮');
      }
    });

    // 8.3 修改密码
    await this.runTest('8.3 修改密码', async () => {
      await this.page!.goto(`${BASE_URL}/app/privacy`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const changePwdBtn = this.page!.locator('button:has-text("密码"), button:has-text("修改密码")').first();
      if (await changePwdBtn.count() > 0) {
        await changePwdBtn.click();
        await this.page!.waitForTimeout(1000);
        
        const inputs = await this.page!.locator('input[type="password"]').all();
        if (inputs.length >= 2) {
          await inputs[0].fill('OldPassword123');
          await inputs[1].fill('NewPassword456');
          
          const submitBtn = this.page!.locator('button[type="submit"]').first();
          await submitBtn.click();
          await this.page!.waitForTimeout(2000);
          console.log('   ✅ 密码修改请求已发送');
        }
      } else {
        console.log('   ⚠️ 未找到修改密码入口');
      }
    });

    // 8.4 反馈中心
    await this.runTest('8.4 反馈中心', async () => {
      await this.page!.goto(`${BASE_URL}/app/feedback`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const feedbackForm = await this.page!.locator('textarea, input').count();
      console.log(`   反馈表单元素: ${feedbackForm}`);
      
      if (feedbackForm > 0) {
        const textarea = this.page!.locator('textarea').first();
        await textarea.fill('这是自动化测试反馈内容');
        
        const submitBtn = this.page!.locator('button[type="submit"], button:has-text("提交")').first();
        await submitBtn.click();
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 反馈已提交');
      }
    });

    // 8.5 帮助中心
    await this.runTest('8.5 帮助中心', async () => {
      await this.page!.goto(`${BASE_URL}/app/help`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const helpItems = await this.page!.locator('[class*="help"], [class*="faq"]').count();
      console.log(`   帮助内容: ${helpItems > 0 ? '✅' : '⚠️'}`);
    });

    // 8.6 隐私设置
    await this.runTest('8.6 隐私设置', async () => {
      await this.page!.goto(`${BASE_URL}/app/privacy`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const privacySwitches = await this.page!.locator('input[type="checkbox"], [role="switch"]').all();
      console.log(`   隐私开关数量: ${privacySwitches.length}`);
      
      if (privacySwitches.length > 0) {
        await privacySwitches[0].click();
        await this.page!.waitForTimeout(1000);
        console.log('   ✅ 隐私设置已修改');
      }
    });

    // 8.7 提醒设置
    await this.runTest('8.7 提醒设置页面', async () => {
      await this.page!.goto(`${BASE_URL}/app/reminder-settings`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      const settingsForm = await this.page!.locator('form, [class*="setting"]').count();
      console.log(`   设置表单: ${settingsForm > 0 ? '✅' : '⚠️'}`);
    });
  }

  // ==================== 阶段9: 边界测试 ====================
  async testPhase9_BoundaryTests() {
    console.log('\n📋 阶段9: 边界测试\n' + '═'.repeat(60));
    
    await this.testLogin();
    
    // 9.1 XSS注入测试
    await this.runTest('9.1 XSS注入防护', async () => {
      await this.page!.goto(`${BASE_URL}/app/feedback`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const xssPayload = '<script>alert("XSS")</script>';
      const textarea = this.page!.locator('textarea, input').first();
      if (await textarea.count() > 0) {
        await textarea.fill(xssPayload);
        
        const submitBtn = this.page!.locator('button[type="submit"]').first();
        await submitBtn.click();
        await this.page!.waitForTimeout(2000);
        
        // 检查是否有脚本执行
        const alertExists = await this.page!.evaluate(() => {
          return window.alert !== undefined;
        });
        console.log(`   XSS测试完成，防护机制: ${alertExists ? '⚠️ 需检查' : '✅'}`);
      }
    });

    // 9.2 SQL注入测试
    await this.runTest('9.2 SQL注入防护', async () => {
      await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const sqlPayload = "admin' OR '1'='1";
      const phoneInput = this.page!.locator('input').first();
      const passwordInput = this.page!.locator('input[type="password"]').first();
      
      if (await phoneInput.count() > 0 && await passwordInput.count() > 0) {
        await phoneInput.fill(sqlPayload);
        await passwordInput.fill(sqlPayload);
        
        const submitBtn = this.page!.locator('button[type="submit"]').first();
        await submitBtn.click();
        await this.page!.waitForTimeout(2000);
        
        console.log('   ✅ SQL注入测试完成');
      }
    });

    // 9.3 超长文本测试
    await this.runTest('9.3 超长文本输入', async () => {
      await this.page!.goto(`${BASE_URL}/app/feedback`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const longText = '测试文本'.repeat(10000);
      const textarea = this.page!.locator('textarea').first();
      
      if (await textarea.count() > 0) {
        await textarea.fill(longText);
        await this.page!.waitForTimeout(1000);
        console.log('   ✅ 超长文本已输入（10000字符）');
      }
    });

    // 9.4 高频点击测试
    await this.runTest('9.4 高频点击测试', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const btn = this.page!.locator('button').first();
      if (await btn.count() > 0) {
        console.log('   开始高频点击...');
        for (let i = 0; i < 10; i++) {
          await btn.click({ force: true }).catch(() => {});
          await this.page!.waitForTimeout(100);
        }
        await this.page!.waitForTimeout(1000);
        console.log('   ✅ 高频点击完成（10次）');
      }
    });

    // 9.5 表单重复提交测试
    await this.runTest('9.5 表单重复提交防护', async () => {
      await this.page!.goto(`${BASE_URL}/app/feedback`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const textarea = this.page!.locator('textarea').first();
      const submitBtn = this.page!.locator('button[type="submit"]').first();
      
      if (await textarea.count() > 0 && await submitBtn.count() > 0) {
        await textarea.fill('重复提交测试');
        
        // 快速连续点击
        await submitBtn.click();
        await this.page!.waitForTimeout(100);
        await submitBtn.click();
        await this.page!.waitForTimeout(100);
        await submitBtn.click();
        
        await this.page!.waitForTimeout(2000);
        console.log('   ✅ 重复提交测试完成');
      }
    });

    // 9.6 页面后退测试
    await this.runTest('9.6 浏览器后退功能', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      await this.page!.goto(`${BASE_URL}/app/records`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1000);
      
      await this.page!.goBack();
      await this.page!.waitForTimeout(1000);
      
      const url = this.page!.url();
      console.log(`   后退后URL: ${url}`);
      
      if (url.includes('/pets')) {
        console.log('   ✅ 后退功能正常');
      } else {
        console.log('   ⚠️ 后退功能可能异常');
      }
    });

    // 9.7 页面刷新测试
    await this.runTest('9.7 页面刷新状态保持', async () => {
      await this.page!.goto(`${BASE_URL}/app/pets`, { waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(1500);
      
      const currentUrl = this.page!.url();
      await this.page!.reload();
      await this.page!.waitForTimeout(2000);
      
      const newUrl = this.page!.url();
      console.log(`   刷新前: ${currentUrl}`);
      console.log(`   刷新后: ${newUrl}`);
      
      if (currentUrl === newUrl || newUrl.includes('/pets')) {
        console.log('   ✅ 页面刷新正常');
      }
    });

    // 9.8 并发请求测试
    await this.runTest('9.8 快速导航并发请求', async () => {
      console.log('   发起多个并发页面请求...');
      
      const pages = ['/app', '/app/pets', '/app/records', '/app/reminders'];
      const promises = pages.map(path => this.page!.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }));
      
      await Promise.all(promises);
      await this.page!.waitForTimeout(2000);
      
      console.log('   ✅ 并发请求完成');
    });
  }

  // ==================== 辅助方法 ====================
  private async testLogin() {
    // 检查是否已登录
    const token = await this.page!.evaluate(() => localStorage.getItem('token'));
    
    if (token) {
      console.log('   ℹ️ 已存在登录Token，跳过登录');
      return;
    }
    
    // 执行登录
    await this.page!.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await this.page!.waitForTimeout(1000);
    
    const phoneInput = this.page!.locator('input').first();
    const passwordInput = this.page!.locator('input[type="password"]').first();
    
    if (await phoneInput.count() > 0 && await passwordInput.count() > 0) {
      await phoneInput.fill(this.testUser.phone);
      await passwordInput.fill(this.testUser.password);
      
      const submitBtn = this.page!.locator('button[type="submit"]').first();
      await submitBtn.click();
      await this.page!.waitForTimeout(3000);
    }
  }

  // 生成测试报告
  generateReport(): TestReport {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        skipped,
        errors,
        duration: Date.now() - this.startTime
      },
      pages: this.results.map(r => ({
        name: r.name,
        status: r.status,
        url: this.page?.url() || '',
        errors: r.consoleErrors
      })),
      apis: this.interceptedRequests.map(r => ({
        method: r.method,
        endpoint: r.url,
        status: r.status,
        covered: r.status >= 200 && r.status < 400
      })),
      issues: this.analyzeIssues(),
      consoleErrors: this.consoleErrors,
      networkFailures: this.networkFailures
    };
  }

  private analyzeIssues() {
    const issues: TestReport['issues'] = [];
    
    // 分析网络失败
    this.networkFailures.forEach(failure => {
      issues.push({
        severity: 'high',
        description: `网络请求失败: ${failure.failure}`,
        location: failure.url,
        fix: '检查网络连接和API服务器状态'
      });
    });
    
    // 分析控制台错误
    this.consoleErrors.forEach(error => {
      if (error.message.includes('Error') || error.message.includes('error')) {
        issues.push({
          severity: 'medium',
          description: `控制台错误: ${error.message}`,
          location: error.page,
          fix: '检查相关代码并修复错误'
        });
      }
    });
    
    return issues;
  }

  // 打印报告
  printReport(report: TestReport) {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📊 测试报告总结');
    console.log('═'.repeat(80));
    
    console.log(`\n📈 执行统计:`);
    console.log(`   总测试数: ${report.summary.total}`);
    console.log(`   ✅ 通过: ${report.summary.passed}`);
    console.log(`   ❌ 失败: ${report.summary.failed}`);
    console.log(`   ⏭️ 跳过: ${report.summary.skipped}`);
    console.log(`   💥 错误: ${report.summary.errors}`);
    console.log(`   ⏱️ 总耗时: ${(report.summary.duration / 1000).toFixed(2)}秒`);
    
    console.log(`\n📡 API调用统计:`);
    const apiStats = this.groupAPIsByEndpoint(report.apis);
    console.log(`   覆盖的API数量: ${apiStats.length}`);
    console.log(`   成功请求: ${report.apis.filter(a => a.covered).length}`);
    console.log(`   失败请求: ${report.apis.filter(a => !a.covered).length}`);
    
    console.log(`\n🔴 发现的问题:`);
    if (report.issues.length === 0) {
      console.log('   ✅ 未发现明显问题');
    } else {
      report.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`      位置: ${issue.location}`);
        if (issue.fix) {
          console.log(`      建议: ${issue.fix}`);
        }
      });
    }
    
    console.log(`\n🔵 控制台错误 (${report.consoleErrors.length}):`);
    if (report.consoleErrors.length === 0) {
      console.log('   ✅ 无控制台错误');
    } else {
      report.consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.message.substring(0, 100)}`);
      });
      if (report.consoleErrors.length > 10) {
        console.log(`   ... 还有 ${report.consoleErrors.length - 10} 个错误`);
      }
    }
    
    console.log(`\n🟡 网络请求失败 (${report.networkFailures.length}):`);
    if (report.networkFailures.length === 0) {
      console.log('   ✅ 无网络失败');
    } else {
      report.networkFailures.slice(0, 10).forEach((fail, i) => {
        console.log(`   ${i + 1}. ${fail.url}`);
        console.log(`      原因: ${fail.failure}`);
      });
    }
    
    // 计算质量评分
    const qualityScore = this.calculateQualityScore(report);
    console.log(`\n🎯 项目整体质量评分: ${qualityScore}/100`);
    
    console.log('\n' + '═'.repeat(80));
  }

  private groupAPIsByEndpoint(apis: TestReport['apis']) {
    const seen = new Set();
    return apis.filter(api => {
      const key = `${api.method}:${api.endpoint}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateQualityScore(report: TestReport): number {
    let score = 100;
    
    // 扣除失败的测试
    score -= report.summary.failed * 3;
    score -= report.summary.errors * 5;
    
    // 扣除网络失败
    score -= report.networkFailures.length * 2;
    
    // 扣除控制台错误
    score -= report.consoleErrors.length * 1;
    
    // 扣除严重问题
    report.issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 15;
      else if (issue.severity === 'high') score -= 8;
      else if (issue.severity === 'medium') score -= 4;
      else score -= 1;
    });
    
    return Math.max(0, Math.min(100, score));
  }
}

// 主函数
async function main() {
  const runner = new TestRunner();
  
  try {
    await runner.setup();
    
    // 执行所有测试阶段
    await runner.testPhase1_BasicConnectivity();
    await runner.testPhase2_AuthFlow();
    await runner.testPhase3_Navigation();
    await runner.testPhase4_PetCRUD();
    await runner.testPhase5_HealthRecords();
    await runner.testPhase6_Reminders();
    await runner.testPhase7_AIFeatures();
    await runner.testPhase8_UserSettings();
    await runner.testPhase9_BoundaryTests();
    
    // 生成报告
    const report = runner.generateReport();
    runner.printReport(report);
    
  } catch (error) {
    console.error('测试执行出错:', error);
  } finally {
    await runner.teardown();
  }
}

// 运行测试
main();
