import { Command } from '../types/Command';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '../utils/configTools';
import * as chalk from 'chalk';
import { logSuccess } from '../utils/promptTools';
import { listToBullets, listToText } from '../utils/utils';

export const blacklist: Command = {
    name: 'blacklist',
    description: 'Edit blacklist used to avoid damaging important databases',
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
    if (options?.remove) {
        removeFromBlacklist(options.remove);
        logSuccess(`Removed ${chalk.whiteBright(listToText(options.remove))} from the blacklist`);
    }
    if (options?.add) {
        addToBlacklist(options.add);
        logSuccess(`Added ${chalk.whiteBright(listToText(options.add))} to the blacklist`);
    }
    if (options?.list) {
        console.log(`Blacklist :${chalk.whiteBright(listToBullets(getBlacklist()))}`);
    }
}
