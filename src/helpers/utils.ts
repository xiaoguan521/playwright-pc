import fs from 'fs';
import path from 'path';

/**
 * 通用工具函数
 */
export class Utils {
  /**
   * 确保目录存在，如果不存在则创建
   * @param dir 目录路径
   */
  static ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 保存页面内容到文件
   * @param html HTML内容
   * @param filePath 文件路径
   */
  static saveHtmlToFile(html: string, filePath: string): void {
    const dir = path.dirname(filePath);
    this.ensureDirectoryExists(dir);
    fs.writeFileSync(filePath, html);
  }

  /**
   * 生成唯一文件名
   * @param prefix 文件名前缀
   * @param extension 文件扩展名
   */
  static generateUniqueFileName(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.${extension}`;
  }

  /**
   * 格式化日期时间
   * @param date 日期对象
   */
  static formatDateTime(date: Date): string {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
} 