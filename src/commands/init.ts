import { debuglog } from 'node:util';
import chalk from 'chalk';
import { Config } from '../config/index.js';

const debug = debuglog('repo:init');

export interface InitOptions {
  baseDir?: string;
  username?: string;
  email?: string;
  force?: boolean;
}

export const initCommand = {
  name: 'init',
  description: 'Initialize configuration',
  async run(args: string[], options: InitOptions = {}) {
    debug('init with options: %o', options);

    try {
      // Check if config already exists
      const exists = await Config.exists();
      if (exists && !options.force) {
        console.error(chalk.red('Configuration already exists. Use --force to overwrite.'));
        process.exit(1);
      }

      // Create new config
      const config = new Config({
        baseDir: options.baseDir,
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
    } catch (err) {
      console.error(chalk.red('Failed to initialize configuration:', (err as Error).message));
      process.exit(1);
    }
  },
};
