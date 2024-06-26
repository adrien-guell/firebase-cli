import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Presets, SingleBar } from 'cli-progress';
import * as fs from 'fs';
import { ServiceAccount } from '../types/ServiceAccount';
import { debuglog } from 'util';

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
/**
 *
 * @param serviceAccount
 */
export function promptProjectInfos(serviceAccount: ServiceAccount) {
    console.log(
        `== You are currently working on the project: ${chalk.red(serviceAccount.project_id)}`
    );
}

/**
 * Prompt a message and wait for user validation or cancellation. Expected inputs from user are yes or no.
 * Nothing is returned, the process either continues or is exited.
 * @param { string } message message to prompt.
 */
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

/**
 * Prompt a message and wait for user validation or cancellation.
 * Expected inputs from user are continueInput or cancelInput.
 * hintMessage is prompted when the user input does not match with the expected ones.
 * Nothing is returned, the process either continues or is exited.
 * @param { string } message message to prompt.
 * @param { string } continueInput expected input to continue process.
 * @param { string } cancelInput expected input to cancel process.
 * @param { string | undefined } hintMessage message prompted if the user does not type an expected input.
 */
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

/**
 * Prompt a list within witch the user can select one element.
 * @return The element selected.
 * @param { string[] } choices list of the choices to select from.
 * @param { string } message message prompted to the user.
 */
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

/**
 * Prompt a list within witch the user can select one or more elements.
 * @return All the selected elements.
 * @param { string[] } choices list of the choices to select from.
 * @param { string } message message prompted to the user.
 */
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

/**
 * Prompt a question to the user and wait for an input. The input can be validated with the validation function.
 * @return The user input.
 * @param { string } message message prompted to the user.
 * @param { (string) => (string | boolean) | undefined } validate function that validates user input.
 */
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

/**
 * Prompt a question to the user and wait for a binary response. The input can be validated with the validation function.
 * @return The result of the validate function applied on the user input.
 * @param { string } message message prompted to the user.
 * @param { (string) => (string | boolean) | undefined } validate function that validates user input.
 */
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

/**
 * Generate a filename if the  `path` already exists and the user doesn't want to overwrite it.
 * @return { string } Generated filename.
 * @param { string | undefined } path path with filename to check.
 * @param { boolean | undefined } overwrite force to overwrite the file.
 * @param { string | undefined } defaultPrefix filename prefix.
 * @param { boolean } askUserIfOverwrite true if you want to ask the user if he wants to overwrite.
 */
export async function getFilenameWithOverwriteValidation(
    path: string | undefined,
    overwrite: boolean | undefined,
    defaultPrefix: string = '',
    askUserIfOverwrite: boolean = true
) {
    let filename = path ?? `${defaultPrefix}-${Date.now()}.json`;
    if (
        fs.existsSync(filename) &&
        !overwrite &&
        !(askUserIfOverwrite
            ? await promptBinaryQuestion(
                  `File already exists: ${filename}.\nWould you like to overwrite it ?`
              )
            : exitProcess(1, `File already exists: ${filename}.`))
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
