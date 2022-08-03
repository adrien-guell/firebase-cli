import fs from 'fs';
import inquirer from 'inquirer';
import { initializeApp } from 'firebase-admin';

export async function getFirebaseApp() {
    const configPath = '../config.json';
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}');
    }
    const config = JSON.parse(fs.readFileSync(configPath).toString());
    if (!config.serviceAccountPath) {
        config.serviceAccountPath = await inquirer.prompt([
            'What is the path to your firebase service account ?',
        ]);
        fs.writeFileSync(configPath, JSON.stringify(configPath));
    }
    const serviceAccount = JSON.parse(
        fs.readFileSync(config.serviceAccountPath).toString()
    );
    return initializeApp({ credential: serviceAccount });
}
