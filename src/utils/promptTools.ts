import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Presets, SingleBar } from 'cli-progress';
import { isValidServiceAccountPath } from './serviceAccountTools';

/** Log **/
export function logError(message: string) {
    console.log(chalk.red(message));
}

export function logSuccess(message: string) {
    console.log(chalk.green(message));
}

export function exitProcess(code: number = 0, message: string = 'Operation canceled.') {
    logError(message);
    return process.exit(code);
}

/** Prompt **/
export async function promptValidateOrExit(
    message: string,
    validate: (input: string) => string | boolean = () => true
) {
    await inquirer
        .prompt({
            type: 'confirm',
            name: 'isValid',
            message: message,
            validate: validate,
        })
        .then((answer) => {
            if (!answer.isValid) exitProcess();
        });
}

export async function promptListSelection(choices: string[], message: string): Promise<string> {
    return inquirer
        .prompt({
            name: 'element',
            type: 'list',
            choices: choices,
            message: message,
        })
        .then((answer) => answer.element);
}

export async function promptCheckbox(choices: string[], message: string): Promise<string[]> {
    return inquirer
        .prompt({
            name: 'list',
            type: 'checkbox',
            choices: choices,
            message: message,
        })
        .then((answer) => answer.list);
}

export async function promptOpenQuestion(
    message: string,
    validate: (input: string) => string | boolean = () => true
): Promise<string> {
    return inquirer
        .prompt({
            name: 'input',
            type: 'input',
            message: message,
            validate: validate,
        })
        .then((answer) => answer.input);
}

export async function promptBinaryQuestion(
    message: string,
    validate: (input: string) => string | boolean = () => true
): Promise<boolean> {
    return inquirer
        .prompt({
            name: 'isValid',
            type: 'confirm',
            message: message,
            validate: validate,
        })
        .then((answer) => answer.isValid);
}

/** Progress Bar **/
function getProgressBar(size: number, prefix: string = '') {
    const progressBar = new SingleBar(
        {
            format: chalk.bgGreen(`${prefix} |{bar}| {percentage}%`),
        },
        Presets.shades_classic
    );
    progressBar.start(size, 0);
    return progressBar;
}

export async function executeOperationWithProgressBar(
    size: number,
    prefix: string = '',
    executeOperation: (increment: () => void) => Promise<void>
) {
    const progressBar = getProgressBar(size, prefix);
    await executeOperation(progressBar.increment);
    progressBar.stop();
}
