import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { parse } from 'yaml';
import { addCommand } from '../../src/commands/add.js';
import { Config } from '../../src/config/index.js';

// Mock console
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};
console.log = mockConsole.log;
console.error = mockConsole.error;

// Mock process.exit
const mockExit = vi.fn();
process.exit = mockExit;

describe('add command', () => {
  let tempDir: string;
  let configDir: string;

  beforeEach(async () => {
    // Reset mocks
    mockConsole.log.mockReset();
    mockConsole.error.mockReset();
    mockExit.mockReset();

    // Create temp directories
    tempDir = join(tmpdir(), 'repo-copilot-test-' + Math.random().toString(36).slice(2));
    configDir = join(tempDir, '.repo-copilot');

    // Set config path for tests
    process.env.REPO_COPILOT_CONFIG_DIR = configDir;

    // Create test config
    await mkdir(configDir, { recursive: true });
    const config = new Config({
      baseDir: tempDir,
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

  it('should add repository successfully', async () => {
    const url = 'github.com/atian25/repo-copilot';
    await addCommand.run([url]);

    // 验证输出
    expect(mockConsole.error).not.toBeCalled();
    expect(mockConsole.log).toBeCalled();
    expect(mockExit).not.toBeCalled();

    // Wait for file to be written
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证仓库信息
    const content = parse(await readFile(join(configDir, 'repositories.yaml'), 'utf-8'));
    expect(content.repositories).toHaveLength(1);
    const repo = content.repositories[0];
    expect(repo.name).toBe('repo-copilot');
    expect(repo.owner).toBe('atian25');
    expect(repo.url).toBe('github.com/atian25/repo-copilot');
    expect(repo.host).toBe('github.com');
    expect(repo.path).toBe(join(tempDir, 'github.com/atian25/repo-copilot'));
  });

  it('should fail with invalid url', async () => {
    const url = 'invalid-url';
    await addCommand.run([url]);

    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Invalid repository URL'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should fail with duplicate repository', async () => {
    const url = 'github.com/atian25/repo-copilot';
    await addCommand.run([url]);
    await addCommand.run([url]);

    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Repository already exists'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should fail without url', async () => {
    await addCommand.run([]);
    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Usage: repo add <repository_url>'));
    expect(mockExit).toBeCalledWith(1);
  });
});
