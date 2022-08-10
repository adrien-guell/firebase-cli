import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import { deleteCollectionsFromFirestore, validateCollectionList } from '../utils/firestoreTools';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Presets, SingleBar } from 'cli-progress';
import { logSuccess, promptValidateOrExit } from '../utils/promptTools';

export const deleteCollections: Command = {
    name: 'delete-collections',
    description: 'Delete collection(s) inside a defined project',
    arguments: [],
    options: [
        {
            name: 'service-account-path',
            argName: 'serviceAccountPath',
            short: 's',
            info: 'Path to the service account used to access the project',
        },
        {
            name: 'collections',
            argName: 'collections',
            short: 'c',
            info: 'Name of the collection(s) to delete',
            list: true,
        },
        {
            name: 'all-collections',
            short: 'a',
            info: "Use this option instead of 'collections' to delete all collections in the project",
        },
    ],
    action: deleteCollectionsAction,
};

type deleteCollectionsOptions = {
    serviceAccountPath?: string;
    collections?: string[];
    allCollections: boolean;
};

async function deleteCollectionsAction(options?: deleteCollectionsOptions): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(options.serviceAccountPath)
        : await getServiceAccountWithConfigOrUserInput();

    const app = await getFirebaseApp(serviceAccount);
    const db = app.firestore();

    let collectionsName = await validateCollectionList(
        db,
        options?.allCollections,
        options?.collections,
        serviceAccount.project_id
    );

    await promptValidateOrExit(
        `Are you sure you want to delete the collections${chalk.whiteBright(
            collectionsName.map((c) => `\n  • ${c}`)
        )}\n from the project '${chalk.whiteBright(
            serviceAccount.project_id
        )}' ?\nTo validate type '${chalk.whiteBright(
            serviceAccount.project_id
        )}', else to cancel type '${chalk.whiteBright('cancel')}'.`,
        (input: string) => {
            return input == serviceAccount.project_id || input == 'cancel'
                ? true
                : `Please enter \'${chalk.whiteBright(
                      serviceAccount.project_id
                  )}\' to delete or '${chalk.whiteBright('cancel')}' to cancel.`;
        }
    );

    await deleteCollectionsFromFirestore(collectionsName, db);

    logSuccess(`Successfully deleted collections from ${serviceAccount.project_id}.`);
}
