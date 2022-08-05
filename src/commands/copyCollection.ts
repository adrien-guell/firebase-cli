import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccount,
    isValidServiceAccountPath,
    promptServiceAccountPath,
} from '../firebaseTools';
import fs from 'fs';
import inquirer from 'inquirer';
import { json } from 'stream/consumers';
import { credential, firestore, initializeApp } from 'firebase-admin';
import Credential = credential.Credential;
import Firestore = firestore.Firestore;

export const copyCollections: Command = {
    name: 'copy-collections',
    description:
        'Copy collection(s) from a source project to a destination project',
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
    let sourceServiceAccount: Credential;
    if (!options.sourceServiceAccountPath) {
        sourceServiceAccount = await getServiceAccount(
            'What is the path to the firebase service account of the source project ?'
        );
    } else {
        sourceServiceAccount = JSON.parse(
            fs.readFileSync(options.sourceServiceAccountPath).toString()
        );
    }
    const sourceApp = await getFirebaseApp(sourceServiceAccount);
    const sourceDb = sourceApp.firestore();

    let dstPath = destinationServiceAccountPath;
    if (!isValidServiceAccountPath(dstPath)) {
        dstPath = await promptServiceAccountPath(
            dstPath,
            'What is the path to the firebase service account of the destination project ?'
        );
    }
    const destinationServiceAccount = JSON.parse(
        fs.readFileSync(options.sourceServiceAccountPath).toString()
    );
    const destinationApp = await getFirebaseApp(destinationServiceAccount);
    const destinationDb = destinationApp.firestore();

    let selectedCollections = options.collections;
    const collections = await sourceDb.listCollections();
    const collectionsNames = collections.map((collection) => collection.id);
    if (
        !options.collections ||
        options.collections.length <= 0 ||
        !options.collections.every(
            (collectionName) => collectionName in collectionsNames
        )
    ) {
        const answer = await inquirer.prompt({
            name: 'selectedCollections',
            type: 'checkbox',
            choices: collectionsNames,
            message: `No collection name given, please select one of the following:`,
        });
        selectedCollections = answer.selectedCollections;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath).toString());

    db.collection(collectionName);
}

function collectionExists(db: Firestore, collectionName: string) {
    const snapshot = await db.collection('users').limit(1).get();
    return snapshot.docs.length > 0;
}
