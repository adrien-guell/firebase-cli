import * as fs from 'fs';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { parseFile } from './utils';
import { ServiceAccount, serviceAccountDecoder } from '../types/ServiceAccount';
import cert = admin.credential.cert;
import { getBlocklist, getServiceAccountPath, setDefaultServiceAccountPath } from './configTools';
import { exitProcess, logError, promptBinaryQuestion, promptOpenQuestion } from './promptTools';

/**
 * Check if the given file path is a valid service account file.
 * @return Either true if valid or an error message if invalid.
 * @param { string | undefined } serviceAccountPath file path to check.
 * @param { boolean } printError true if you want to print the errors.
 */
export function isValidServiceAccountPath(
    serviceAccountPath: string | undefined,
    printError: boolean = false
): string | boolean {
    if (!serviceAccountPath) {
        if (printError) logError('No service account path specified');
        return 'No service account path specified';
    }
    if (!fs.existsSync(serviceAccountPath)) {
        if (printError) logError(`File not found: ${serviceAccountPath}`);
        return `File not found: ${serviceAccountPath}`;
    }
    if (path.extname(serviceAccountPath) != '.json') {
        if (printError) logError('Invalid service account file');
        return 'Invalid service account file';
    }

    try {
        const serviceAccount = parseFile(serviceAccountPath, serviceAccountDecoder);
        if (getBlocklist().includes(serviceAccount.project_id)) {
            if (printError) logError(`The project '${serviceAccount.project_id}' is blocklisted`);
            return `The project '${serviceAccount.project_id}' is blocklisted`;
        }
        return true;
    } catch (_) {
        if (printError) logError('Invalid service account file');
        return 'Invalid service account file';
    }
}

/**
 * Get a service account file path with the user input and a path validation.
 * @return A valid service account file path.
 * @param { string | undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 */
export async function getServiceAccountPathWithUserInput(customMessage?: string): Promise<string> {
    return await promptOpenQuestion(
        customMessage ?? 'What is the path to your firebase project service account ?',
        (input) => isValidServiceAccountPath(input)
    );
}

/**
 * Get a service account object with user input and a projectId validation from user.
 * @return A valid service account object.
 * @param { string | undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 */
export async function getServiceAccountWithUserInput(
    customMessage?: string
): Promise<ServiceAccount> {
    const serviceAccountPath = await getServiceAccountPathWithUserInput(customMessage);
    let serviceAccount = parseFile(serviceAccountPath, serviceAccountDecoder);

    return (await promptBinaryQuestion(
        `Do you want to use the '${serviceAccount.project_id}' project ?`
    ))
        ? serviceAccount
        : await getServiceAccountWithUserInput(customMessage);
}

/**
 * Check the validity and parse a service account file path. If not valid, the user will be asked to input a new path.
 * @return A valid service account object.
 * @param { string } serviceAccountPath path of the service account file to check and parse.
 * @param { string| undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 * @param { boolean } askUserIfInvalid true if you want to ask the user for a service account path in case the given one is not valid.
 */
export async function validateAndParseServiceAccountPath(
    serviceAccountPath: string,
    askUserIfInvalid: boolean = true,
    customMessage?: string
): Promise<ServiceAccount> {
    const isValid = isValidServiceAccountPath(serviceAccountPath, true);
    return isValid != true
        ? askUserIfInvalid
            ? getServiceAccountWithUserInput(customMessage)
            : exitProcess(1, `${isValid}`)
        : parseFile(serviceAccountPath, serviceAccountDecoder);
}

/**
 * Get a service account object using config file or a user input if no config. The user input is saved in the config file.
 * @return A valid service account object.
 * @param { string| undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 */
export async function getServiceAccountWithConfigOrUserInput(
    customMessage?: string
): Promise<ServiceAccount> {
    let serviceAccountPath = getServiceAccountPath();
    if (isValidServiceAccountPath(serviceAccountPath, true) != true) {
        serviceAccountPath = await getServiceAccountPathWithUserInput(customMessage);
        setDefaultServiceAccountPath(serviceAccountPath);
    }
    return parseFile(serviceAccountPath!, serviceAccountDecoder);
}

/**
 * Get the firebase app corresponding to the given service account object.
 * @return A firebase app object.
 * @param { ServiceAccount } serviceAccount a valid service account object.
 * @param { string | undefined } appName the name of the app (used only to init multiple apps).
 */
export async function getFirebaseApp(serviceAccount: ServiceAccount, appName?: string) {
    return admin.initializeApp(
        {
            credential: cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key,
            }),
        },
        appName
    );
}
