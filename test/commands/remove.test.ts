import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { remove } from '../../src/commands/remove.js';
import { Config } from '../../src/config/index.js';
import { exists } from '../../src/utils/index.js';
import { execSync } from 'child_process';

describe('remove command', () => {
  let tempDir: string;
  let configDir: string;
  let repoDir: string;

  beforeEach(async () => {
    // Create temp directories
    tempDir = join(tmpdir(), 'repo-copilot-test-' + Math.random().toString(36).slice(2));
    configDir = join(tempDir, '.repo-copilot');
    repoDir = join(tempDir, 'repos/github.com/test/test-repo');

    // Set config path for tests
    process.env.REPO_COPILOT_CONFIG_DIR = configDir;

    // Create test repository directory and initialize git
    await mkdir(repoDir, { recursive: true });
    await writeFile(join(repoDir, 'test.txt'), 'test content');
    execSync('git init', { cwd: repoDir });
    execSync('git add .', { cwd: repoDir });
    execSync('git config user.name "test"', { cwd: repoDir });
    execSync('git config user.email "test@example.com"', { cwd: repoDir });
    execSync('git commit -m "init"', { cwd: repoDir });

    // Create test config
    await mkdir(configDir, { recursive: true });
    const config = new Config({
      baseDir: join(tempDir, 'repos'),
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

  it('should throw error if repository path is not under base directory', async () => {
    const config = await Config.load();
    config.repositories[0].path = '/some/other/path';
    await config.save();

    await expect(remove('test-repo', { force: true }))
      .rejects.toThrow('Repository path /some/other/path is not under base directory');
  });

  it('should throw error if repository has uncommitted changes', async () => {
    // Create uncommitted changes
    await writeFile(join(repoDir, 'test.txt'), 'modified content');

    await expect(remove('test-repo', { force: true }))
      .rejects.toThrow('Repository has uncommitted changes');
    
    // Should work with --yes option
    await remove('test-repo', { force: true, yes: true });
    expect(await exists(repoDir)).toBe(false);
  });
});
