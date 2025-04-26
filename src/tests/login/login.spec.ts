import { test, expect } from '../../fixtures/fixtures';
import { ElectronApplication } from '@playwright/test';
import * as path from 'path';

test.describe('登录功能测试', () => {
  let electronApp: ElectronApplication | undefined;

  test.afterEach(async () => {
    // 如果测试期间创建了Electron应用实例，则在测试后关闭它
    if (electronApp) {
      await electronApp.close();
      electronApp = undefined;
    }
  });

  test('Web: 使用有效凭据登录', async ({ page, loginPage, baseUrl }) => {
    // 导航到登录页面
    await page.goto(baseUrl);
    
    // 使用页面对象模型执行登录
    const testData = require('../../test-data/users.json');
    await loginPage.login(testData.userData.validUser.username, testData.userData.validUser.password);
    
    // 验证登录成功
    await expect(await loginPage.checkLoginSuccess()).toBeTruthy();
  });

  test('Electron: 应用程序启动测试', async ({ electronAppPath }) => {
    // 跳过测试如果未配置应用路径
    test.skip(!electronAppPath, '未指定Electron应用路径');
    
    // 使用require动态导入Electron模块
    const { _electron } = require('playwright');
    
    try {
      // 启动Electron应用
      electronApp = await _electron.launch({
        executablePath: electronAppPath
      });
      
      // 获取第一个窗口
      const window = await electronApp.firstWindow();
      
      // 创建截图目录
      const fs = require('fs');
      if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots', { recursive: true });
      }
      
      // 截图
      await window.screenshot({ path: './screenshots/electron-app.png' });
      
      // 验证窗口标题
      const title = await window.title();
      console.log(`应用窗口标题: ${title}`);
      
      // 这里可以添加更多针对窗口内容的检查
      expect(title).toBeTruthy();
    } finally {
      // 测试结束后关闭应用
      if (electronApp) {
        await electronApp.close();
        electronApp = undefined;
      }
    }
  });
  
  test('Web: 使用无效凭据登录', async ({ page, loginPage, baseUrl }) => {
    // 导航到登录页面
    await page.goto(baseUrl);
    
    // 使用页面对象模型执行登录
    const testData = require('../../test-data/users.json');
    await loginPage.login(testData.userData.invalidUser.username, testData.userData.invalidUser.password);
    
    // 验证错误消息显示
    await expect(loginPage.errorMessage).toBeVisible();
    const errorMsg = await loginPage.getErrorMessage();
    console.log(`登录错误信息: ${errorMsg}`);
  });
}); 