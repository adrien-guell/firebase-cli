import { Command } from '../types/Command';
import { addToBlocklist, getBlocklist, removeFromBlocklist } from '../utils/configTools';
import * as chalk from 'chalk';
import { logSuccess } from '../utils/promptTools';
import { listToBullets, listToText } from '../utils/utils';

export const blocklist: Command = {
    name: 'blocklist',
    description: 'Edit blocklist used to avoid damaging important databases',
    arguments: [],
    options: [
        {
            name: 'add',
            argName: 'add',
            short: 'a',
            info: 'Add projects to blocklist',
            list: true,
        },
        {
            name: 'remove',
            argName: 'remove',
            short: 'r',
            info: 'Remove projects to blocklist',
            list: true,
        },
        {
            name: 'list',
            short: 'l',
            info: 'Show the blocklist',
        },
    ],
    action: blocklistAction,
};

type blocklistOptions = {
    add?: string[];
    remove?: string[];
    list: boolean;
};

async function blocklistAction(options?: blocklistOptions): Promise<void> {
    if (options?.remove) {
        removeFromBlocklist(options.remove);
        logSuccess(`Removed ${chalk.whiteBright(listToText(options.remove))} from the blocklist`);
    }
    if (options?.add) {
        addToBlocklist(options.add);
        logSuccess(`Added ${chalk.whiteBright(listToText(options.add))} to the blocklist`);
    }
    if (options?.list) {
        console.log(`Blocklist :${chalk.whiteBright(listToBullets(getBlocklist()))}`);
    }
}
