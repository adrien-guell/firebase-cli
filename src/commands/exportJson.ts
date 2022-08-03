import { Command } from '../types/Command';
import { getFirebaseApp } from '../firebaseManager';

export const exportJson: Command = {
    name: 'export-json',
    description: 'Export a collection as JSON',
    argument: {
        name: 'jsonPath',
        info: 'Path to the json file to export',
    },
    options: [
        {
            name: 'collection',
            short: 'c',
            info: 'Name of the collection to export',
        },
    ],
    action: exportJsonAction,
};

async function exportJsonAction(collection: string, options: any) {
    const app = await getFirebaseApp();
    console.log(app.name);
}
