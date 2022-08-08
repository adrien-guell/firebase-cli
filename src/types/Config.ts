import { array, decodeType, optional, record, string } from 'typescript-json-decoder';

export type Config = decodeType<typeof configDecoder>;
export const configDecoder = record({
    serviceAccountPath: optional(string),
    blacklist: array(string),
});
