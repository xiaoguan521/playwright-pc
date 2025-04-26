# Electron应用测试指南

本文档提供了使用贝贝管理测试框架测试Electron应用的详细指南。

## 准备工作

### 1. 配置Electron应用路径

在环境配置文件中设置正确的Electron应用路径:

```
# src/environments/.env.production
ELECTRON_APP_PATH=D:/Program Files (x86)/贝贝管理/贝贝管理.exe
```

### 2. 确保路径正确

确保路径不包含未转义的特殊字符，并且指向正确的可执行文件。

## 测试Electron应用

### 基本启动测试

```typescript
import { test, expect } from '../../fixtures/fixtures';
import { ElectronApplication } from '@playwright/test';

test.describe('Electron应用测试', () => {
  let electronApp: ElectronApplication | undefined;
  
  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
      electronApp = undefined;
    }
  });
  
  test('应用能够成功启动', async ({ electronAppPath }) => {
    // 跳过测试如果未配置应用路径
    test.skip(!electronAppPath, '未指定Electron应用路径');
    
    // 使用require动态导入Electron模块
    const { _electron } = require('playwright');
    
    // 启动Electron应用
    electronApp = await _electron.launch({
      executablePath: electronAppPath
    });
    
    // 获取第一个窗口
    const window = await electronApp.firstWindow();
    
    // 验证窗口标题
    const title = await window.title();
    expect(title).toBeTruthy();
    console.log(`应用窗口标题: ${title}`);
  });
});
```

### 与Electron窗口交互

```typescript
test('登录Electron应用', async ({ electronAppPath }) => {
  // 导入Electron模块
  const { _electron } = require('playwright');
  
  // 启动应用
  electronApp = await _electron.launch({
    executablePath: electronAppPath
  });
  
  // 获取窗口
  const window = await electronApp.firstWindow();
  
  // 等待界面加载
  await window.waitForLoadState('domcontentloaded');
  
  // 登录
  await window.fill('#username', 'admin');
  await window.fill('#password', 'password123');
  await window.click('#login-button');
  
  // 验证登录成功
  await expect(window.locator('.dashboard')).toBeVisible({ timeout: 10000 });
});
```

## 高级Electron测试

### 截图与调试

```typescript
// 截图
await window.screenshot({ path: './screenshots/electron-login.png' });

// 获取页面HTML
const html = await window.content();
console.log(html);

// 暂停测试执行
await window.pause();
```

### 与主进程通信

```typescript
// 调用主进程方法
const result = await electronApp.evaluate(async ({ app }) => {
  // 这在Electron主进程中执行
  return {
    appName: app.getName(),
    appVersion: app.getVersion(),
    osDetails: {
      platform: process.platform,
      arch: process.arch
    }
  };
});
console.log('应用信息:', result);
```

### 测试渲染进程

```typescript
// 在渲染进程中执行代码
const pageTitle = await window.evaluate(() => {
  // 这在Electron渲染进程中执行
  return document.title;
});
console.log('页面标题:', pageTitle);
```

### 模拟系统对话框

```typescript
// 监听对话框
window.on('dialog', dialog => {
  console.log(`对话框: ${dialog.type}, 消息: ${dialog.message}`);
  // 自动接受/拒绝对话框
  dialog.accept();
});

// 点击触发文件选择
await window.click('#upload-button');
```

## 常见问题解决

### 应用启动失败

如果应用启动失败，检查:

1. 应用路径是否正确
2. 确保路径中的空格已正确转义
3. 确保具有足够的权限运行应用

### 无法连接到窗口

如果无法连接到窗口:

1. 增加等待时间: `await electronApp.firstWindow({ timeout: 30000 })`
2. 确保应用正常启动，没有崩溃或错误对话框

### 调试Electron测试

使用以下命令运行带调试的测试:

```bash
npx playwright test --project=electron --debug
```

## 最佳实践

1. 始终在`afterEach`或`afterAll`中关闭Electron应用
2. 使用独立的测试文件专门测试Electron应用
3. 捕获并记录主进程日志以便于调试
4. 为每个测试创建独立的Electron实例，避免状态共享 