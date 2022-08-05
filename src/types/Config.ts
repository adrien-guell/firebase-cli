import { array, decodeType, record, string } from 'typescript-json-decoder';

export type Config = decodeType<typeof configDecoder>;
export const configDecoder = record({
    serviceAccountPath: string,
    blacklist: array(string),
});
