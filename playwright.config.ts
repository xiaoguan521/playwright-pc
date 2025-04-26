import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * 自定义配置: https://playwright.dev/docs/test-configuration
 * 专门针对Electron应用测试的配置
 */
export default defineConfig({
  testDir: './src/tests',
  // 测试超时时间
  timeout: 60000,
  // 每个测试的期望超时时间
  expect: {
    timeout: 10000
  },
  // 测试失败时的重试次数
  retries: process.env.CI ? 2 : 0,
  // 使用单个worker以避免多个Electron实例
  workers: 1,
  // 测试报告相关
  reporter: [
    ['html', { open: 'never' }]
  ],
  
  // 禁用浏览器
  // 此设置非常重要：确保不会下载任何浏览器
  forbidOnly: !!process.env.CI,
  
  // 设置基本配置
  use: {
    // 关键：不指定browserName，这样可以避免启动任何浏览器
    // browserName: undefined,
    // 追踪和截图设置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    launchOptions: {
      headless: false, // 这只是有头模式，不会自动弹出 Inspector
    },
  },
  
  // 仅保留Electron项目配置
  projects: [
    {
      name: 'electron',
      use: { 
        // 正确的Electron应用测试配置
        isMobile: false,
        // 不要使用browserName属性
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          headless: false
        }
      },
    }
  ],
  
  // 全局设置
  globalSetup: require.resolve('./globalSetup'),
  
  // 禁用自动下载浏览器
  webServer: {
    command: "echo No web server needed for Electron tests",
    port: 0,
    reuseExistingServer: true
  }
}); 