import { test as base } from '@playwright/test';

/**
 * 变量fixtures类型定义
 */
type VariablesFixtures = {
  isProduction: boolean;
  baseUrl: string;
  electronAppPath: string;
};

/**
 * 扩展测试以包含环境变量
 */
export const test = base.extend<VariablesFixtures>({
  // 判断是否生产环境
  isProduction: async ({}, use) => {
    await use(process.env.test_env === 'production');
  },
  
  // 基础URL
  baseUrl: async ({}, use) => {
    await use(process.env.BASEURL || 'http://localhost:3000');
  },
  
  // Electron应用路径
  electronAppPath: async ({}, use) => {
    await use(process.env.ELECTRON_APP_PATH || '');
  },
}); 