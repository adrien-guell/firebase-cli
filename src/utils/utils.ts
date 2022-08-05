import * as fs from 'fs';
import { DecoderFunction } from 'typescript-json-decoder';

export function parseFile<T>(path: string, decoder?: DecoderFunction<T>): T {
    const data = fs.readFileSync(path).toString();
    return decoder ? decoder(data) : JSON.parse(data);
}
