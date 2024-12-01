import { join } from 'path';
import { Config } from '../config/index.js';
import { exists } from '../utils/index.js';
import chalk from 'chalk';
import { debuglog } from 'node:util';

const debug = debuglog('repo:init');

export interface InitOptions {
  username?: string;
  email?: string;
  force?: boolean;
}

export const initCommand = {
  name: 'init',
  description: 'Initialize configuration',
  usage: 'repo init [options]',
  options: [
    {
      name: 'username',
      short: 'u',
      description: 'Username for Git operations',
      type: 'string',
      required: true,
    },
    {
      name: 'email',
      short: 'e',
      description: 'Email for Git operations',
      type: 'string',
      required: true,
    },
    {
      name: 'force',
      short: 'f',
      description: 'Force overwrite existing configuration',
      type: 'boolean',
    },
  ],
  examples: [
    'repo init -u "Your Name" -e "your@email.com"',
    'repo init --force -u "Your Name" -e "your@email.com"',
  ],
  async run(args: string[], options: InitOptions = {}) {
    debug('init with options: %o', options);

    // Check if config exists
    if (await Config.exists()) {
      if (!options.force) {
        throw new Error('Configuration already exists. Use --force to overwrite.');
      }
    }

    // Create new config
    const config = new Config({
      baseDir: join(process.env.REPO_COPILOT_CONFIG_DIR || '~/.repo-copilot', 'repos'),
      username: options.username,
      email: options.email,
    });

    // Save config
    await config.save();

    console.log(chalk.green('Configuration initialized successfully:'));
    console.log('  Base Directory:', chalk.cyan(config.baseDir));
    if (config.username) console.log('  Username:', chalk.cyan(config.username));
    if (config.email) console.log('  Email:', chalk.cyan(config.email));
    console.log('  Config Directory:', chalk.cyan(config.configDir));
  },
};
