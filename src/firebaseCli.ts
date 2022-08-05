import { program } from 'commander';
import { exportJson } from './commands/exportJson';
import { Option } from './types/Option';
import { Argument } from './types/Argument';

const commands = [exportJson];

program.name('firebase-cli');

commands.forEach((command) => {
    const commanderCommand = program
        .command(command.name)
        .description(command.description)
        .action(command.action);

    command.arguments.forEach((argument: Argument) => {
        const name = argument.optional
            ? `\<${argument.name}\>`
            : `[${argument.name}]`;
        commanderCommand.argument(name, argument.info);
    });

    command.options.forEach((option: Option) => {
        const shortFlag = option.short ? `-${option.short}, ` : '';
        const longFlag = `--${option.name}${
            option.paramName
                ? ` \<${option.paramName + option.list ? '...' : ''}\>`
                : ''
        }`;

        commanderCommand.option(`${shortFlag}${longFlag}`, option.info);
    });
});

program.parse(process.argv);
