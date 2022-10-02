import { copyCollectionAction } from '../src/commands/copyCollection';
import { test } from '@jest/globals';
import {
    getFirebaseApp,
    getServiceAccountPathWithUserInput,
    getServiceAccountWithConfigOrUserInput,
    isValidServiceAccountPath,
} from '../src/utils/serviceAccountTools';

export function beforeTest() {
    // check config and remove
}

jest.mock('../src/utils/serviceAccountTools', () => {
    const originalModule = jest.requireActual('../src/utils/serviceAccountTools');

    //Mock the default export and named export 'foo'
    return {
        __esModule: true,
        ...originalModule,
        getFirebaseApp: () => {},
        isValidServiceAccountPath: () => Promise.resolve(true),
        getServiceAccountWithConfigOrUserInput: () => 'src_firebase_project',
    };
});

const mockedGetFirebaseApp = jest.mocked(getFirebaseApp);

test('', () => {
    let stdinIterator = 0;
    process.stdin.on('data', (data: string) => {
        if (stdinIterator == 0) {
            process.stdout.write('src_firebase_project');
        }
        stdinIterator++;
    });

    copyCollectionAction('dst_firebase_project', {
        allCollections: false,
        force: false,
    });
});
