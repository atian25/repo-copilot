import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { parse } from 'yaml';
import { initCommand } from '../../src/commands/init.js';
import { exists } from '../../src/utils/index.js';

// Mock console
const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('init command', () => {
  let configDir: string;
  let configFile: string;

  beforeEach(async () => {
    // Reset mocks
    mockConsole.log.mockReset();
    mockConsole.error.mockReset();
    mockExit.mockReset();

    // Create temp directory for testing
    configDir = await mkdtemp(join(tmpdir(), 'repo-copilot-test-'));
    configFile = join(configDir, 'config.yaml');
    process.env.REPO_COPILOT_CONFIG_DIR = configDir;
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(configDir, { recursive: true, force: true });
    delete process.env.REPO_COPILOT_CONFIG_DIR;
  });

  it('should initialize configuration successfully', async () => {
    const options = {
      username: 'test-user',
      email: 'test@example.com',
    };

    // Run init command
    await initCommand.run([], options);

    // Check if config file exists
    expect(await exists(configFile)).toBe(true);

    // Verify config content
    const content = parse(await readFile(configFile, 'utf-8'));
    expect(content).toMatchObject({
      baseDir: join(configDir, 'repos'),
      username: options.username,
      email: options.email,
    });
  });

  it('should fail if configuration exists', async () => {
    const options = {
      username: 'test-user',
      email: 'test@example.com',
    };

    // Create initial config
    await initCommand.run([], options);

    // Try to init again
    await expect(initCommand.run([], options)).rejects.toThrow();
  });

  it('should overwrite existing config with force option', async () => {
    // Create initial config
    await initCommand.run([], {
      username: 'old-user',
      email: 'old@example.com',
    });

    // Run init command with force option
    const options = {
      username: 'test-user',
      email: 'test@example.com',
      force: true,
    };
    await initCommand.run([], options);

    // Verify config content
    const content = parse(await readFile(configFile, 'utf-8'));
    expect(content).toMatchObject({
      baseDir: join(configDir, 'repos'),
      username: options.username,
      email: options.email,
    });
  });
});
