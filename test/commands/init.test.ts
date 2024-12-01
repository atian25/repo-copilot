import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm, readFile } from 'fs/promises';
import { parse } from 'yaml';
import { initCommand } from '../../src/commands/init.js';
import { Config } from '../../src/config/index.js';
import { exists } from '../../src/utils/index.js';

// Mock console
const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('init command', () => {
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
  });

  afterEach(async () => {
    // Clean up
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
    delete process.env.REPO_COPILOT_CONFIG_DIR;
  });

  it('should initialize configuration successfully', async () => {
    const options = {
      baseDir: join(tempDir, 'workspace'),
      username: 'test-user',
      email: 'test@example.com',
    };

    await initCommand.run([], options);

    // Verify output
    expect(mockConsole.error).not.toBeCalled();
    expect(mockExit).not.toBeCalled();
    expect(mockConsole.log).toBeCalled();

    // Verify config files
    const configFile = join(configDir, 'config.yaml');
    const repoFile = join(configDir, 'repositories.yaml');

    expect(await exists(configFile)).toBe(true);
    expect(await exists(repoFile)).toBe(true);

    // Verify config content
    const content = parse(await readFile(configFile, 'utf-8'));
    expect(content).toMatchObject({
      baseDir: options.baseDir,
      username: options.username,
      email: options.email,
    });

    // Verify repositories content
    const repoContent = parse(await readFile(repoFile, 'utf-8'));
    expect(repoContent).toMatchObject({
      repositories: [],
    });
  });

  it('should fail if config exists without force option', async () => {
    // Create initial config
    const config = new Config();
    await config.save();

    await initCommand.run([]);

    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Configuration already exists'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should overwrite existing config with force option', async () => {
    // Create initial config
    const config = new Config();
    await config.save();

    const options = {
      baseDir: join(tempDir, 'workspace'),
      username: 'test-user',
      email: 'test@example.com',
      force: true,
    };

    await initCommand.run([], options);

    expect(mockConsole.error).not.toBeCalled();
    expect(mockExit).not.toBeCalled();

    // Verify config content
    const content = parse(await readFile(join(configDir, 'config.yaml'), 'utf-8'));
    expect(content).toMatchObject({
      baseDir: options.baseDir,
      username: options.username,
      email: options.email,
    });
  });
});
