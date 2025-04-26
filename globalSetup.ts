import { FullConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

/**
 * 在测试执行前的全局设置
 * 主要用于加载环境变量
 */
async function globalSetup(config: FullConfig) {
  // 如果未指定测试环境，默认使用production环境
  if(process.env.test_env === undefined) {
    process.env.test_env = 'production';
  }
  
  // 加载对应环境的.env文件
  dotenv.config({
    path: path.join(__dirname, `./src/environments/.env.${process.env.test_env}`),
    override: true,
  });
  
  console.log(`已加载环境变量: ${process.env.test_env}`);
}

export default globalSetup; 