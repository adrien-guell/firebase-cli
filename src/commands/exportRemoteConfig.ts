import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as chalk from 'chalk';
import { exportJsonFromRemoteConfig } from '../utils/firebaseTools';
import {
    getFilenameWithOverwriteValidation,
    logSuccess,
    promptProjectInfos,
    promptValidateOrExit,
} from '../utils/promptTools';

export const exportRemoteConfig: Command = {
    name: 'export-remote-config',
    description: 'Export remote config as JSON',
    arguments: [],
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
            short: 'w',
            info: 'Force overwrite the output file if it already exists',
        },
        {
            name: 'force',
            short: 'f',
            info: 'Forces the operation to be executed without user validation',
        },
    ],
    action: exportRemoteConfigAction,
};

type exportRemoteConfigOptions = {
    outputFile?: string;
    serviceAccountPath?: string;
    overwrite: boolean;
    force: boolean;
};

async function exportRemoteConfigAction(options?: exportRemoteConfigOptions): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(
              options.serviceAccountPath,
              options?.force != true
          )
        : await getServiceAccountWithConfigOrUserInput();
    promptProjectInfos(serviceAccount);

    const app = await getFirebaseApp(serviceAccount);

    const filename = await getFilenameWithOverwriteValidation(
        options?.outputFile,
        options?.overwrite,
        'remote_config',
        options?.force != true
    );

    if (options?.force != true) {
        await promptValidateOrExit(
            `Are you sure you want to export the remote config from the project '${chalk.whiteBright(
                serviceAccount.project_id
            )}' to the file '${chalk.whiteBright(filename)}' ?`
        );
    }

    await exportJsonFromRemoteConfig(filename, app);
    logSuccess(
        `Successfully exported remote config from ${serviceAccount.project_id} into ${filename}.`
    );
}
