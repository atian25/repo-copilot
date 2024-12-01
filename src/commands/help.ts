import chalk from 'chalk';

export const helpCommand = {
  name: 'help',
  description: 'Show help information',
  async run() {
    console.log(`
${chalk.bold('Usage:')} repo [command] [options]

${chalk.bold('Commands:')}
  help     Show help information
  init     Initialize configuration
  add      Add a repository
  remove   Remove a repository
  list     List all repositories
  find     Search repositories
  config   Manage configuration
`);
  },
};
