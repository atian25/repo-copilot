import { describe, it, expect, beforeEach, vi } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
import { addCommand } from '../../src/commands/add.js';

// Mock 配置文件
const CONFIG_DIR = join(homedir(), '.repo-copilot');
const CONFIG_FILE = join(CONFIG_DIR, 'config.yaml');
const REPOSITORIES_FILE = join(CONFIG_DIR, 'repositories.yaml');

// Mock console
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};
console.log = mockConsole.log;
console.error = mockConsole.error;

// Mock process.exit
const mockExit = vi.fn();
vi.spyOn(process, 'exit').mockImplementation(mockExit as any);

describe('add command', () => {
  beforeEach(async () => {
    // 清理 mock
    vi.clearAllMocks();
    
    // 准备配置目录
    await mkdir(CONFIG_DIR, { recursive: true });

    // 准备配置文件
    const config = {
      baseDir: join(homedir(), 'workspace'),
      format: 'table',
      username: 'test',
      email: 'test@example.com',
      hosts: {},
    };
    await writeFile(CONFIG_FILE, stringify(config));

    // 准备空的仓库列表
    await writeFile(REPOSITORIES_FILE, stringify({ repositories: [] }));
  });

  it('should add repository successfully', async () => {
    const url = 'github.com/atian25/repo-copilot';
    await addCommand.run([url]);

    // 验证输出
    expect(mockConsole.error).not.toBeCalled();
    expect(mockConsole.log).toBeCalled();
    expect(mockExit).not.toBeCalled();

    // 验证仓库信息
    const content = parse(await readFile(REPOSITORIES_FILE, 'utf-8')) as { repositories: any[] };
    expect(content.repositories).toHaveLength(1);
    expect(content.repositories[0]).toMatchObject({
      name: 'repo-copilot',
      owner: 'atian25',
      url: 'github.com/atian25/repo-copilot',
      host: 'github.com',
      path: join(homedir(), 'workspace/github.com/atian25/repo-copilot'),
    });
  });

  it('should fail with invalid url', async () => {
    const url = 'invalid-url';
    await addCommand.run([url]);

    expect(mockConsole.error).toBeCalledWith(expect.stringContaining('Invalid repository URL'));
    expect(mockExit).toBeCalledWith(1);
  });

  it('should fail with duplicate repository', async () => {
    const url = 'github.com/atian25/repo-copilot';
    
    // 先添加一次
    await addCommand.run([url]);
    vi.clearAllMocks();

    // 再添加一次，应该失败
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
