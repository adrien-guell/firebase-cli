import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { parseFile } from './utils';
import { ServiceAccount, serviceAccountDecoder } from '../types/ServiceAccount';
import cert = admin.credential.cert;
import { getBlacklist, getServiceAccountPath, setDefaultServiceAccountPath } from './configTools';
import * as chalk from 'chalk';
import { logError, promptBinaryQuestion, promptOpenQuestion } from './promptTools';

/**
 * Check if the given file path is a valid service account file.
 * Returns true if valid.
 * Returns an error message if invalid.
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
        if (getBlacklist().includes(serviceAccount.project_id)) {
            if (printError) logError(`The project '${serviceAccount.project_id}' is blacklisted`);
            return `The project '${serviceAccount.project_id}' is blacklisted`;
        }
        return true;
    } catch (_) {
        if (printError) logError('Invalid service account file');
        return 'Invalid service account file';
    }
}

/**
 * Get a service account file path with the user input and a path validation.
 * Returns a valid service account file path.
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
 * Returns a valid service account object.
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
 * Returns a valid service account object.
 * @param { string } serviceAccountPath path of the service account file to check and parse
 * @param { string| undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 */
export async function validateAndParseServiceAccountPath(
    serviceAccountPath: string,
    customMessage?: string
): Promise<ServiceAccount> {
    return isValidServiceAccountPath(serviceAccountPath, true) != true
        ? getServiceAccountWithUserInput(customMessage)
        : parseFile(serviceAccountPath, serviceAccountDecoder);
}

/**
 * Get a service account object using config file or a user input if no config. The user input is saved in the config file.
 * Returns a valid service account object.
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
 * Returns a firebase app object.
 * @param { ServiceAccount } serviceAccount a valid service account object.
 * @param { string | undefined } appName the name of the app (used only to init multiple apps)
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
