import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * 专门针对Electron测试的配置文件
 * 禁用所有浏览器，只使用Electron
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
  retries: 0,
  // 使用单个worker以避免多个Electron实例
  workers: 1,
  // 测试报告相关
  reporter: [
    ['html', { open: 'never' }]
  ],
  
  use: {
    // 不设置browserName，完全由Electron测试自行管理
    // 追踪和截图设置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  
  // 指定默认项目，避免使用浏览器
  projects: [
    {
      name: 'default',
      use: {}
    }
  ],
  
  // 禁用自动下载浏览器
  webServer: {
    command: "echo No web server needed for Electron tests",
    port: 0,
  }
}); 