import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as inquirer from 'inquirer';
import { collectionsExists, selectManyBetweenExistingCollections } from '../utils/firestoreTools';
import { Presets, SingleBar } from 'cli-progress';
import * as chalk from 'chalk';

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
    const sourceApp = await getFirebaseApp(sourceServiceAccount, 'source');
    const sourceDb = sourceApp.firestore();

    const destinationServicePrompt =
        'What is the path to the firebase service account of the destination project ?';
    const destinationServiceAccount = await validateAndParseServiceAccountPath(
        destinationServiceAccountPath,
        destinationServicePrompt
    );
    const destinationApp = await getFirebaseApp(destinationServiceAccount, 'destination');
    const destinationDb = destinationApp.firestore();

    let selectedCollectionsName = (await collectionsExists(sourceDb, options.collections))
        ? options.collections
        : await selectManyBetweenExistingCollections(sourceDb);

    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'isValid',
        message: `Are you sure you want to copy the content of the collections${selectedCollectionsName.map(
            (c) => `\n  • ${c}`
        )}\n from the project '${sourceServiceAccount.project_id}' to the project '${
            destinationServiceAccount.project_id
        }' ?`,
    });

    if (!answer.isValid) {
        console.log('Operation canceled');
        process.exit(0);
    }

    for (const collectionName of selectedCollectionsName) {
        const sourceCollection = sourceDb.collection(collectionName);
        const destinationCollection = destinationDb.collection(collectionName);

        const documents = (await sourceCollection.get()).docs;
        const progressBar = new SingleBar(
            {
                format: `Copying ${collectionName} |{bar}| {percentage}%`,
            },
            Presets.shades_classic
        );
        progressBar.start(documents.length, 0);
        for (const document of documents) {
            await destinationCollection.doc(document.id).set(document.data());
            progressBar.increment();
        }
        progressBar.stop();
    }

    console.log(
        chalk.green(
            `Collection copied from ${sourceServiceAccount.project_id} to ${destinationServiceAccount.project_id}`
        )
    );
}
