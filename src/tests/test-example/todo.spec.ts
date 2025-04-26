import { test, expect } from '../../fixtures/fixtures';

/**
 * 这是一个示例测试，使用Playwright官方的Todo示例应用
 * 主要用于验证测试框架的基本功能是否正常
 */
test.describe('Todo应用测试示例', () => {
  // 每个测试之前的设置
  test.beforeEach(async ({ page }) => {
    // 导航到Todo示例应用
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  // 测试添加新的Todo项
  test('应该能够添加新的Todo项', async ({ page }) => {
    // 添加一个新的待办事项
    await page.locator('.new-todo').fill('学习Playwright测试');
    await page.locator('.new-todo').press('Enter');

    // 验证待办事项已经添加
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    await expect(page.locator('.todo-list li')).toHaveText('学习Playwright测试');
  });

  // 测试完成Todo项
  test('应该能够将Todo项标记为已完成', async ({ page }) => {
    // 添加一个待办事项
    await page.locator('.new-todo').fill('要完成的任务');
    await page.locator('.new-todo').press('Enter');

    // 标记为已完成
    await page.locator('.todo-list li .toggle').click();

    // 验证项目被标记为已完成
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
  });

  // 测试删除Todo项
  test('应该能够删除Todo项', async ({ page }) => {
    // 添加一个待办事项
    await page.locator('.new-todo').fill('要删除的任务');
    await page.locator('.new-todo').press('Enter');

    // 鼠标悬停在项目上显示删除按钮
    await page.locator('.todo-list li').hover();
    
    // 点击删除按钮
    await page.locator('.todo-list li .destroy').click();
    
    // 验证项目已被删除
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });

  // 测试筛选Todo项
  test('应该能够筛选Todo项', async ({ page }) => {
    // 添加几个待办事项
    const todos = ['任务1', '任务2', '任务3'];
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }

    // 确认有3个项目
    await expect(page.locator('.todo-list li')).toHaveCount(3);

    // 完成第二个任务
    await page.locator('.todo-list li').nth(1).locator('.toggle').click();

    // 点击"已完成"筛选器
    await page.locator('text=Completed').click();
    
    // 验证只显示1个已完成的项目
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    await expect(page.locator('.todo-list li')).toHaveText('任务2');

    // 点击"活动"筛选器
    await page.locator('text=Active').click();
    
    // 验证显示2个活动项目
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    
    // 点击"全部"筛选器
    await page.locator('text=All').click();
    
    // 验证显示所有3个项目
    await expect(page.locator('.todo-list li')).toHaveCount(3);
  });
}); 