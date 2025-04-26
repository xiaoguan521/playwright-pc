# 贝贝管理应用测试框架安装指南

本文档提供了安装和配置贝贝管理应用测试框架的详细步骤。

## 系统要求

- Node.js 14+
- npm 6+
- Windows 10+ 或 macOS 10.15+

## 安装步骤

### 1. 安装Node.js和npm

如果您尚未安装Node.js，请访问[Node.js官网](https://nodejs.org/)下载并安装最新的LTS版本。

### 2. 克隆测试项目

```bash
# 克隆到本地
git clone <项目仓库URL> beibei-playwright-tests
cd beibei-playwright-tests
```

### 3. 安装依赖

```bash
# 安装项目依赖
npm install

# 安装Playwright浏览器
npx playwright install
```

### 4. 配置环境

根据您的测试需求配置环境变量文件：

1. 检查`src/environments`目录下的`.env.production`和`.env.test`文件
2. 更新其中的`BASEURL`和`ELECTRON_APP_PATH`变量，指向您的测试目标

例如：

```
# .env.production
BASEURL=http://localhost:3000
ELECTRON_APP_PATH=D:/Program Files (x86)/贝贝管理/贝贝管理.exe
```

## 验证安装

运行示例测试以验证框架安装是否成功：

```bash
# 运行Todo示例测试
npm test -- -g "Todo应用测试示例"
```

如果测试成功运行并通过，表示框架已正确安装。

## 常见问题

### Q: 测试运行很慢，怎么办？
A: 可以使用`--project=chromium`选项只在一个浏览器中运行测试，或使用`--grep`选项只运行特定测试。

### Q: Electron应用测试失败
A: 确保`ELECTRON_APP_PATH`指向正确的可执行文件路径，并且应用路径中不包含特殊字符。

### Q: 页面选择器无法找到元素
A: 使用Playwright Inspector检查元素：
```
npx playwright test --debug
```

## 其他资源

- [Playwright官方文档](https://playwright.dev/docs/intro)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [Page Object Model设计模式](https://playwright.dev/docs/test-pom) 