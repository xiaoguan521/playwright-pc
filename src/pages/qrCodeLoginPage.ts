import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * 二维码登录页面对象，封装了二维码登录相关的元素和操作
 */
export class QrCodeLoginPage extends BasePage {
  // 页面元素
  readonly qrCodeArea: Locator;
  readonly qrCodeCanvas: Locator;
  readonly scanStatusText: Locator;
  readonly loginStatusText: Locator;

  constructor(page: Page) {
    super(page);
    // 定位器 - 需要根据实际应用调整
    this.qrCodeArea = page.locator('.qrcode, .qrcode-area, .qr-code-container');
    this.qrCodeCanvas = page.locator('canvas, .qrcode img, .qrcode-container img, img[src*="qrcode"], div[class*="qrcode"]');
    this.scanStatusText = page.locator('text="扫描成功", text="请在手机上确认登录"');
    this.loginStatusText = page.locator('text="登录中"');
  }

  /**
   * 等待二维码显示
   * @param externalPage 可选的外部Page对象
   */
  async waitForQrCodeDisplayed(externalPage?: Page) {
    console.log('等待二维码显示...');
    
    // 使用外部Page或内部page
    const pageToUse = externalPage || this.page;
    
    // 添加调试代码，输出页面HTML
    // const html = await pageToUse.content();
    // console.log('页面HTML片段:', html.substring(0, 1000)); // 输出前1000字符
    
    // 尝试找出可能的二维码元素
    const possibleQrElements = await pageToUse.locator('img, canvas, [class*="qr"], [class*="code"]').count();
    console.log(`发现 ${possibleQrElements} 个可能的二维码相关元素`);
    
    try {
      // 直接使用waitForSelector替代原来的waitFor方法
      await pageToUse.waitForSelector('canvas, .qrcode img, .qrcode-container img, img[src*="qrcode"]', { 
        state: 'visible', 
        timeout: 30000 
      });
      console.log('二维码已显示，请使用手机扫描');
    } catch (error: any) {
      console.log('无法找到标准二维码元素，尝试截取整个页面作为二维码');
      // 即使找不到二维码元素，也继续执行
    }
  }

  /**
   * 截取二维码图片
   * @param screenshotPath 截图保存路径
   * @param externalPage 可选的外部Page对象
   */
  async takeQrCodeScreenshot(screenshotPath: string, externalPage?: Page) {
    await this.takeScreenshot(screenshotPath, {
      externalPage,
      waitForNetworkIdle: true,
      fullPage: true
    });
  }

