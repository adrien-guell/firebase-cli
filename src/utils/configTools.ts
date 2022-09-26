import * as fs from 'fs';
import { parseFile } from './utils';
import { Config, configDecoder } from '../types/Config';
import { exitProcess } from './promptTools';

const configPath = '../config.json';

/**
 * Get the configuration file as an object.
 * @return The local config in a Config object.
 */
function getConfig(): Config {
    if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({ blacklist: [] }));
    try {
        return parseFile(configPath, configDecoder);
    } catch (e) {
        return exitProcess(1, 'Config file corrupted, please fix it or delete it: config.json');
    }
}

/**
 * Save a config object in the file config.json.
 * @param { Config } config config to save.
 */
function saveConfig(config: Config) {
    fs.writeFileSync(configPath, JSON.stringify(config));
}

/**
 * Get the service account path saved in the config.json.
 * @return Either a service account path or undefined if none can be found in the local config.
 */
export function getServiceAccountPath(): string | undefined {
    const config = getConfig();
    return config.serviceAccountPath;
}

/**
 * Set the service account path in the config.json. You can pass it an existing config object if you already instantiated one.
 * @param { string } serviceAccountPath path to the service account.
 * @param { Config | undefined } config already instantiated config object.
 */
export function setDefaultServiceAccountPath(serviceAccountPath: string, config?: Config) {
    if (!config) config = getConfig();
    config.serviceAccountPath = serviceAccountPath;
    saveConfig(config);
}

/**
 * Add projects to the blacklist in config.json.
 * @param { string[] } projectIds list of projects to add to the blacklist.
 * @param { Config | undefined } config already instantiated config object.
 */
export function addToBlacklist(projectIds: string[], config?: Config) {
    if (!config) config = getConfig();
    for (const projectId of projectIds) {
        if (!config.blacklist.includes(projectId)) config.blacklist.push(projectId);
    }
    saveConfig(config);
}

/**
 * Remove projects from the blacklist in config.json.
 * @param { string[] } projectIds list of projects to remove from the blacklist.
 * @param { Config | undefined } config already instantiated config object.
 */
export function removeFromBlacklist(projectIds: string[], config?: Config) {
    if (!config) config = getConfig();
    config.blacklist = config.blacklist.filter((projectId) => !projectIds.includes(projectId));
    saveConfig(config);
}

/**
 * Get the blacklist from config.json.
 * @return The list of blacklisted projects in the local config.
 */
export function getBlacklist(): string[] {
    const config = getConfig();
    return config.blacklist;
}
