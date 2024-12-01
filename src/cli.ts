#!/usr/bin/env node

import { parseArgs, debuglog } from 'node:util';
import chalk from 'chalk';
import { helpCommand } from './commands/help.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { initCommand } from './commands/init.js';

const log = debuglog('repo:cli');

interface Command {
  name: string;
  description: string;
  run: (args: string[], options?: Record<string, any>) => Promise<void>;
}

const commands: Command[] = [
  helpCommand,
  initCommand,
  addCommand,
  removeCommand,
];

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      force: { type: 'boolean', short: 'f' },
      baseDir: { type: 'string', short: 'b' },
      username: { type: 'string', short: 'u' },
      email: { type: 'string', short: 'e' },
    },
  });

  log('argv: %j', { positionals, values });

  // 获取子命令
  const cmd = positionals[0] || 'help';
  const cmdArgs = positionals.slice(1);

  try {
    // 查找对应的命令
    const command = commands.find(c => c.name === cmd);
    if (!command) {
      console.error(chalk.red(`Unknown command: ${cmd}`));
      process.exit(1);
    }

    // 执行命令
    await command.run(cmdArgs, values);
  } catch (err) {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    log('error detail: %O', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red('Fatal error:', err instanceof Error ? err.message : String(err)));
  log('error detail: %O', err);
  process.exit(1);
});
