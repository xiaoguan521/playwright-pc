import { mergeTests, expect as playwrightExpect } from '@playwright/test';
import { test as pagesTest } from './pages';
import { test as variablesTest } from './variables';

/**
 * 合并所有fixtures测试
 * 这样我们可以在一个测试中使用所有fixture
 */
export const test = mergeTests(pagesTest, variablesTest);

// 导出expect
export const expect = playwrightExpect; 