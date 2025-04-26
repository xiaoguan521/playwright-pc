import { Locator, Page, Frame, FrameLocator } from '@playwright/test';
import { BasePage } from './basePage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 业务页面对象，处理业务操作和导航
 */
export class BusinessPage extends BasePage {
  // 页面元素
  readonly businessButton: Locator;
  readonly businessMenuItems: Locator;

  constructor(page: Page) {
    super(page);
    
    // 业务按钮可能的多种选择器
    this.businessButton = page.locator([
      'text="业务"',
      '[title="业务"]',
      '.business-menu',
      '[data-test="business"]',
      '//span[contains(text(), "业务")]',
      '//div[contains(text(), "业务")]'
    ].join(','));
    
    this.businessMenuItems = page.locator('.business-items .item, .menu-item');
  }

  /**
   * 安全截图，支持iframe内容
   * @param screenshotPath 截图路径
   * @param frame 可选的Frame对象，如果提供则高亮frame内容
   */
  async safeScreenshot(screenshotPath: string, frame?: Frame): Promise<boolean> {
    try {
      if (frame) {
        // 如果提供了frame，先高亮frame区域
        try {
          const frameElement = await frame.locator('body').first();
          await frameElement.highlight();
        } catch (e) {
          console.log('高亮frame失败，继续截图');
        }
      }
      
      return await this.takeScreenshot(screenshotPath, {
        fullPage: true,
        waitForNetworkIdle: true
      });
    } catch (error: any) {
      console.log(`截图失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 点击业务按钮
   * @param externalPage 可选的外部Page对象
   */
  async clickBusinessButton(externalPage?: Page): Promise<boolean> {
    console.log('尝试点击业务按钮...');
    
    const pageToUse = externalPage || this.page;
    
    try {
      // 尝试查找任何包含"业务"文本的可点击元素
      const businessButtonLocator = pageToUse.getByText('业务', { exact: false });
      const count = await businessButtonLocator.count();
      
      if (count > 0) {
        // 显示找到的元素数量
        console.log(`找到 ${count} 个业务相关元素`);
        
        // 获取第一个可见的业务按钮
        for (let i = 0; i < count; i++) {
          const button = businessButtonLocator.nth(i);
          if (await button.isVisible()) {           
            
            // 强调点击的元素（高亮它）
            await button.highlight();
            await button.click({ force: true }); 
            console.log(`成功点击第 ${i+1} 个业务按钮`);
            return true;
          }
        }
      }
      
      console.log('未找到可见的业务按钮，尝试其他方法');
      return false;
    } catch (error: any) {
      console.log(`点击业务按钮失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 点击项目按钮
   * @param projectName 项目名称
   * @param screenshotPath 截图路径
   * @param externalPage 可选的外部Page对象
   */
  async clickProjectButton(projectName: string, screenshotPath?: string, externalPage?: Page): Promise<Frame | null> {
    console.log(`尝试点击项目: ${projectName}`);

    // 使用外部Page或内部page
    const pageToUse = externalPage || this.page;
    let currentFrame: Frame | null = null;
    
    try {
      // 等待页面加载
      await super.waitForPageLoad(pageToUse);
      
      // 查找并获取 iframe
      const tabPanel = pageToUse.getByRole('tabpanel');
      await tabPanel.waitFor({ state: 'visible', timeout: 10000 });
      
      // 先获取iframe元素，然后获取其内容框架
      const iframeElement = await tabPanel.locator('iframe').first();
      await iframeElement.waitFor({ state: 'attached', timeout: 10000 });
      
      // 使用contentFrame()获取Frame对象
      const frameHandle = await iframeElement.contentFrame();
      currentFrame = frameHandle as unknown as Frame;
      if (!currentFrame) {
        throw new Error('无法获取iframe内容');
      }
      
      // 在 iframe 中查找并点击项目按钮
      const button = currentFrame.getByText(projectName, { exact: false });
      await button.waitFor({ state: 'visible', timeout: 10000 });
      
      
      await button.click();
      console.log(`成功点击项目: ${projectName}`);
      
      // 等待页面加载和网络请求完成
      await super.waitForPageLoad(pageToUse);
      
      // 点击后截图
     await this.safeScreenshot(screenshotPath!, currentFrame);
      
      
      return currentFrame as Frame;
    } catch (error: any) {
      console.log(`点击项目按钮失败: ${error.message}`);
      if (screenshotPath && currentFrame) {
        // 截取失败状态的截图
        const errorScreenshotPath = screenshotPath.replace('.png', '-error.png');
        await this.safeScreenshot(errorScreenshotPath, currentFrame);
      }
      return null;
    }
  }
  
  /**
   * 点击管理按钮并进入内部iframe
   * @param parentFrame 父级Frame
   * @param screenshotPath 截图路径
   */
  async clickManageButton(parentFrame: Frame, screenshotPath?: string): Promise<Frame | null> {
    console.log('尝试点击管理按钮...');

    try {
      // 在父级Frame中找到并点击管理按钮
      const manageButton = parentFrame.getByText('管理', { exact: true });
      await manageButton.waitFor({ state: 'visible', timeout: 10000 });
      await manageButton.click();
      console.log('成功点击管理按钮');
      
      // 如果提供了截图路径，保存截图
      if (screenshotPath) {
        await this.safeScreenshot(screenshotPath);
      }
      
      // 等待页面加载
      await super.waitForPageLoad();
      
      // 获取嵌套的iframe元素
      const nestedIframeElement = parentFrame.locator('iframe').nth(1);
      await nestedIframeElement.waitFor({ state: 'attached', timeout: 20000 });
      
      // 使用contentFrame()获取Frame对象
      const nestedFrame = await nestedIframeElement.contentFrame();
      if (!nestedFrame) {
        throw new Error('无法获取嵌套iframe内容');
      }
      
      console.log('成功获取嵌套iframe');
      return nestedFrame as unknown as Frame;
    } catch (error: any) {
      console.log(`点击管理按钮或获取嵌套iframe失败: ${error.message}`);
      if (screenshotPath) {
        // 截取失败状态的截图
        const errorScreenshotPath = screenshotPath.replace('.png', '-error.png');
        await this.safeScreenshot(errorScreenshotPath);
      }
      return null;
    }
  }
  
  /**
   * 点击项目日志填报按钮
   * @param innerFrame 内部Frame
   * @param screenshotPath 截图路径
   */
  async clickProjectLogButton(innerFrame: Frame, screenshotPath?: string): Promise<boolean> {
    console.log('尝试点击项目日志填报按钮...');

    try {
      // 在内部Frame中找到并点击项目日志填报按钮
      const logButton = innerFrame
        .locator('div')
        .filter({ hasText: /^项目日志填报$/ })
        .first();
      
      await logButton.waitFor({ state: 'visible', timeout: 30000 });
      // 如果提供了截图路径，保存截图
      if (screenshotPath) {
        await this.safeScreenshot(screenshotPath);
      }
      await logButton.click();
      console.log('成功点击项目日志填报按钮');
      
      
      return true;
    } catch (error: any) {
      console.log(`点击项目日志填报按钮失败: ${error.message}`);
      if (screenshotPath) {
        // 截取失败状态的截图
        const errorScreenshotPath = screenshotPath.replace('.png', '-error.png');
        await this.safeScreenshot(errorScreenshotPath);
      }
      return false;
    }
  }
  
 
} 