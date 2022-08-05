import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { selectOneBetweenExistingCollections } from '../utils/firestoreTools';

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
        {
            name: 'serviceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the project',
        },
    ],
    action: exportJsonAction,
};

type exportJsonOptions = {
    collection: string;
    serviceAccountPath: string;
};

async function exportJsonAction(jsonPath: string, options: exportJsonOptions): Promise<void> {
    const serviceAccount = options.serviceAccountPath
        ? await validateAndParseServiceAccountPath(options.serviceAccountPath)
        : await getServiceAccountWithConfigOrUserInput();
    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    if (!fs.existsSync(jsonPath)) throw `File not found : ${jsonPath}`;

    let collectionName = options.collection ?? (await selectOneBetweenExistingCollections(db));

    const data = JSON.parse(fs.readFileSync(jsonPath).toString());

    db.collection(collectionName);
}
