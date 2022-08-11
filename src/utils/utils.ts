import * as fs from 'fs';
import { DecoderFunction } from 'typescript-json-decoder';

export function parseFile<T>(path: string, decoder?: DecoderFunction<T>): T {
    const data: any = JSON.parse(fs.readFileSync(path).toString());
    return decoder ? decoder(data) : data;
}

export const listToText = (list: any[]): string =>
    list
        .map((id, index) =>
            list.length == 1 ? id.toString() : index < list.length - 1 ? `${id}, ` : `and ${id}`
        )
        .join('');

export const listToBullets = (list: any[]): string => list.map((id) => `\n• ${id}`).join('');
