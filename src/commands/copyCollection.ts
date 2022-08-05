import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as inquirer from 'inquirer';

export const copyCollections: Command = {
    name: 'copy-collections',
    description: 'Copy collection(s) from a source project to a destination project',
    arguments: [
        {
            name: 'destinationServiceAccountPath',
            info: 'Path to the service account used to access the destination project',
        },
    ],
    options: [
        {
            name: 'sourceServiceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the source project',
        },
        {
            name: 'collections',
            short: 'c',
            info: 'Name of the collection(s) to copy',
            list: true,
        },
    ],
    action: exportJsonAction,
};

type copyCollectionsOptions = {
    sourceServiceAccountPath: string;
    collections: string[];
};

async function exportJsonAction(
    destinationServiceAccountPath: string,
    options: copyCollectionsOptions
): Promise<void> {
    const sourceServicePrompt =
        'What is the path to the firebase service account of the source project ?';
    const sourceServiceAccount = options.sourceServiceAccountPath
        ? await validateAndParseServiceAccountPath(options.sourceServiceAccountPath)
        : await getServiceAccountWithConfigOrUserInput(sourceServicePrompt);
    const sourceApp = await getFirebaseApp(sourceServiceAccount);
    const sourceDb = sourceApp.firestore();

    const destinationServicePrompt =
        'What is the path to the firebase service account of the destination project ?';
    const destinationServiceAccount = await validateAndParseServiceAccountPath(
        destinationServiceAccountPath,
        destinationServicePrompt
    );
    const destinationApp = await getFirebaseApp(destinationServiceAccount);
    const destinationDb = destinationApp.firestore();

    let selectedCollections = options.collections;
    const collections = await sourceDb.listCollections();
    const collectionsNames = collections.map((collection) => collection.id);
    if (
        !options.collections ||
        options.collections.length <= 0 ||
        !options.collections.every((collectionName) => collectionName in collectionsNames)
    ) {
        const answer = await inquirer.prompt({
            name: 'selectedCollections',
            type: 'checkbox',
            choices: collectionsNames,
            message: 'Select collection(s) from the followings',
        });
        selectedCollections = answer.selectedCollections;
    }
}
