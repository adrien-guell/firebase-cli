import { program } from 'commander';
import { importCollection } from './commands/importCollection';
import { Option } from './types/Option';
import { Argument } from './types/Argument';
import { copyCollection } from './commands/copyCollection';
import { deleteCollections } from './commands/deleteCollection';
import { config } from './commands/config';
import { blacklist } from './commands/blacklist';
import { exportCollection } from './commands/exportCollection';
import { importRemoteConfig } from './commands/importRemoteConfig';
import { exportRemoteConfig } from './commands/exportRemoteConfig';

const commands = [
    importCollection,
    exportCollection,
    copyCollection,
    deleteCollections,
    config,
    blacklist,
    importRemoteConfig,
    exportRemoteConfig,
];

program.name('firebase-cli');

commands.forEach((command) => {
    const commanderCommand = program
        .command(command.name)
        .description(command.description)
        .action(command.action);

    command.arguments.forEach((argument: Argument) => {
        const name = argument.name + (argument.list ? '...' : '');
        const bracedName = argument.optional ? `[${name}]` : `\<${name}\>`;
        commanderCommand.argument(bracedName, argument.info);
    });

    command.options.forEach((option: Option) => {
        const shortFlag = option.short ? `-${option.short}, ` : '';
        const longFlag = `--${option.name}${
            option.argName ? ` \<${option.argName + (option.list ? '...' : '')}\>` : ''
        }`;

        commanderCommand.option(`${shortFlag}${longFlag}`, option.info);
    });
});

program.parse(process.argv);
