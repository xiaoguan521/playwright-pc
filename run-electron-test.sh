#!/bin/bash
echo "正在运行Electron测试..."

# 设置环境变量禁用Playwright浏览器下载与检查
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_SKIP_VALIDATION=1
export PWTEST_SKIP_TEST_OUTPUT=1
export PLAYWRIGHT_BROWSERS_PATH=0
export PLAYWRIGHT_BROWSER_NAME=

# 显示环境变量
echo "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=$PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD"
echo "PLAYWRIGHT_SKIP_VALIDATION=$PLAYWRIGHT_SKIP_VALIDATION"
echo "PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH"

# 检查是否需要保持应用运行
if [ "$2" = "--keep-running" ]; then
  echo "应用将在测试后保持运行，需要手动关闭（按Ctrl+C）"
  export KEEP_APP_RUNNING=true
else
  echo "应用将在测试后自动关闭"
  export KEEP_APP_RUNNING=false
fi

# 运行指定测试或所有测试
if [ -z "$1" ]; then
  echo "运行所有测试..."
  npx playwright test --project=electron
else
  echo "运行指定测试: $1"
  npx playwright test "$1" --project=electron
fi

echo ""
echo "测试运行完成，查看测试报告请运行:"
echo "npx playwright show-report" 