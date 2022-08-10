import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import * as chalk from 'chalk';
import { exitProcess, logSuccess, promptValidateOrExit } from '../utils/promptTools';
import { importJsonToFirestore } from '../utils/firestoreTools';

export const importJson: Command = {
    name: 'import-json',
    description: 'Import a collection as JSON',
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
    ],
    action: importJsonAction,
};

type importJsonOptions = {
    serviceAccountPath?: string;
};

async function importJsonAction(jsonPath: string, options?: importJsonOptions): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(options.serviceAccountPath)
        : await getServiceAccountWithConfigOrUserInput();

    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    if (!fs.existsSync(jsonPath)) exitProcess(1, `File not found : ${jsonPath}`);

    await promptValidateOrExit(
        `Are you sure you want to import the content of the file ${chalk.whiteBright(
            jsonPath
        )} to the project '${chalk.whiteBright(serviceAccount.project_id)}' ?`
    );

    await importJsonToFirestore(jsonPath, db);
    logSuccess(`Successfully imported data from ${jsonPath} to ${serviceAccount.project_id}.`);
}
