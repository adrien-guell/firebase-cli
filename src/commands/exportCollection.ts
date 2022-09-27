import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as chalk from 'chalk';
import { exportJsonFromFirestore, validateCollectionList } from '../utils/firestoreTools';
import {
    getFilenameWithOverwriteValidation,
    logSuccess,
    promptValidateOrExit,
} from '../utils/promptTools';
import { listToBullets } from '../utils/utils';

export const exportCollection: Command = {
    name: 'export-collection',
    description: 'Export a collection as JSON',
    arguments: [
        {
            name: 'collections',
            info: 'collection(s) you wish to export',
            list: true,
            optional: true,
        },
    ],
    options: [
        {
            name: 'output-file',
            argName: 'outputFile',
            short: 'o',
            info: 'Path to the JSON file that will be generated',
        },
        {
            name: 'service-account-path',
            argName: 'serviceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the project',
        },
        {
            name: 'overwrite',
            short: 'f',
            info: 'Force overwrite output file if already exists',
        },
        {
            name: 'all-collections',
            short: 'a',
            info: "Use this option instead of 'collections' export all collections in the project",
        },
        {
            name: 'force',
            short: 'f',
            info: 'Forces the operation to be executed without user validation',
        },
    ],
    action: exportCollectionAction,
};

type exportCollectionOptions = {
    outputFile?: string;
    serviceAccountPath?: string;
    overwrite: boolean;
    allCollections: boolean;
    force: boolean;
};

async function exportCollectionAction(
    collections: string[],
    options?: exportCollectionOptions
): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(options.serviceAccountPath)
        : await getServiceAccountWithConfigOrUserInput();

    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    let collectionsName = await validateCollectionList(
        db,
        options?.allCollections,
        collections,
        serviceAccount.project_id
    );

    const filename = await getFilenameWithOverwriteValidation(
        options?.outputFile,
        options?.overwrite,
        'firestore_export'
    );

    if (options?.force != true) {
        await promptValidateOrExit(
            `Are you sure you want to export the content of the collections${chalk.whiteBright(
                listToBullets(collectionsName)
            )}\n from the project '${chalk.whiteBright(
                serviceAccount.project_id
            )}' to the file '${chalk.whiteBright(filename)}' ?`
        );
    }

    await exportJsonFromFirestore(collectionsName, filename, db);
    logSuccess(`Successfully exported data from ${serviceAccount.project_id} into ${filename}.`);
}
