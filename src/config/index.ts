import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { debuglog } from 'node:util';
import { parse, stringify } from 'yaml';
import { exists } from '../utils/index.js';

const log = debuglog('repo:config');

// 配置文件路径
const CONFIG_DIR = join(homedir(), '.repo-copilot');
const CONFIG_FILE = join(CONFIG_DIR, 'config.yaml');
const REPOSITORIES_FILE = join(CONFIG_DIR, 'repositories.yaml');

// 配置文件结构
export interface Config {
  baseDir: string;
  format: string;
  username: string;
  email: string;
  hosts: Record<string, HostConfig>;
}

export interface HostConfig {
  username?: string;
  email?: string;
}

export interface Repository {
  name: string;
  owner: string;
  url: string;
  path: string;
  host: string;
  created_at: string;
}

// 默认配置
const DEFAULT_CONFIG: Config = {
  baseDir: join(homedir(), 'workspace'),
  format: 'table',
  username: '',
  email: '',
  hosts: {},
};

// 加载配置
export async function loadConfig(): Promise<Config> {
  if (!await exists(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }

  const content = await readFile(CONFIG_FILE, 'utf-8');
  const config = parse(content) as Config;
  log('load config: %O', config);
  return config;
}

// 保存配置
export async function saveConfig(config: Config) {
  if (!await exists(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  await writeFile(CONFIG_FILE, stringify(config));
  log('save config: %O', config);
}

// 加载仓库列表
export async function loadRepositories(): Promise<Repository[]> {
  if (!await exists(REPOSITORIES_FILE)) {
    return [];
  }

  const content = await readFile(REPOSITORIES_FILE, 'utf-8');
  const repositories = parse(content) as { repositories: Repository[] };
  log('load repositories: %O', repositories);
  return repositories.repositories || [];
}

// 保存仓库列表
export async function saveRepositories(repositories: Repository[]) {
  if (!await exists(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  await writeFile(REPOSITORIES_FILE, stringify({ repositories }));
  log('save repositories: %O', repositories);
}
