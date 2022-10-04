import { Command } from '../types/Command';
import {
    getFirebaseApp,
    getServiceAccountWithConfigOrUserInput,
    validateAndParseServiceAccountPath,
} from '../utils/serviceAccountTools';
import * as fs from 'fs';
import {
    exitProcess,
    logSuccess,
    promptProjectInfos,
    promptValidateOrExit,
} from '../utils/promptTools';
import * as chalk from 'chalk';
import { importJsonToRemoteConfig } from '../utils/firebaseTools';

export const importRemoteConfig: Command = {
    name: 'import-remote-config',
    description: 'Import remote config from a local JSON',
    arguments: [
        {
            name: 'jsonPath',
            info: 'Path to the json file to import in remote config',
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
            name: 'force',
            short: 'f',
            info: 'Forces the operation to be executed without user validation',
        },
    ],
    action: importRemoteConfigAction,
};

type importRemoteConfigOptions = {
    serviceAccountPath?: string;
    force: boolean;
};

async function importRemoteConfigAction(
    jsonPath: string,
    options?: importRemoteConfigOptions
): Promise<void> {
    const serviceAccount = options?.serviceAccountPath
        ? await validateAndParseServiceAccountPath(
              options.serviceAccountPath,
              options?.force != true
          )
        : await getServiceAccountWithConfigOrUserInput();
    promptProjectInfos(serviceAccount);

    const app = await getFirebaseApp(serviceAccount);

    if (!fs.existsSync(jsonPath)) exitProcess(1, `File not found : ${jsonPath}`);

    if (options?.force != true) {
        await promptValidateOrExit(
            `Are you sure you want to import the content of the file ${chalk.whiteBright(
                jsonPath
            )} to the remote config of the project '${chalk.whiteBright(
                serviceAccount.project_id
            )}' ?`
        );
    }

    await importJsonToRemoteConfig(jsonPath, app);
    logSuccess(
        `Successfully imported remote config from ${jsonPath} to ${serviceAccount.project_id}.`
    );
}
