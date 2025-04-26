# 贝贝管理应用测试编写指南

本文档提供了使用贝贝管理测试框架编写自动化测试的指南和最佳实践。

## 测试结构

测试应遵循以下结构:

1. 使用Page Object Model设计模式
2. 每个页面和组件对应一个页面对象类
3. 测试文件组织在功能模块目录下
4. 使用fixtures实现依赖注入

## 页面对象示例

### 1. 创建新页面对象

在`src/pages`目录下创建新的页面类文件:

```typescript
// src/pages/userProfilePage.ts
import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class UserProfilePage extends BasePage {
  // 页面元素定位器
  readonly profileName: Locator;
  readonly editButton: Locator;
  readonly saveButton: Locator;
  
  constructor(page: Page) {
    super(page);
    // 初始化定位器
    this.profileName = page.locator('.profile-name');
    this.editButton = page.locator('.edit-profile-btn');
    this.saveButton = page.locator('.save-profile-btn');
  }
  
  // 页面操作方法
  async editProfile(newName: string) {
    await this.editButton.click();
    await this.profileName.fill(newName);
    await this.saveButton.click();
    await this.waitForPageLoad();
  }
  
  // 页面验证方法
  async getProfileName() {
    return await this.profileName.textContent();
  }
}
```

### 2. 注册页面对象

在`src/fixtures/pages.ts`中注册新页面对象:

```typescript
// 添加导入
import { UserProfilePage } from '@pages/userProfilePage';

// 更新PagesFixtures类型
type PagesFixtures = {
  loginPage: LoginPage;
  qrCodeLoginPage: QrCodeLoginPage;
  businessPage: BusinessPage;
  userProfilePage: UserProfilePage; // 添加新页面
};

// 添加新的fixture
export const test = base.extend<PagesFixtures>({
  // 已有fixtures...
  
  // 用户资料页面
  userProfilePage: async ({ page }, use) => {
    await use(new UserProfilePage(page));
  },
});
```

## 编写测试

### 基本测试结构

```typescript
// src/tests/user/profile.spec.ts
import { test, expect } from '@fixtures/fixtures';
import { userData } from '@test-data/users.json';

test.describe('用户资料管理', () => {
  // 前置条件 - 登录
  test.beforeEach(async ({ page, loginPage, baseUrl }) => {
    await page.goto(baseUrl);
    await loginPage.login(userData.validUser.username, userData.validUser.password);
  });
  
  test('用户能够更新资料', async ({ page, userProfilePage }) => {
    // 执行操作 - 编辑资料
    const newName = `测试用户_${Date.now()}`;
    await userProfilePage.editProfile(newName);
    
    // 验证结果
    const profileName = await userProfilePage.getProfileName();
    expect(profileName).toBe(newName);
  });
});
```

## 处理异步操作

* 始终使用`async/await`处理异步操作
* 添加适当的等待:
  * 等待元素可见:`await expect(element).toBeVisible()`
  * 等待元素包含文本:`await expect(element).toContainText('预期文本')`
  * 等待网络请求完成:`await page.waitForLoadState('networkidle')`

## 测试数据管理

* 使用`src/test-data`目录存储测试数据
* 根据测试域拆分数据文件(用户、订单、产品等)
* 使用有意义的文件名和数据结构

## 调试技巧

### 使用Playwright Inspector

```bash
npx playwright test --debug
```

### 添加调试代码

```typescript
// 暂停测试执行
await page.pause();

// 截取屏幕截图
await page.screenshot({ path: 'debug-screenshot.png' });

// 输出页面HTML
console.log(await page.content());
```

## 最佳实践

1. **独立测试** - 每个测试应该独立运行，不依赖其他测试的结果
2. **描述性断言** - 使用具有描述性的断言消息
3. **避免硬编码** - 使用环境变量和配置文件
4. **清理资源** - 使用`afterEach`和`afterAll`钩子清理资源
5. **保持测试简洁** - 每个测试专注于一个特定功能点
6. **使用页面对象** - 不要在测试中直接使用选择器，使用页面对象封装