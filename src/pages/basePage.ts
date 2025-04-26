import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 基础页面类，包含所有页面共用的方法和属性
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 确保截图目录存在
   * @param screenshotDir 截图目录
   */
  protected ensureScreenshotDir(screenshotDir: string): void {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  }

  /**
   * 通用的截图方法
   * @param screenshotPath 截图路径
   * @param options 截图选项
   */
  async takeScreenshot(screenshotPath: string, options: {
    fullPage?: boolean;
    timeout?: number;
    waitForNetworkIdle?: boolean;
    externalPage?: Page;
  } = {}): Promise<boolean> {
    const {
      fullPage = true,
      timeout = 10000,
      waitForNetworkIdle = false,
      externalPage
    } = options;

    try {
      // 确保目录存在
      this.ensureScreenshotDir(path.dirname(screenshotPath));
      
      // 使用外部Page或内部page
      const pageToUse = externalPage || this.page;

      // 等待网络请求完成
      if (waitForNetworkIdle) {
        try {
          await pageToUse.waitForLoadState('networkidle', { timeout });
        } catch (error) {
          console.log('等待网络空闲超时，继续执行');
        }
      }

      // 执行截图
      await pageToUse.screenshot({ 
        path: screenshotPath,
        fullPage
      });
      
      console.log(`页面截图已保存: ${screenshotPath}`);
      return true;
    } catch (error: any) {
      console.log(`截图失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 等待页面加载完成
   * @param externalPage 可选的外部Page对象
   */
  async waitForPageLoad(externalPage?: Page) {
    const pageToUse = externalPage || this.page;
    
    // 日志文件路径
    const requestLogPath = path.resolve('request_log.csv');
    const requestFinishedLogPath = path.resolve('requestfinished_log.csv');
    const requestFailedLogPath = path.resolve('requestfailed_log.csv');

    // 写入表头（如果文件不存在）
    function appendCsv(filePath: string, row: string) {
      fs.appendFileSync(filePath, row + '\n', 'utf-8');
    }
    if (!fs.existsSync(requestLogPath)) {
      appendCsv(requestLogPath, 'time|url|method|headers|postData');
    }
    if (!fs.existsSync(requestFinishedLogPath)) {
      appendCsv(requestFinishedLogPath, 'time|url|status|statusText|headers|body');
    }
    if (!fs.existsSync(requestFailedLogPath)) {
      appendCsv(requestFailedLogPath, 'time|url|method|errorText');
    }

    try {
      // 等待DOM内容加载完成，超时时间设置为60秒
      await pageToUse.waitForLoadState('domcontentloaded', { timeout: 60000 });
      console.log('DOM加载完成');
      
      // 等待页面加载完成（包括图片等资源）
      await pageToUse.waitForLoadState('load', { timeout: 30000 });
      console.log('页面资源加载完成');
      
      const pendingRequests = new Set();
      
      pageToUse.on('request', request => {
        const row = [
          new Date().toISOString(),
          request.url(),
          request.method(),
          request.headers() ? JSON.stringify(request.headers()) : '',
          request.postData() ? JSON.stringify(request.postData()) : ''
        ].join('|');
        appendCsv(requestLogPath, row);
        pendingRequests.add(request.url());
      });
      pageToUse.on('requestfinished', async request => {
        const response = await request.response();
        let status = '', statusText = '', headers = '', body = '';
        if (response) {
          status = String(response.status());
          statusText = String(response.statusText());
          headers = JSON.stringify(response.headers());
          const contentType = response.headers()['content-type'] || '';
          if ([301, 302, 303, 307, 308].includes(response.status())) {
            body = '<redirect response: no body>';
          } else {
            if (contentType.includes('application/json')) {
              body = (await response.body()).toString('utf-8');
              if (body.length > 5000) body = body.slice(0, 5000) + '...';
            } else {
              body = `<${contentType}> length: ${(await response.body()).length}`;
            }
          }
        }
        const row = [
          new Date().toISOString(),
          request.url(),
          status,
          statusText,
          headers,
          JSON.stringify(body)
        ].join('|');
        appendCsv(requestFinishedLogPath, row);
        pendingRequests.delete(request.url());
      });
      pageToUse.on('requestfailed', request => {
        const row = [
          new Date().toISOString(),
          request.url(),
          request.method(),
          request.failure()?.errorText || ''
        ].join('|');
        appendCsv(requestFailedLogPath, row);
        pendingRequests.delete(request.url());
      });
     
      // 等待 networkidle
      await pageToUse.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        console.log('等待网络空闲超时，未完成请求：', Array.from(pendingRequests));
      });
      
      // // 给予短暂的额外等待时间，确保UI渲染
      // await pageToUse.waitForTimeout(1000);
    } catch (error: any) {
      console.log(`等待页面加载出错: ${error.message}`);
      // 即使出错也继续执行
    }
  }

  /**
   * 获取页面标题
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * 导航到指定URL
   * @param url 目标URL
   */
  async navigateTo(url: string) {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }
} 