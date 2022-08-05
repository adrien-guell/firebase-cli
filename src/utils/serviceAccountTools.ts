import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { credential, initializeApp } from 'firebase-admin';
import * as path from 'path';
import { parseFile } from './utils';
import { ServiceAccount, serviceAccountDecoder } from '../types/ServiceAccount';
import { configDecoder } from '../types/Config';
import cert = credential.cert;

/**
 * Check if the given file path is a valid service account file.
 * Returns true if valid.
 * Returns an error message if invalid.
 * @param { string | undefined } serviceAccountPath file path to check.
 */
export function isValidServiceAccountPath(
    serviceAccountPath: string | undefined
): string | boolean {
    if (!serviceAccountPath) {
        return 'No service account path specified';
    }
    if (!fs.existsSync(serviceAccountPath)) {
        `File not found: ${serviceAccountPath}`;
    }
    if (path.extname(serviceAccountPath) != 'json') {
        return 'Invalid service account file';
    }
    try {
        parseFile(serviceAccountPath, serviceAccountDecoder);
        return true;
    } catch (_) {
        return 'Invalid service account file';
    }
}

/**
 * Get a service account file path with the user input and a path validation.
 * Returns a valid service account file path.
 * @param { string | undefined } customMessage message prompted to the user. If not given, a default one will be prompted.
 */
export async function getServiceAccountPathWithUserInput(customMessage?: string): Promise<string> {
    const answer = await inquirer.prompt({
        name: 'serviceAccountPath',
        type: 'input',
        message: customMessage ?? 'What is the path to your firebase project service account ?',
        validate: isValidServiceAccountPath,
    });
    return answer.serviceAccountPath;
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
    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'isDesiredProject',
        message: `Do you want to use the \'${serviceAccount.project_id}\' project ?`,
    });
    return answer.isDesiredProject
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
    return isValidServiceAccountPath(serviceAccountPath) != true
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
    const configPath = '../config.json';
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}');
    }

    try {
        const config = parseFile(configPath, configDecoder);
        if (isValidServiceAccountPath(config.serviceAccountPath) != true) {
            config.serviceAccountPath = await getServiceAccountPathWithUserInput(customMessage);
            fs.writeFileSync(configPath, JSON.stringify(configPath));
        }
        return parseFile(config.serviceAccountPath, serviceAccountDecoder);
    } catch (e) {
        throw 'Config file corrupted, please fix it or delete it: config.json';
    }
}

/**
 * Get the firebase app corresponding to the given service account object.
 * Returns a firebase app object.
 * @param { ServiceAccount } serviceAccount a valid service account object.
 */
export async function getFirebaseApp(serviceAccount: ServiceAccount) {
    return initializeApp({ credential: cert(JSON.stringify(serviceAccount)) });
}
