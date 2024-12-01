import { join } from 'node:path';
import { debuglog } from 'node:util';
import chalk from 'chalk';
import { loadConfig, loadRepositories, saveRepositories, type Repository } from '../config/index.js';

const debug = debuglog('repo:add');

export const addCommand = {
  name: 'add',
  description: 'Add a repository',
  async run(args: string[]) {
    // 检查参数
    if (args.length !== 1) {
      console.error(chalk.red('Usage: repo add <repository_url>'));
      process.exit(1);
    }

    const url = args[0];
    debug('add repository: %s', url);

    // 解析仓库信息
    const { owner, name, host } = parseRepositoryUrl(url);
    if (!owner || !name || !host) {
      console.error(chalk.red('Invalid repository URL'));
      process.exit(1);
    }

    // 加载配置
    const [config, repositories] = await Promise.all([
      loadConfig(),
      loadRepositories(),
    ]);

    // 检查是否已存在
    if (repositories.some(repo => repo.url === url)) {
      console.error(chalk.red('Repository already exists'));
      process.exit(1);
    }

    // 创建仓库信息
    const repository: Repository = {
      name,
      owner,
      url,
      host,
      path: join(config.baseDir, host, owner, name),
      created_at: new Date().toISOString(),
    };

    // 保存仓库信息
    await saveRepositories([...repositories, repository]);

    console.log(chalk.green('Repository added successfully:'));
    console.log('  Name:', chalk.cyan(repository.name));
    console.log('  URL:', chalk.cyan(repository.url));
    console.log('  Path:', chalk.cyan(repository.path));
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
    return { owner: '', name: '', host: '' };
  }

  const [, host, owner, name] = match;
  return { host, owner, name };
}
