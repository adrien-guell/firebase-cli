import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import { copyCollectionAcrossProjects, validateCollectionList } from '../utils/firestoreTools';
import * as chalk from 'chalk';
import { logSuccess, promptValidateOrExit } from '../utils/promptTools';
import { listToBullets } from '../utils/utils';

export const copyCollection: Command = {
    name: 'copy-collection',
    description: 'Copy collection(s) from a source project to a destination project',
    arguments: [
        {
            name: 'destinationServiceAccountPath',
            info: 'Path to the service account used to access the destination project',
        },
    ],
    options: [
        {
            name: 'source-service-account-path',
            argName: 'sourceServiceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the source project',
        },
        {
            name: 'collections',
            argName: 'collections',
            short: 'c',
            info: 'Name of the collection(s) to copy',
            list: true,
        },
        {
            name: 'all-collections',
            short: 'a',
            info: "Use this option instead of 'collections' to select all collections in source project",
        },
        {
            name: 'force',
            short: 'f',
            info: 'Forces the operation to be executed without user validation',
        },
    ],
    action: copyCollectionAction,
};

type copyCollectionOptions = {
    sourceServiceAccountPath?: string;
    collections?: string[];
    allCollections: boolean;
    force: boolean;
};

export async function copyCollectionAction(
    destinationServiceAccountPath: string,
    options?: copyCollectionOptions
): Promise<void> {
    const sourceServicePrompt =
        'What is the path to the firebase service account of the source project ?';
    const sourceServiceAccount = options?.sourceServiceAccountPath
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

    let collectionsName = await validateCollectionList(
        sourceDb,
        options?.allCollections,
        options?.collections,
        sourceServiceAccount.project_id
    );

    if (options?.force != true) {
        await promptValidateOrExit(
            `Are you sure you want to copy the content of the collections${chalk.whiteBright(
                listToBullets(collectionsName)
            )}\n from the project '${chalk.whiteBright(
                sourceServiceAccount.project_id
            )}' to the project '${chalk.whiteBright(destinationServiceAccount.project_id)}' ?`
        );
    }

    await copyCollectionAcrossProjects(collectionsName, sourceDb, destinationDb);

    logSuccess(
        `Collection copied from ${sourceServiceAccount.project_id} to ${destinationServiceAccount.project_id}.`
    );
}
