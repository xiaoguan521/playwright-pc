import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * 登录页面对象，封装了登录页面的元素和操作
 */
export class LoginPage extends BasePage {
  // 页面元素
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly qrCodeArea: Locator;

  constructor(page: Page) {
    super(page);
    // 定位器 - 这些选择器需要根据实际应用进行调整
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.errorMessage = page.locator('.error-message');
    this.qrCodeArea = page.locator('.qrcode-area');
  }

  /**
   * 使用用户名和密码登录
   * @param username 用户名
   * @param password 密码
   */
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // 等待导航完成
    await this.waitForPageLoad();
  }

  /**
   * 等待二维码出现
   */
  async waitForQrCode() {
    await expect(this.qrCodeArea).toBeVisible({ timeout: 10000 });
  }

  /**
   * 检查是否登录成功
   */
  async checkLoginSuccess() {
    // 这里需要根据实际应用调整 - 例如检查是否出现仪表盘元素
    return await this.page.locator('.dashboard').isVisible();
  }

  /**
   * 获取错误消息
   */
  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return '';
  }
} 