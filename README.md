# 贝贝管理应用自动化测试项目

本项目是使用Playwright框架对贝贝管理应用进行自动化测试的框架，采用Page Object Model (POM)设计模式。

## 目录结构

```
playwright-tests/
├── src/                           # 源代码目录
│   ├── environments/              # 环境配置文件
│   ├── fixtures/                  # 测试fixture
│   ├── helpers/                   # 辅助工具函数
│   ├── pages/                     # 页面对象模型
│   ├── test-data/                 # 测试数据
│   └── tests/                     # 测试文件
├── playwright.config.ts           # Playwright配置
├── globalSetup.ts                 # 全局设置
└── package.json                   # 项目依赖
```

## 安装依赖

```bash
cd playwright-tests
npm install
npx playwright install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 使用Chrome运行测试
npm run test:chrome

# 使用Electron运行测试
npm run test:electron

# 以有头模式运行测试(显示浏览器界面)
npm run test:headed

# 查看测试报告
npm run report
```

## 环境变量

可以通过设置环境变量来配置测试行为:

```bash
# 使用测试环境配置运行
test_env=test npm test

# 使用生产环境配置运行
test_env=production npm test
```

## 编写测试

所有测试都使用Page Object Model模式编写，具体示例可参考`src/tests`目录下的测试文件。

### 基本测试结构

```typescript
import { test, expect } from '@fixtures/fixtures';

test.describe('功能测试组', () => {
  test('测试用例1', async ({ page, loginPage }) => {
    // 测试代码
  });

  test('测试用例2', async ({ page, qrCodeLoginPage }) => {
    // 测试代码
  });
});
```

### 添加新页面对象

1. 在`src/pages`目录下创建新的页面类文件
2. 在`src/fixtures/pages.ts`中注册页面对象
3. 在测试中使用新页面对象

## 贡献指南

1. 遵循TypeScript和Playwright最佳实践
2. 保持代码简洁清晰
3. 新功能添加测试用例
4. 提交前运行所有测试确保通过 