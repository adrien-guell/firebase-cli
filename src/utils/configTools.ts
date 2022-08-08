import * as fs from 'fs';
import { parseFile } from './utils';
import { Config, configDecoder } from '../types/Config';

const configPath = '../config.json';

function getConfig() {
    if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({ blacklist: [] }));
    try {
        return parseFile(configPath, configDecoder);
    } catch (e) {
        console.error('Config file corrupted, please fix it or delete it: config.json');
        process.exit(1);
    }
}

function saveConfig(config: Config) {
    fs.writeFileSync(configPath, JSON.stringify(config));
}

export function getServiceAccountPath(): string | undefined {
    const config = getConfig();
    return config.serviceAccountPath;
}

export function setDefaultServiceAccountPath(serviceAccountPath: string, config?: Config) {
    if (!config) config = getConfig();
    config.serviceAccountPath = serviceAccountPath;
    saveConfig(config);
}

export function addToBlacklist(projectIds: string[], config?: Config) {
    if (!config) config = getConfig();
    for (const projectId of projectIds) {
        if (!(projectId in config.blacklist)) config.blacklist.push();
    }
    saveConfig(config);
}

export function removeFromBlacklist(projectIds: string[], config?: Config) {
    if (!config) config = getConfig();
    config.blacklist = config.blacklist.filter((projectId) => !(projectId in projectIds));
    saveConfig(config);
}

export function getBlacklist(): string[] {
    const config = getConfig();
    return config.blacklist;
}
