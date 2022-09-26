import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Presets, SingleBar } from 'cli-progress';
import { format } from './utils';
import * as fs from 'fs';

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
export async function promptValidateOrExit(message: string) {
    await inquirer
        .prompt({
            type: 'confirm',
            name: 'isValid',
            message: message,
        })
        .then((answer) => {
            if (!answer.isValid) exitProcess();
        });
}

export async function promptCustomValidateOrExit(
    message: string,
    continueInput: string,
    cancelInput: string,
    hintMessage: string = ''
) {
    await inquirer
        .prompt({
            type: 'input',
            name: 'input',
            message: message,
            validate: (input: string) =>
                input == continueInput || input == cancelInput ? true : hintMessage,
        })
        .then((answer) => {
            if (answer.input == cancelInput) exitProcess();
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

export async function getFilenameWithOverwriteValidation(
    path: string | undefined,
    overwrite: boolean | undefined,
    defaultPrefix: string = ''
) {
    let filename = path ?? `${defaultPrefix}-${format(new Date())}.json`;
    if (
        fs.existsSync(filename) &&
        !overwrite &&
        !(await promptBinaryQuestion(
            `File already exists: ${filename}.\nWould you like to overwrite it ?`
        ))
    ) {
        let i = 1;
        while (fs.existsSync(`${filename}-${i}`)) {
            ++i;
        }
        filename = `${filename}-${i}`;
    }
    return filename;
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
    await executeOperation(() => progressBar.increment());
    progressBar.stop();
}
