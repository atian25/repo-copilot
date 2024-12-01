import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { parse } from 'yaml';
import { addCommand } from '../../src/commands/add.js';
import { Config } from '../../src/config/index.js';
import { exists } from '../../src/utils/index.js';

// Mock console
const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Mock execSync
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('add command', () => {
  let configDir: string;
  let configFile: string;
  let repoFile: string;

  beforeEach(async () => {
    // Reset mocks
    mockConsole.log.mockReset();
    mockConsole.error.mockReset();
    mockExit.mockReset();

    // Create temp directory for testing
    configDir = await mkdtemp(join(tmpdir(), 'repo-copilot-test-'));
    configFile = join(configDir, 'config.yaml');
    repoFile = join(configDir, 'repositories.yaml');
    process.env.REPO_COPILOT_CONFIG_DIR = configDir;

    // Initialize config
    const config = new Config({
      baseDir: join(configDir, 'repos'),
      username: 'test-user',
      email: 'test@example.com',
    });
    await config.save();
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(configDir, { recursive: true, force: true });
    delete process.env.REPO_COPILOT_CONFIG_DIR;
  });

  it('should add repository successfully', async () => {
    const url = 'github.com/atian25/repo-copilot';
    await addCommand.run([url]);

    // Verify repositories file
    expect(await exists(repoFile)).toBe(true);
    const content = parse(await readFile(repoFile, 'utf-8'));
    expect(content.repositories).toHaveLength(1);
    expect(content.repositories[0]).toMatchObject({
      name: 'repo-copilot',
      owner: 'atian25',
      url,
      path: join(configDir, 'repos/github.com/atian25/repo-copilot'),
      host: 'github.com',
    });
  });

  it('should fail without repository url', async () => {
    await addCommand.run([]);
    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Usage'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should fail with invalid repository url', async () => {
    await addCommand.run(['invalid-url']);
    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Invalid'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should fail with duplicate repository', async () => {
    const url = 'github.com/atian25/repo-copilot';
    await addCommand.run([url]);
    await addCommand.run([url]);
    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('already exists'));
    expect(mockExit).toBeCalledWith(1);
  });
});
