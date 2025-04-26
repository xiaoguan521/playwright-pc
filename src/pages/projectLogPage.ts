import { Locator, Page, Frame } from '@playwright/test';
import { BasePage } from './basePage';
import * as path from 'path';

/**
 * 项目日志填报页面对象
 */
export class ProjectLogPage extends BasePage {
  // 父级Frame，用于操作表单
  private frame: Frame;

  constructor(page: Page, frame: Frame) {
    super(page);
    this.frame = frame;
  }

  /**
   * 获取日期选择器
   */
  getDatePicker() {
    return this.frame.locator('#dx_11181_riqi, [id*="riqi"], [id*="date"]').first();
  }

  /**
   * 获取项目下拉框
   */
  getProjectSelect() {
    return this.frame.getByRole('combobox').nth(2);
  }

  /**
   * 获取工作内容文本框
   */
  getWorkContentTextarea() {
    return this.frame.locator('textarea').first();
  }

  /**
   * 获取提交按钮
   */
  getSubmitButton() {
    return this.frame.locator('button:has-text("提交"), .ant-btn-primary:has-text("提交")').first();
  }

  /**
   * 选择日期
   * @param date 日期字符串，格式：YYYY-MM-DD
   */
  async selectDate(date: string): Promise<boolean> {
    console.log(`尝试选择日期: ${date}`);
    
    try {
      // 使用与page-operations-test.spec.js相同的选择器
      const datePickerInput = await this.frame.locator('#dx_11181_riqi').getByRole('textbox');
      console.log('找到日期选择器，尝试点击');
      await datePickerInput.click();
      
      // 等待日期选择面板出现
      const datePanel = await this.frame.locator('.ant-calendar-input-wrap');
      await datePanel.waitFor({ state: 'visible', timeout: 30000 });
      console.log('日期选择面板已显示');
      
      // 在日期面板中找到输入框并输入日期
      const calendarInput = await datePanel.locator('input');
      await calendarInput.fill(date);
      await calendarInput.press('Enter');
      
      console.log(`日期已选择: ${date}`);
      return true;
    } catch (error: any) {
      console.log(`选择日期失败: ${error.message}`);
      
      // 尝试备用方法
      try {
        console.log('尝试备用方法设置日期...');
        
        // 使用evaluate方法，通过JavaScript直接操作DOM
        const dateSet = await this.frame.evaluate((params: { selector: string, dateValue: string }) => {
          try {
            // 查找日期输入框
            const input = document.querySelector(params.selector);
            if (input) {
              // 打开日期选择器
              (input as HTMLElement).click();
              
              // 等待日期面板出现
              setTimeout(() => {
                // 查找日期输入面板
                const panel = document.querySelector('.ant-calendar-input-wrap input');
                if (panel && panel instanceof HTMLInputElement) {
                  // 设置日期并触发回车事件
                  panel.value = params.dateValue;
                  panel.dispatchEvent(new Event('input', { bubbles: true }));
                  panel.dispatchEvent(new KeyboardEvent('keydown', { 
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true 
                  }));
                  return true;
                }
              }, 1000);
            }
            return false;
          } catch (e) {
            console.error(e);
            return false;
          }
        }, { selector: '#dx_11181_riqi', dateValue: date });
        
        if (dateSet) {
          console.log(`备用方法成功设置日期: ${date}`);
          return true;
        }
      } catch (backupError: any) {
        console.log(`备用方法设置日期失败: ${backupError.message}`);
      }
      
      // 截图记录失败状态
      await this.page.screenshot({ path: 'date-selection-failed.png' });
      return false;
    }
  }

