#!/usr/bin/env node

import { parseArgs } from 'node:util';
import debug from 'debug';
import chalk from 'chalk';
import { helpCommand } from './commands/help.js';

const log = debug('repo:cli');

interface Command {
  name: string;
  description: string;
  run: (args: string[]) => Promise<void>;
}

const commands: Command[] = [
  helpCommand,
];

async function main() {
  const { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
  });

  log('argv: %j', positionals);

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
    await command.run(cmdArgs);
  } catch (err) {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    log('error detail: %O', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
