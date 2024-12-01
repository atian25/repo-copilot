import { rm } from 'fs/promises';
import { join, resolve } from 'path';
import chalk from 'chalk';
import { Config } from '../config/index.js';
import { exists, isSubDirectory } from '../utils/index.js';
import { execSync } from 'child_process';

export interface RemoveCommandOptions {
  force?: boolean;
  yes?: boolean;
}

async function checkGitStatus(repoPath: string): Promise<boolean> {
  try {
    // Get absolute path
    const absPath = resolve(repoPath);
    console.error('Checking git status in:', absPath);

    // Check both staged and unstaged changes
    const status = execSync('git status --porcelain', { cwd: absPath, encoding: 'utf8' });
    console.error('Git status output:', JSON.stringify(status));
    const hasChanges = status.trim() !== '';
    console.error('Has changes:', hasChanges);
    if (hasChanges) {
      throw new Error(`Repository has uncommitted changes:\n${status}`);
    }
    return true;
  } catch (err) {
    if ((err as Error).message.includes('Repository has uncommitted changes')) {
      console.error('Throwing error:', err.message);
      throw err;
    }
    console.error('Failed to check git status:', err);
    return true; // If we can't check, assume it's clean
  }
}

export async function remove(name: string, options: RemoveCommandOptions = {}) {
  const config = await Config.load();
  const repo = config.repositories.find(r => r.name === name);
  
  if (!repo) {
    throw new Error(`Repository "${name}" not found`);
  }

  // Get absolute path and verify it's under baseDir
  const repoPath = resolve(repo.path);
  const baseDir = resolve(config.baseDir);
  if (!isSubDirectory(baseDir, repoPath)) {
    throw new Error(`Repository path ${repoPath} is not under base directory ${baseDir}`);
  }

  // Check if directory exists
  const dirExists = await exists(repoPath);
  
  // If force removal is requested, check repository status
  if (options.force && dirExists) {
    console.error('Checking git status for', repoPath);
    try {
      const isClean = await checkGitStatus(repoPath);
      console.error('Repository is clean:', isClean);
      if (!isClean && !options.yes) {
        throw new Error(`Repository has uncommitted changes. Use --yes to force remove anyway.`);
      }
    } catch (err) {
      console.error('Caught error:', err.message);
      if (!options.yes) {
        throw err;
      }
      console.error('Warning:', err.message);
    }
  }

  // Remove from config first
  config.repositories = config.repositories.filter(r => r.name !== name);
  await config.save();

  // Optionally remove local files
  if (options.force && dirExists) {
    await rm(repoPath, { recursive: true, force: true });
  }

  return { name, path: repoPath, removed: options.force && dirExists };
}

export const removeCommand = {
  name: 'remove',
  description: 'Remove a repository from management',
  usage: 'repo remove <repository> [options]',
  options: [
    {
      name: 'force',
      short: 'f',
      description: 'Remove local repository files',
      type: 'boolean',
    },
    {
      name: 'yes',
      short: 'y',
      description: 'Skip confirmation and force removal even with uncommitted changes',
      type: 'boolean',
    },
  ],
  examples: [
    'repo remove repo-name',
    'repo remove repo-name --force',
    'repo remove repo-name --force --yes',
  ],
  async run(args: string[], options: Record<string, any> = {}) {
    if (args.length < 1) {
      process.stdout.write(chalk.red('Please specify the repository name to remove') + '\n');
      process.exit(1);
    }

    const name = args[0];
    const force = options.force;
    const yes = options.yes;

    console.error('Command options:', { name, force, yes, args, options });

    try {
      // Show confirmation for force removal
      if (force && !yes) {
        process.stdout.write(chalk.yellow('\nWarning: This will remove the repository from management AND delete local files.') + '\n');
        process.stdout.write(chalk.yellow('If you only want to remove from management, don\'t use --force option.\n') + '\n');
        
        const answer = await new Promise<string>(resolve => {
          process.stdout.write(chalk.yellow('Are you sure? [y/N] '));
          process.stdin.once('data', data => {
            resolve(data.toString().trim().toLowerCase());
          });
        });
        
        if (answer !== 'y' && answer !== 'yes') {
          process.stdout.write(chalk.yellow('\nOperation cancelled.') + '\n');
          process.exit(0);
        }
      }

      const result = await remove(name, { force, yes });
      process.stdout.write(chalk.green(`Repository "${result.name}" has been removed from management${result.removed ? ' and local files deleted' : ''}`) + '\n');
      
      if (!result.removed && force) {
        process.stdout.write(chalk.yellow(`Note: Local directory ${result.path} does not exist`) + '\n');
      }
    } catch (err) {
      process.stdout.write(chalk.red('Failed to remove repository: ' + (err as Error).message) + '\n');
      process.exit(1);
    }
  },
};
