import { access } from 'node:fs/promises';

/**
 * 异步检查文件是否存在
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
