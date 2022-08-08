import { Command } from '../types/Command';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '../utils/configTools';
import * as chalk from 'chalk';

export const blacklist: Command = {
    name: 'blacklist',
    description: 'Edit blacklist of projects',
    arguments: [],
    options: [
        {
            name: 'add',
            argName: 'add',
            short: 'a',
            info: 'Add projects to blacklist',
            list: true,
        },
        {
            name: 'remove',
            argName: 'remove',
            short: 'r',
            info: 'Remove projects to blacklist',
            list: true,
        },
        {
            name: 'list',
            argName: 'list',
            short: 'l',
            info: 'Show the blacklist',
        },
    ],
    action: blacklistAction,
};

type blacklistOptions = {
    add?: string[];
    remove?: string[];
    list: boolean;
};

async function blacklistAction(options?: blacklistOptions): Promise<void> {
    if (options?.add) {
        addToBlacklist(options.add);
        console.log(
            `Added ${chalk.whiteBright(options.add.map((id) => `${id}, `))} to the blacklist`
        );
    } else if (options?.remove) {
        removeFromBlacklist(options.remove);
        console.log(
            `Removed ${chalk.whiteBright(options.remove.map((id) => `${id}, `))} from the blacklist`
        );
    }
    if (options?.list) {
        console.log(`Blacklist :${getBlacklist().map((id) => chalk.whiteBright(`\n• ${id}`))}`);
    }
}
