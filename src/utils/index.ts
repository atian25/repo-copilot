import { access } from 'node:fs/promises';
import * as path from 'node:path';

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

export function isSubDirectory(parent: string, dir: string): boolean {
  const relative = path.relative(parent, dir);
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}
