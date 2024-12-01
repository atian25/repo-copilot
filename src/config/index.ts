import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { debuglog } from 'node:util';
import { parse, stringify } from 'yaml';
import { exists } from '../utils/index.js';

const log = debuglog('repo:config');

// 获取配置文件路径
function getConfigPaths() {
  const configDir = process.env.REPO_COPILOT_CONFIG_DIR || join(homedir(), '.repo-copilot');
  return {
    configDir,
    configFile: join(configDir, 'config.yaml'),
    repositoriesFile: join(configDir, 'repositories.yaml'),
  };
}

// 配置文件结构
export interface HostConfig {
  token?: string;
  username?: string;
  email?: string;
}

export interface Repository {
  name: string;
  owner: string;
  url: string;
  path: string;
  host: string;
  created_at?: string;
}

export class Config {
  baseDir: string;
  format: string;
  username: string;
  email: string;
  hosts: Record<string, HostConfig>;
  repositories: Repository[] = [];
  configDir: string;

  constructor(data: Partial<Config> = {}) {
    const { configDir } = getConfigPaths();
    this.configDir = configDir;
    this.baseDir = data.baseDir || join(homedir(), 'workspace');
    this.format = data.format || 'table';
    this.username = data.username || '';
    this.email = data.email || '';
    this.hosts = data.hosts || {};
    if (data.repositories) {
      this.repositories = data.repositories;
    }
  }

  static async exists(): Promise<boolean> {
    const { configFile } = getConfigPaths();
    return await exists(configFile);
  }

  static async load(): Promise<Config> {
    const config = new Config();
    const { configFile, repositoriesFile } = getConfigPaths();

    // Load main config
    if (await exists(configFile)) {
      const content = await readFile(configFile, 'utf-8');
      const data = parse(content);
      if (data) {
        config.baseDir = data.baseDir || config.baseDir;
        config.format = data.format || config.format;
        config.username = data.username || config.username;
        config.email = data.email || config.email;
        config.hosts = data.hosts || config.hosts;
      }
    }

    // Load repositories
    if (await exists(repositoriesFile)) {
      const content = await readFile(repositoriesFile, 'utf-8');
      const data = parse(content);
      if (data && data.repositories) {
        config.repositories = data.repositories;
      }
    } else {
      await writeFile(repositoriesFile, stringify({ repositories: [] }, { indent: 2 }));
    }

    return config;
  }

  async save(): Promise<void> {
    const { configDir, configFile, repositoriesFile } = getConfigPaths();

    // Ensure config directory exists
    await mkdir(configDir, { recursive: true });

    // Save main config
    const configData = {
      baseDir: this.baseDir,
      format: this.format,
      username: this.username,
      email: this.email,
      hosts: this.hosts,
    };
    await writeFile(configFile, stringify(configData, { indent: 2 }));

    // Save repositories
    const repoData = {
      repositories: this.repositories || [],
    };
    await writeFile(repositoriesFile, stringify(repoData, { indent: 2 }));
  }
}
