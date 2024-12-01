import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { exists } from '../../src/utils/index.js';

describe('utils', () => {
  const TEST_DIR = join(tmpdir(), 'repo-copilot-test');
  const TEST_FILE = join(TEST_DIR, 'test.txt');

  beforeEach(async () => {
    // 准备测试目录
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // 清理测试目录
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('exists()', () => {
    it('should return true when file exists', async () => {
      // 创建测试文件
      await writeFile(TEST_FILE, 'test');
      expect(await exists(TEST_FILE)).toBe(true);
    });

    it('should return true when directory exists', async () => {
      expect(await exists(TEST_DIR)).toBe(true);
    });

    it('should return false when path does not exist', async () => {
      expect(await exists(join(TEST_DIR, 'not-exist'))).toBe(false);
    });

    it('should return false when parent directory does not exist', async () => {
      expect(await exists(join(TEST_DIR, 'not-exist', 'file.txt'))).toBe(false);
    });
  });
});