  /**
   * 选择项目
   * @param projectName 项目名称
   */
  async selectProject(projectName: string): Promise<boolean> {
    console.log(`尝试选择项目: ${projectName}`);
    
    try {
      // 点击项目下拉框
      const combobox = await this.getProjectSelect();
      await combobox.waitFor({ state: 'visible', timeout: 10000 });
      await combobox.click();
      
      // 等待选项出现
      await this.page.waitForTimeout(1000);
      
      // 选择项目选项
      const option = await this.frame.getByRole('option', { name: projectName }).locator('div');
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
      
      console.log(`项目已选择: ${projectName}`);
      return true;
    } catch (error: any) {
      console.log(`选择项目失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 填写工作内容
   * @param content 工作内容文本
   */
  async fillWorkContent(content: string): Promise<boolean> {
    console.log('尝试填写工作内容');
    
    try {
      // 获取工作内容文本框
      const textarea = await this.getWorkContentTextarea();
      await textarea.waitFor({ state: 'visible', timeout: 10000 });
      
      // 填写内容
      await textarea.click();
      await textarea.fill(content);
      
      console.log('工作内容已填写');
      return true;
    } catch (error: any) {
      console.log(`填写工作内容失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 分析表单字段
   * 此方法用于分析表单结构，帮助调试
   */
  async analyzeFormFields(): Promise<void> {
    console.log('\n==== 开始分析表单字段 ====');
    
    try {
      // 分析表单项
      const formItems = await this.frame.locator('.ant-form-item').all();
      console.log(`找到 ${formItems.length} 个表单项`);
      
      // 分析表单标签
      const formLabels = await this.frame.locator('.ant-form-item-label').allTextContents();
      console.log('表单标签:', formLabels);
      
      // 分析输入框
      const inputs = await this.frame.locator('input[type="text"], input[type="password"], input[type="number"]').all();
      console.log(`找到 ${inputs.length} 个输入框`);
      
      // 分析下拉框
      const selects = await this.frame.locator('.ant-select').all();
      console.log(`找到 ${selects.length} 个下拉框`);
      
      // 分析文本框
      const textareas = await this.frame.locator('textarea').all();
      console.log(`找到 ${textareas.length} 个文本框`);
      
      // 分析按钮
      const buttons = await this.frame.locator('button, .ant-btn').all();
      console.log(`找到 ${buttons.length} 个按钮`);
      
      // 输出按钮文本
      const buttonTexts = [];
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.trim()) {
          buttonTexts.push(text.trim());
        }
      }
      console.log('按钮文本:', buttonTexts);
      
      console.log('==== 表单字段分析完成 ====\n');
    } catch (error: any) {
      console.log(`分析表单字段失败: ${error.message}`);
    }
  }
  
  /**
   * 填写日志表单
   * @param projectName 项目名称
   * @param date 日期字符串，格式：YYYY-MM-DD
   * @param workContent 工作内容
   * @param screenshotsDir 截图目录
   */
  async fillLogForm(projectName: string, date: string, workContent: string, screenshotsDir: string): Promise<boolean> {
    console.log('\n开始填写日志表单...');
    
    try {
      // 等待表单加载
      await this.page.waitForTimeout(5000);
      
      // 保存表单初始状态截图
      await this.page.screenshot({ path: path.join(screenshotsDir, 'form-initial.png') });
      
      console.log('开始填写表单...');
      
      // 1. 选择下拉框
      try {
        const combobox = await this.frame.getByRole('combobox').nth(2);
        await combobox.waitFor({ state: 'visible', timeout: 30000 });
        await combobox.click();
        console.log('已点击下拉框');
        
        // 选择选项
        const targetOption = await this.frame.getByRole('option', { name: projectName }).locator('div');
        await targetOption.click();
        console.log('已选择项目');
      } catch (error: any) {
        console.log(`选择项目失败: ${error.message}`);
        return false;
      }
      
      // 2. 选择日期
      try {
        const datePickerInput = await this.frame.locator('#dx_11181_riqi').getByRole('textbox');
        await datePickerInput.click();
        
        // 等待日期选择面板出现
        const datePanel = await this.frame.locator('.ant-calendar-input-wrap');
        await datePanel.waitFor({ state: 'visible', timeout: 30000 });
        
        // 在日期面板中找到输入框并输入日期
        const calendarInput = await datePanel.locator('input');
        await calendarInput.fill(date);
        await calendarInput.press('Enter');
        console.log('日期已选择');
      } catch (error: any) {
        console.log(`选择日期失败: ${error.message}`);
        return false;
      }
      
      // 3. 填写工作内容
      try {
        const workContentInput = await this.frame
          .locator('textarea')
          .first();
        await workContentInput.waitFor({ state: 'visible', timeout: 30000 });
        await workContentInput.click();
        await workContentInput.fill(workContent);
        console.log('工作内容已填写');
      } catch (error: any) {
        console.log(`填写工作内容失败: ${error.message}`);
        return false;
      }
      
      // 保存表单填写完成后的截图
      await this.page.screenshot({ path: path.join(screenshotsDir, 'form-filled.png') });
      
      console.log('日志表单填写成功');
      return true;
    } catch (error: any) {
      console.log(`填写日志表单失败: ${error.message}`);
      await this.page.screenshot({ path: path.join(screenshotsDir, 'form-error.png') });
      return false;
    }
  }
  
  /**
   * 提交表单
   */
  async submitForm(): Promise<boolean> {
    console.log('尝试提交表单...');
    
    try {
      const submitButton = await this.getSubmitButton();
      await submitButton.waitFor({ state: 'visible', timeout: 10000 });
      await submitButton.click();
      
      console.log('表单已提交');
      return true;
    } catch (error: any) {
      console.log(`提交表单失败: ${error.message}`);
      return false;
    }
  }
} 