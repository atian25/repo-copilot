import { join } from 'node:path';
import { debuglog } from 'node:util';
import chalk from 'chalk';
import { Config, type Repository } from '../config/index.js';
import { mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const debug = debuglog('repo:add');

export const addCommand = {
  name: 'add',
  description: 'Add a repository',
  usage: 'repo add <repository> [options]',
  options: [
    {
      name: 'name',
      short: 'n',
      description: 'Custom name for the repository',
      type: 'string',
    },
    {
      name: 'baseDir',
      short: 'b',
      description: 'Base directory for this repository',
      type: 'string',
    },
    {
      name: 'force',
      short: 'f',
      description: 'Force add even if repository exists',
      type: 'boolean',
    },
  ],
  examples: [
    'repo add github.com/owner/repo',
    'repo add github.com/owner/repo -n custom-name',
    'repo add github.com/owner/repo -b ~/custom/path',
    'repo add github.com/owner/repo --force',
  ],
  async run(args: string[]) {
    if (args.length < 1) {
      console.error(chalk.red('Usage: repo add <repository_url>'));
      process.exit(1);
    }

    const url = args[0];
    let owner, name, host;
    try {
      ({ owner, name, host } = parseRepositoryUrl(url));
    } catch (err) {
      console.error(chalk.red('Invalid repository URL'));
      process.exit(1);
    }

    try {
      const config = await Config.load();
      const path = join(config.baseDir, host, owner, name);
      debug('parsed url: %s -> %o', url, { owner, name, host, path });

      // Check if repository already exists
      if (config.repositories.find(r => r.url === url)) {
        console.error(chalk.red('Repository already exists'));
        process.exit(1);
      }

      // Create directory
      await mkdir(path, { recursive: true });

      // Clone repository
      const gitUrl = `git@${host}:${owner}/${name}.git`;
      console.log(chalk.gray('Cloning repository...'));
      execSync(`git clone ${gitUrl} ${path}`, { stdio: 'inherit' });

      // Add repository to config
      const repository: Repository = {
        name,
        owner,
        url,
        path,
        host,
        created_at: new Date().toISOString(),
      };
      config.repositories.push(repository);
      await config.save();

      console.log(chalk.green('\nRepository added successfully:'));
      console.log('  Name:', chalk.cyan(repository.name));
      console.log('  URL:', chalk.cyan(repository.url));
      console.log('  Path:', chalk.cyan(repository.path));
    } catch (err) {
      console.error(chalk.red('Failed to add repository:', (err as Error).message));
      process.exit(1);
    }
  },
};

// 解析仓库 URL
// 支持以下格式：
// - github.com/owner/name
// - gitlab.com/owner/name
// - git.example.com/owner/name
function parseRepositoryUrl(url: string): { owner: string; name: string; host: string } {
  if (!url) {
    return { owner: '', name: '', host: '' };
  }

  // 移除 .git 后缀
  url = url.replace(/\.git$/, '');

  // 尝试解析 URL
  const match = url.match(/^(?:https?:\/\/)?([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (!match) {
    throw new Error('Invalid repository URL');
  }

  const [, host, owner, name] = match;
  return { host, owner, name };
}
