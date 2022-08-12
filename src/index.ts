#!/usr/bin/env node

import { program } from 'commander';
import { importJson } from './commands/importJson';
import { Option } from './types/Option';
import { Argument } from './types/Argument';
import { copyCollections } from './commands/copyCollections';
import { deleteCollections } from './commands/deleteCollection';
import { config } from './commands/config';
import { blacklist } from './commands/blacklist';
import { exportJson } from './commands/exportJson';

const commands = [importJson, exportJson, copyCollections, deleteCollections, config, blacklist];

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
