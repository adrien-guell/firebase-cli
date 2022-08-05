import { Command } from '../types/Command';
import { getFirebaseApp, getServiceAccount } from '../firebaseTools';
import fs from 'fs';
import inquirer from 'inquirer';
import { json } from 'stream/consumers';

export const exportJson: Command = {
    name: 'export-json',
    description: 'Export a collection as JSON',
    arguments: [
        {
            name: 'jsonPath',
            info: 'Path to the json file to export',
        },
    ],
    options: [
        {
            name: 'collection',
            short: 'c',
            info: 'Name of the collection to export',
        },
    ],
    action: exportJsonAction,
};

type exportJsonOptions = {
    collection: string;
};

async function exportJsonAction(
    jsonPath: string,
    options: exportJsonOptions
): Promise<void> {
    const serviceAccount = await getServiceAccount();
    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();
    console.log(app.name);

    if (!fs.existsSync(jsonPath)) {
        throw `File not found : ${jsonPath}`;
    }

    let collectionName = options.collection;
    if (!collectionName) {
        const collections = await db.listCollections();
        const collectionsNames = collections.map((collection) => collection.id);
        collectionName = await inquirer.prompt([
            {
                type: 'list',
                choices: collectionsNames,
                message: `No collection name given, please select one of the following:`,
            },
        ]);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath).toString());

    db.collection(collectionName);
}
