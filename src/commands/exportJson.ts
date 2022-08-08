import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Presets, SingleBar } from 'cli-progress';
import { parseFile } from '../utils/utils';

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
            name: 'service-account-path',
            argName: 'serviceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the project',
        },
    ],
    action: exportJsonAction,
};

type exportJsonOptions = {
    serviceAccountPath?: string;
};

async function exportJsonAction(jsonPath: string, options?: exportJsonOptions): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(options.serviceAccountPath)
        : await getServiceAccountWithConfigOrUserInput();
    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    if (!fs.existsSync(jsonPath)) {
        console.log(chalk.red(`File not found : ${jsonPath}`));
        process.exit(1);
    }

    const collections: { [collectionName: string]: { [documentName: string]: any } | undefined } =
        parseFile(jsonPath);

    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'isValid',
        message: `Are you sure you want to export the content of the file ${chalk.whiteBright(
            jsonPath
        )} to the project '${chalk.whiteBright(serviceAccount.project_id)}' ?`,
    });

    if (!answer.isValid) {
        console.log(chalk.red('Operation canceled.'));
        process.exit(0);
    }

    for (const collectionName in collections) {
        const documents = collections[collectionName];
        if (!documents) continue;
        const dbCollection = db.collection(collectionName);

        const progressBar = new SingleBar(
            {
                format: chalk.bgGreen(`Exporting ${collectionName} |{bar}| {percentage}%`),
            },
            Presets.shades_classic
        );
        progressBar.start(Object.keys(documents).length, 0);
        for (const documentName in documents) {
            await dbCollection.doc(documentName).set(documents[documentName]);
            progressBar.increment();
        }
        progressBar.stop();
    }

    console.log(
        chalk.green(`Successfully exported data from ${jsonPath} to ${serviceAccount.project_id}.`)
    );
}
