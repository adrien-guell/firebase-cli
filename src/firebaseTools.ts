import fs from 'fs';
import inquirer from 'inquirer';
import { credential, initializeApp } from 'firebase-admin';
import Credential = credential.Credential;
import path from 'path';

export function isValidServiceAccountPath(
    serviceAccountPath: string | undefined
): serviceAccountPath is string {
    return (
        serviceAccountPath != undefined &&
        fs.existsSync(serviceAccountPath) &&
        path.extname(serviceAccountPath) == 'json'
    );
}

export async function promptServiceAccountPath(
    serviceAccountPath: string | undefined,
    customMessage?: string
): Promise<string> {
    const answer = await inquirer.prompt({
        name: 'serviceAccountPath',
        type: 'input',
        message:
            customMessage ??
            'What is the path to your firebase project service account ?',
        validate: (input: string) => {
            if (!isValidServiceAccountPath(input)) {
                return 'Invalid service account file, please enter a valid path to the file';
            }
            return true;
        },
    });
    return answer.serviceAccountPath;
}

export async function getServiceAccount(
    customMessage?: string
): Promise<Credential> {
    const configPath = '../config.json';
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}');
    }

    const config = JSON.parse(fs.readFileSync(configPath).toString());
    if (!isValidServiceAccountPath(config.serviceAccountPath)) {
        config.serviceAccountPath = await promptServiceAccountPath(
            config.serviceAccountPath,
            customMessage
        );
        fs.writeFileSync(configPath, JSON.stringify(configPath));
    }
    return JSON.parse(fs.readFileSync(config.serviceAccountPath).toString());
}

export async function getFirebaseApp(serviceAccount: Credential) {
    return initializeApp({ credential: serviceAccount });
}
