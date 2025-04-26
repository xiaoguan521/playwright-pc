import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import { QrCodeLoginPage } from '../pages/qrCodeLoginPage';
import { BusinessPage } from '../pages/businessPage';
import { ElectronApplication, Page } from '@playwright/test';

/**
 * 页面对象fixtures类型定义
 */
type PagesFixtures = {
  loginPage: LoginPage;
  qrCodeLoginPage: QrCodeLoginPage;
  businessPage: BusinessPage;
  electronWindow: Page; // 添加Electron窗口引用
};

/**
 * 扩展测试以包含页面对象
 */
export const test = base.extend<PagesFixtures>({
  // Electron窗口 - 使用这个替代常规的page
  electronWindow: async ({}, use, testInfo) => {
    // 不要使用空对象，让测试文件提供真实窗口
    await use(null as unknown as Page);
  },
  
  // 登录页面 - 使用electronWindow替代page
  loginPage: async ({ electronWindow, page }, use, testInfo) => {
    // 在测试文件中，我们会传入electronApp.firstWindow()作为electronWindow
    // 这里先使用常规page作为后备方案
    const windowToUse = electronWindow || page;
    await use(new LoginPage(windowToUse));
  },
  
  // 二维码登录页面
  qrCodeLoginPage: async ({ electronWindow, page }, use) => {
    const windowToUse = electronWindow || page;
    await use(new QrCodeLoginPage(windowToUse));
  },
  
  // 业务页面
  businessPage: async ({ electronWindow, page }, use) => {
    const windowToUse = electronWindow || page;
    await use(new BusinessPage(windowToUse));
  }
}); 