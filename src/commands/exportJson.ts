import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import * as chalk from 'chalk';
import { exportJsonFromFirestore, validateCollectionList } from '../utils/firestoreTools';
import { logSuccess, promptBinaryQuestion, promptValidateOrExit } from '../utils/promptTools';
import { formatDate, listToBullets } from '../utils/utils';

export const exportJson: Command = {
    name: 'export-json',
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
    ],
    action: exportJsonAction,
};

type exportJsonOptions = {
    outputFile?: string;
    serviceAccountPath?: string;
    overwrite: boolean;
    allCollections: boolean;
};

async function exportJsonAction(collections: string[], options?: exportJsonOptions): Promise<void> {
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

    let filename = options?.outputFile ?? `firestore_export-${formatDate(new Date())}.json`;
    if (
        fs.existsSync(filename) &&
        !options?.overwrite &&
        !(await promptBinaryQuestion(
            `File already exists: ${filename}.\nWould you like to overwrite it ?`
        ))
    ) {
        let i = 1;
        while (fs.existsSync(`${filename}-${i}`)) {
            ++i;
        }
        filename = `${filename}-${i}`;
    }

    await promptValidateOrExit(
        `Are you sure you want to export the content of the collections${chalk.whiteBright(
            listToBullets(collectionsName)
        )}\n from the project '${chalk.whiteBright(
            serviceAccount.project_id
        )}' to the file '${chalk.whiteBright(filename)}' ?`
    );

    await exportJsonFromFirestore(collectionsName, filename, db);
    logSuccess(`Successfully exported data from ${serviceAccount.project_id} into ${filename}.`);
}
