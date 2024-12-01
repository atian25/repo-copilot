import chalk from 'chalk';
import { commands } from '../cli.js';

interface CommandOption {
  name: string;
  description: string;
  type: string;
  short?: string;
  required?: boolean;
}

export interface CommandHelp {
  name: string;
  description: string;
  usage?: string;
  options?: CommandOption[];
  examples?: string[];
}

export const helpCommand = {
  name: 'help',
  description: 'Show help information',
  usage: 'repo help [command]',
  options: [
    {
      name: 'command',
      description: 'Command name to show help for',
      type: 'string',
      required: false,
    },
  ],
  examples: [
    'repo help',
    'repo help init',
    'repo help add',
  ],
  async run(args: string[]) {
    const commandName = args[0];
    if (commandName) {
      // Show help for specific command
      const command = commands.find(cmd => cmd.name === commandName) as CommandHelp;
      if (!command) {
        console.error(chalk.red(`Unknown command: ${commandName}`));
        process.exit(1);
      }
      showCommandHelp(command);
    } else {
      // Show general help
      showGeneralHelp();
    }
  },
};

function showGeneralHelp() {
  console.log(`
${chalk.bold('NAME')}
  repo - Manage multiple Git repositories

${chalk.bold('SYNOPSIS')}
  repo [command] [options]

${chalk.bold('COMMANDS')}
${commands.map(cmd => `  ${chalk.cyan(cmd.name.padEnd(8))}  ${cmd.description}`).join('\n')}

${chalk.bold('OPTIONS')}
  --force, -f    Force operation
  --baseDir, -b  Base directory for repositories
  --username, -u Username for Git operations
  --email, -e   Email for Git operations

${chalk.bold('EXAMPLES')}
  ${chalk.gray('# Initialize configuration')}
  repo init -b ~/workspace -u "Your Name" -e "your@email.com"

  ${chalk.gray('# Add a repository')}
  repo add github.com/owner/repo

  ${chalk.gray('# Remove a repository')}
  repo remove repo-name --force

${chalk.bold('MORE INFO')}
  Use ${chalk.cyan('repo help <command>')} to see help for specific commands
`);
}

function showCommandHelp(command: CommandHelp) {
  console.log(`
${chalk.bold('NAME')}
  repo ${command.name} - ${command.description}

${chalk.bold('SYNOPSIS')}
  ${command.usage || `repo ${command.name}`}
${command.options ? `
${chalk.bold('OPTIONS')}
${command.options.map(opt => {
    const required = opt.required ? ' (required)' : '';
    const short = opt.short ? `, -${opt.short}` : '';
    return `  --${opt.name}${short}  ${opt.description}${required}`;
  }).join('\n')}` : ''}
${command.examples ? `
${chalk.bold('EXAMPLES')}
  ${command.examples.join('\n  ')}` : ''}
`);
}
