import { rm } from 'fs/promises';
import { join } from 'path';
import { debuglog } from 'node:util';
import chalk from 'chalk';
import { Config } from '../config/index.js';
import { exists } from '../utils/index.js';

const debug = debuglog('repo:remove');

export interface RemoveCommandOptions {
  force?: boolean;
}

export async function remove(name: string, options: RemoveCommandOptions = {}) {
  const config = await Config.load();
  const repo = config.repositories.find(r => r.name === name);
  
  if (!repo) {
    throw new Error(`Repository "${name}" not found`);
  }

  // Remove from config first
  config.repositories = config.repositories.filter(r => r.name !== name);
  await config.save();

  // Optionally remove local files
  if (options.force) {
    const repoPath = repo.path;
    if (await exists(repoPath)) {
      await rm(repoPath, { recursive: true, force: true });
    }
  }

  return { name, path: repo.path };
}

export const removeCommand = {
  name: 'remove',
  description: 'Remove a repository from management',
  async run(args: string[]) {
    if (args.length < 1) {
      console.error(chalk.red('Please specify the repository name to remove'));
      process.exit(1);
    }

    const name = args[0];
    const force = args.includes('--force') || args.includes('-f');

    try {
      const result = await remove(name, { force });
      console.log(chalk.green(`Repository "${result.name}" has been removed from management${force ? ' and local files deleted' : ''}`));
    } catch (err) {
      console.error(chalk.red('Failed to remove repository:', (err as Error).message));
      process.exit(1);
    }
  },
};
