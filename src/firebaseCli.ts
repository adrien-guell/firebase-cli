import { program } from 'commander';
import { exportJson } from './commands/exportJson';

const commands = [exportJson];

program.name('firebase-cli');

commands.forEach((command) => {
    const commanderCommand = program
        .command(command.name)
        .argument(`[${command.argument.name}]`, command.argument.info)
        .description(command.description)
        .action(command.action);
    command.options.forEach((option) => {
        commanderCommand.option(
            `-${option.short}, --${option.name}${
                option.paramName ? ` \<${option.paramName}\>` : ''
            }`,
            option.info
        );
    });
});

program.parse(process.argv);
