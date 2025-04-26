import { test, expect } from '../../fixtures/fixtures';
import { ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { ProjectLogPage } from '../../pages/projectLogPage';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// 导入测试数据
const testData = require('../../test-data/project-log.json');

// 加载环境变量
const env = process.env.NODE_ENV || 'production';
dotenv.config({ path: path.resolve(__dirname, `../../environments/.env.${env}`) });

// 从环境变量中获取应用路径
const electronAppPath = process.env.ELECTRON_APP_PATH;
console.log('Electron应用路径:', electronAppPath);

// 设置测试超时时间
test.setTimeout(10 * 60 * 1000);

// 从测试数据文件中获取测试数据
const PROJECT_NAME = testData.projectData.projectName;
const LOG_DATE = testData.projectData.logDate;
const WORK_CONTENT = testData.projectData.workContent;
const PROJECT_SUB_NAME = testData.projectData.projectSubName;

// 截图目录
const SCREENSHOTS_DIR = path.resolve(testData.screenshotsDir);

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('贝贝管理项目日志填报测试 - 分步骤', () => {
  let electronApp: ElectronApplication | undefined;
  let initialUrl: string = '';
  
  // 在所有测试之前启动Electron应用
  test.beforeAll(async () => {
    const electronPath = require('electron');
    console.log('Electron路径:', electronPath);
    
    try {
      electronApp = await electron.launch({
        executablePath: electronAppPath,
        args: [
          '--enable-javascript',
          '--no-sandbox',
          '--disable-web-security',
          '--no-default-browser-check',
          '--no-first-run'
        ],
        env: {
          ELECTRON_ENABLE_LOGGING: 'true',
          ELECTRON_ENABLE_STACK_DUMPING: 'true',
          ELECTRON_NO_ATTACH_CONSOLE: 'true',
          PLAYWRIGHT_CHROMIUM_USE_ELECTRON: 'true'
        },
        recordVideo: {
          dir: 'videos/',
          size: { width: 1280, height: 720 }
        }
      });
      
      console.log('Electron应用已启动');
    } catch (error) {
      console.log('启动Electron应用失败:', error);
      throw error;
    }
  });
  
  // 关闭测试后保持应用程序运行或自动关闭
  test.afterAll(async () => {
    // 检查环境变量是否设置为保持应用运行
    const keepRunning = process.env.KEEP_APP_RUNNING === 'true';
    
    if (keepRunning) {
      console.log('\n==================================================');
      console.log('应用将继续运行，请按Ctrl+C手动关闭');
      console.log('==================================================\n');
      
      // 使用setInterval保持进程运行，直到用户手动关闭
      const interval = setInterval(() => {}, 1000);
      
      // 监听SIGINT信号（Ctrl+C）
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n正在关闭应用...');
        electronApp?.close();
      });
    } else {
      // 自动关闭应用
      console.log('\n==================================================');
      console.log('测试完成，正在关闭应用并生成报告...');
      console.log('==================================================\n');
      
      // 截图最终状态
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'final-state.png') });
      } catch (error) {
        console.log('无法截取最终状态:', error);
      }
      
      // 关闭应用
      await electronApp?.close();
    }
  });
  
  // 步骤 1: 应用程序启动
  test('步骤 1: 应用程序启动', async () => {
    try {
      // 获取窗口
      const window = await electronApp!.firstWindow();
      console.log('已获取主窗口');
      
      // 等待页面加载
      await window.waitForLoadState('domcontentloaded');
      await window.waitForLoadState('networkidle');
      
      // 记录初始URL，用于后续验证登录状态
      initialUrl = window.url();
      console.log('初始页面URL:', initialUrl);      
     
      
      // 保存初始页面截图
      await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step1-app-launch.png') });
      
      // 验证应用已正确启动
      expect(window).toBeTruthy();
      console.log('步骤 1 完成: 应用程序已成功启动');
    } catch (error) {
      console.log('步骤 1 失败:', error);
      throw error;
    }
  });
  
  
  // 步骤 2: 二维码登录
  test('步骤 2: 二维码登录', async ({ qrCodeLoginPage }) => {
    try {
      let window = await electronApp!.firstWindow();
      
      // 检测登录方式
      const loginMethod = await qrCodeLoginPage.detectLoginMethod(window);
      console.log(`检测到的登录方式: ${loginMethod}`);
      
      // 根据登录方式执行登录流程
      if (loginMethod === 'qrcode') {
        // 执行二维码登录流程
        const loginSuccess = await qrCodeLoginPage.handleQrCodeLogin(
          initialUrl, 
          path.join(SCREENSHOTS_DIR, 'step2-qrcode.png'),
          window
        );
        
        if (!loginSuccess) {
          throw new Error('登录失败');
        }
        
        console.log('登录成功！');
        
        // 重要：登录成功后重新获取窗口
        try {
          // 短暂等待确保新窗口已加载
          await new Promise(resolve => setTimeout(resolve, 2000));
          window = await electronApp!.firstWindow();
          console.log('成功重新获取窗口');
          
          // 等待页面重新加载
          await window.waitForLoadState('domcontentloaded');
          await window.waitForLoadState('networkidle');
          
          // 保存登录成功后的页面截图
          await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step2-login-success.png') });
        } catch (windowError) {
          console.log('重新获取窗口失败:', windowError);
          // 即使截图失败，也继续测试流程
        }
      } else {
        throw new Error(`当前测试只支持二维码登录，检测到的登录方式: ${loginMethod}`);
      }
      
      console.log('步骤 2 完成: 登录成功');
    } catch (error) {
      console.log('步骤 2 失败:', error);
      
      try {
        // 尝试重新获取窗口并截图
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step2-login-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
  
  // 步骤 3: 业务操作 - 点击业务按钮
  test('步骤 3: 点击业务按钮', async ({ businessPage }) => {
    try {
      const window = await electronApp!.firstWindow();
      
      // 点击业务按钮
      const businessClicked = await businessPage.clickBusinessButton(window);
      if (!businessClicked) {
        throw new Error('点击业务按钮失败');
      }
      
      // 保存截图
      await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step3-business-click.png') });
      
      // 等待页面加载
      await businessPage.waitForPageLoad(window);
      
      console.log('步骤 3 完成: 成功点击业务按钮');
    } catch (error) {
      console.log('步骤 3 失败:', error);
      
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step3-business-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
  
  // 步骤 4: 业务操作 - 点击项目按钮
  test('步骤 4: 点击项目按钮', async ({ businessPage }) => {
    try {
      const window = await electronApp!.firstWindow();
      
      // 点击项目按钮
      const projectFrame = await businessPage.clickProjectButton(
        PROJECT_NAME, 
        path.join(SCREENSHOTS_DIR, 'step4-project-click.png'),
        window
      );
      
      if (!projectFrame) {
        throw new Error('点击项目按钮失败');
      }
      
      // 保存在测试上下文中，以便后续测试使用
      test.info().annotations.push({
        type: 'projectFrame',
        description: 'ProjectFrame已创建'
      });
      
      console.log('步骤 4 完成: 成功点击项目按钮');
    } catch (error) {
      console.log('步骤 4 失败:', error);
      
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step4-project-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
  
  // 步骤 5: 业务操作 - 点击管理按钮
  test('步骤 5: 点击管理按钮', async ({ businessPage }) => {
    try {
      const window = await electronApp!.firstWindow();
      
      // 重新获取项目Frame
      const tabPanel = window.getByRole('tabpanel');
      const iframe = tabPanel.locator('iframe').first();
      const projectFrame = await iframe.contentFrame();
      
      if (!projectFrame) {
        throw new Error('无法获取项目Frame');
      }
      
      // 点击管理按钮
      const innerFrame = await businessPage.clickManageButton(
        projectFrame as any, 
        path.join(SCREENSHOTS_DIR, 'step5-manage-click.png')
      );
      
      if (!innerFrame) {
        throw new Error('点击管理按钮失败');
      }
      
      console.log('步骤 5 完成: 成功点击管理按钮');
    } catch (error) {
      console.log('步骤 5 失败:', error);
      
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step5-manage-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
  
  // 步骤 6: 业务操作 - 点击项目日志填报按钮
  test('步骤 6: 点击项目日志填报按钮', async ({ businessPage }) => {
    try {
      const window = await electronApp!.firstWindow();
      
      // 重新获取项目Frame和内部Frame
      const tabPanel = window.getByRole('tabpanel');
      const iframe = tabPanel.locator('iframe').first();
      const projectFrame = await iframe.contentFrame();
      
      if (!projectFrame) {
        throw new Error('无法获取项目Frame');
      }
      
      const nestedIframe = projectFrame.locator('iframe').nth(1);
      const innerFrame = await nestedIframe.contentFrame();
      
      if (!innerFrame) {
        throw new Error('无法获取内部Frame');
      }
      
      // 点击项目日志填报按钮
      const logButtonClicked = await businessPage.clickProjectLogButton(
        innerFrame as any, 
        path.join(SCREENSHOTS_DIR, 'step6-log-button-click.png')
      );
      
      if (!logButtonClicked) {
        throw new Error('点击项目日志填报按钮失败');
      }
      
      console.log('步骤 6 完成: 成功点击项目日志填报按钮');
    } catch (error) {
      console.log('步骤 6 失败:', error);
      
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step6-log-button-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
  
  // 步骤 7: 填写日志表单
  test('步骤 7: 填写日志表单', async () => {
    try {
      const window = await electronApp!.firstWindow();
      
      // 重新获取项目Frame
      const tabPanel = window.getByRole('tabpanel');
      const iframe = tabPanel.locator('iframe').first();
      const projectFrame = await iframe.contentFrame();
      
      if (!projectFrame) {
        throw new Error('无法获取项目Frame');
      }
      
      // 创建项目日志页面对象
      const projectLogPage = new ProjectLogPage(window, projectFrame as any);
      
      // 填写日志表单
      const formFilled = await projectLogPage.fillLogForm(
        PROJECT_SUB_NAME, 
        LOG_DATE,
        WORK_CONTENT,
        SCREENSHOTS_DIR
      );
      
      if (!formFilled) {
        throw new Error('填写表单失败');
      }
      
      // 保存表单填写完成后的截图
      await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step7-form-filled.png') });
      
      console.log('步骤 7 完成: 成功填写日志表单');
    } catch (error) {
      console.log('步骤 7 失败:', error);
      
      try {
        const window = await electronApp!.firstWindow();
        await window.screenshot({ path: path.join(SCREENSHOTS_DIR, 'step7-form-error.png') });
      } catch (screenshotError) {
        console.log('无法保存错误截图:', screenshotError);
      }
      
      throw error;
    }
  });
}); 