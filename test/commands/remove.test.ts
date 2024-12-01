import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { remove } from '../../src/commands/remove.js';
import { Config } from '../../src/config/index.js';
import { exists } from '../../src/utils/index.js';

describe('remove command', () => {
  let tempDir: string;
  let configDir: string;
  let repoDir: string;

  beforeEach(async () => {
    // Create temp directories
    tempDir = join(tmpdir(), 'repo-copilot-test-' + Math.random().toString(36).slice(2));
    configDir = join(tempDir, '.repo-copilot');
    repoDir = join(tempDir, 'github.com/test/test-repo');

    // Set config path for tests
    process.env.REPO_COPILOT_CONFIG_DIR = configDir;

    // Create test repository directory
    await mkdir(repoDir, { recursive: true });
    await writeFile(join(repoDir, 'test.txt'), 'test content');

    // Create test config
    await mkdir(configDir, { recursive: true });
    const config = new Config({
      baseDir: tempDir,
      repositories: [
        {
          name: 'test-repo',
          owner: 'test',
          url: 'github.com/test/test-repo',
          path: repoDir,
          host: 'github.com',
          created_at: new Date().toISOString(),
        },
      ],
    });
    await config.save();

    // Wait for file to be written
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Clean up
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
    delete process.env.REPO_COPILOT_CONFIG_DIR;
  });

  it('should remove repository from config', async () => {
    await remove('test-repo');
    
    const config = await Config.load();
    expect(config.repositories).toHaveLength(0);
    
    // Local files should still exist
    expect(await exists(repoDir)).toBe(true);
  });

  it('should remove repository and local files with force option', async () => {
    await remove('test-repo', { force: true });
    
    const config = await Config.load();
    expect(config.repositories).toHaveLength(0);
    
    // Local files should be deleted
    expect(await exists(repoDir)).toBe(false);
  });

  it('should throw error if repository not found', async () => {
    await expect(remove('non-existent-repo')).rejects.toThrow('Repository "non-existent-repo" not found');
  });
});
