import { decodeType, record, string } from 'typescript-json-decoder';

export type ServiceAccount = decodeType<typeof serviceAccountDecoder>;
export const serviceAccountDecoder = record({
    type: 'service_account',
    project_id: string,
    private_key_id: string,
    private_key: string,
    client_email: string,
    client_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_x509_cert_url: string,
});