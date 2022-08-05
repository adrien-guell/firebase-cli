import { decodeType, optional, record, string } from 'typescript-json-decoder';

export type FirestoreDocument = decodeType<typeof firestoreDocumentDecoder>;
export const firestoreDocumentDecoder = record({
    id: optional(string),
});
