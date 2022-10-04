import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import * as chalk from 'chalk';
import {
    exitProcess,
    logSuccess,
    promptProjectInfos,
    promptValidateOrExit,
} from '../utils/promptTools';
import { importJsonToFirestore, importJsonToFirestoreWithBatch } from '../utils/firebaseTools';

export const importCollection: Command = {
    name: 'import-collection',
    description: 'Import a collection from a local JSON',
    arguments: [
        {
            name: 'jsonPath',
            info: 'Path to the json file to import',
        },
    ],
    options: [
        {
            name: 'service-account-path',
            argName: 'serviceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the project',
        },
        {
            name: 'batch',
            short: 'b',
            info: 'Use the batch API to push the collections faster (use for large collections)',
        },
        {
            name: 'force',
            short: 'f',
            info: 'Forces the operation to be executed without user validation',
        },
    ],
    action: importCollectionAction,
};

type importCollectionOptions = {
    serviceAccountPath?: string;
    force: boolean;
    batch: boolean;
};

async function importCollectionAction(
    jsonPath: string,
    options?: importCollectionOptions
): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(
              options.serviceAccountPath,
              options?.force != true
          )
        : await getServiceAccountWithConfigOrUserInput();
    promptProjectInfos(serviceAccount);

    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    if (!fs.existsSync(jsonPath)) exitProcess(1, `File not found : ${jsonPath}`);

    if (options?.force != true) {
        await promptValidateOrExit(
            `Are you sure you want to import the content of the file ${chalk.whiteBright(
                jsonPath
            )} to the project '${chalk.whiteBright(serviceAccount.project_id)}' ?`
        );
    }

    if (options?.batch) {
        await importJsonToFirestoreWithBatch(jsonPath, db);
    } else {
        await importJsonToFirestore(jsonPath, db);
    }

    logSuccess(`Successfully imported data from ${jsonPath} to ${serviceAccount.project_id}.`);
}