  /**
   * 检测是否已扫描
   * @param externalPage 可选的外部Page对象
   */
  async isScanned(externalPage?: Page) {
    try {
      // 使用外部Page或内部page
      const pageToUse = externalPage || this.page;
      
      // 获取页面文本内容
      const pageText = await pageToUse.evaluate(() => document.body.textContent || '');
      
      // 检查是否包含扫描成功的提示文本
      if (pageText.includes('扫描成功') || pageText.includes('请在手机上确认登录')) {
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.log('检查扫描状态出错:', error);
      return false;
    }
  }

  /**
   * 检测是否登录成功
   * @param initialUrl 初始URL
   * @param externalPage 可选的外部Page对象
   */
  async isLoginSuccess(initialUrl: string, externalPage?: Page) {
    try {
      // 使用外部Page或内部page
      const pageToUse = externalPage || this.page;
      
      const currentUrl = pageToUse.url();

      // 通过URL变化检测登录状态
      if (currentUrl !== initialUrl && !currentUrl.includes('login')) {
        console.log('检测到URL变化，可能已登录成功');
        return true;
      }

      // 通过页面内容检测登录状态
      const pageText = await pageToUse.evaluate(() => {
        const visibleElements = Array.from(document.querySelectorAll('body *'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
        return visibleElements.map(el => el.textContent).join(' ');
      });
      
      if (pageText.includes('扫描成功') && pageText.includes('请在手机上点击确定以登录')) {
        console.log('用户已扫描，等待手机端确认登录');
        return false;
      }

      if (pageText.includes('登录中')) {
        console.log('正在登录中...');
        return false;
      }

      return false;
    } catch (error: any) {
      if (error.message.includes('Target page, context or browser has been closed')) {
        console.log('窗口已关闭，可能是登录成功导致页面刷新');
        return true;
      }
      console.log('检查登录状态出错:', error);
      return false;
    }
  }

  /**
   * 处理二维码登录流程
   * @param initialUrl 初始URL
   * @param screenshotPath 截图保存路径
   * @param externalPage 可选的外部Page对象，用于覆盖内部page
   */
  async handleQrCodeLogin(initialUrl: string, screenshotPath: string, externalPage?: Page) {
    console.log('开始二维码登录流程...');
    
    // 使用外部Page或内部page
    const pageToUse = externalPage || this.page;
    
    // 等待二维码显示
    await this.waitForQrCodeDisplayed(pageToUse);
    
    // 保存二维码截图
    await this.takeScreenshot(screenshotPath, {
      externalPage: pageToUse,
      waitForNetworkIdle: true,
      fullPage: true
    });
    
    // 等待扫描和登录
    let isScanned = false;
    let isLoggedIn = false;
    let totalWaitTime = 0;
    const checkInterval = 1000;
    const maxWaitTime = 2 * 60 * 1000; // 2分钟超时
    
    while (totalWaitTime < maxWaitTime) {
      try {
        // 检查是否登录成功
        isLoggedIn = await this.isLoginSuccess(initialUrl, pageToUse);
        if (isLoggedIn) {
          console.log('检测到登录成功！');
          return true;
        }

        // 检查是否已扫描但未确认
        if (!isScanned) {
          isScanned = await this.isScanned(pageToUse);
          if (isScanned) {
            console.log('\n------------------------------------');
            console.log('检测到扫描成功！');
            console.log('请在手机上确认登录');
            console.log('------------------------------------\n');
          }
        }

        // 定期输出等待状态
        if (totalWaitTime % 5000 === 0) {
          if (!isScanned) {
            console.log(`等待用户扫描二维码... 已等待 ${totalWaitTime/1000} 秒`);
          } else {
            console.log(`等待用户确认登录... 已等待 ${totalWaitTime/1000} 秒`);
          }
        }

        // 等待一段时间再检查
        await pageToUse.waitForTimeout(checkInterval);
        totalWaitTime += checkInterval;
      } catch (error: any) {
        if (error.message.includes('Target page, context or browser has been closed')) {
          console.log('检测到窗口关闭，可能是登录成功导致页面刷新');
          return true;
        }
        throw error;
      }
    }

    // 超时处理
    const errorMessage = isScanned ? '等待登录确认超时' : '等待扫描二维码超时';
    throw new Error(errorMessage);
  }

  /**
   * 识别登录方式
   * @param externalPage 可选的外部Page对象
   */
  async detectLoginMethod(externalPage?: Page): Promise<string> {
    const pageToUse = externalPage || this.page;
    
    try {
      // 等待页面加载完成
      await super.waitForPageLoad(pageToUse);     
     
      // 尝试多个可能的选择器
      const selectors = [
        'canvas', // 把canvas移到最前面，因为它最可能存在
      ];
      
      // 先检查哪些元素已经存在，避免不必要的等待
      for (const selector of selectors) {
        const exists = await pageToUse.locator(selector).count() > 0;
        if (exists) {
          console.log(`找到登录元素: ${selector}`);
          return 'qrcode';
        }
      }
      
      // 如果没有立即找到元素，再等待它们出现
      for (const selector of selectors) {
        try {
          console.log(`等待元素: ${selector}`);
          const element = await pageToUse.waitForSelector(selector, { timeout: 5000 });
          if (!element) {
            console.log(`元素等待返回空: ${selector}`);
            continue;
          }
          console.log(`找到登录元素: ${selector}`);
          return 'qrcode';
        } catch (error: any) {
          // 如果在等待过程中页面已经跳转，说明可能已经登录
          if (error.message.includes('Target closed') || error.message.includes('Target page, context or browser has been closed')) {
            console.log('页面已跳转，可能已登录');
            return 'already_logged_in';
          }
          console.log(`等待元素超时: ${selector}`);
          continue;
        }
      }
      
      // 如果所有选择器都没找到，但页面还在，再尝试检查页面内容
      try {
        const pageText = await pageToUse.evaluate(() => document.body.innerText);
        const qrcodeKeywords = ['二维码', 'qrcode', 'QRCode', '扫码', '扫描', '手机扫码'];
        const loginKeywords = ['登录', '登陆', 'login', 'Login', 'LOGIN'];
        
        // 检查是否是登录页面
        let isLoginPage = false;
        for (const keyword of loginKeywords) {
          if (pageText.includes(keyword)) {
            isLoginPage = true;
            break;
          }
        }
        
        if (!isLoginPage) {
          console.log('当前页面不是登录页面');
          return 'unknown';
        }
        
        // 检查是否是二维码登录
        for (const keyword of qrcodeKeywords) {
          if (pageText.includes(keyword)) {
            console.log(`检测到二维码登录关键词: ${keyword}`);
            return 'qrcode';
          }
        }
      } catch (error: any) {
        if (error.message.includes('Target closed') || error.message.includes('Target page, context or browser has been closed')) {
          console.log('页面已跳转，可能已登录');
          return 'already_logged_in';
        }
        console.log('检查页面内容出错:', error);
      }
      
      return 'unknown';
    } catch (error: any) {
      console.log('登录方式检测出错:', error);
      
      // 如果是页面关闭错误，可能是因为已经登录导致页面跳转
      if (error.message.includes('Target closed') || error.message.includes('Target page, context or browser has been closed')) {
        console.log('页面已跳转，可能已登录');
        return 'already_logged_in';
      }
      
      // 其他错误情况下，返回 unknown
      console.log('检测失败，返回 unknown');
      return 'unknown';
    }
  }
} 