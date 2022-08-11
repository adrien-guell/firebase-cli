import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;
import { parseFile } from './utils';
import {
    executeOperationWithProgressBar,
    logError,
    promptCheckbox,
    promptListSelection,
} from './promptTools';
import * as fs from 'fs';
import * as path from 'path';

export async function selectOneBetweenExistingCollections(db: Firestore): Promise<string> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    return promptListSelection(
        collectionsName,
        'No collection name given, please select one of the followings:'
    );
}

export async function selectManyBetweenExistingCollections(db: Firestore): Promise<string[]> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    return promptCheckbox(collectionsName, 'Select collection(s) from the followings:');
}

export async function collectionsExists(db: Firestore, collections: string[]): Promise<boolean> {
    const actualCollections = await db.listCollections();
    const actualCollectionsName = actualCollections.map((collection) => collection.id);
    return collections.every((collectionName) => actualCollectionsName.includes(collectionName));
}

export async function validateCollectionList(
    db: Firestore,
    allCollections: boolean | undefined,
    collectionNames: string[] | undefined,
    projectId: string
): Promise<string[]> {
    if (allCollections) return db.listCollections().then((l) => l.map((c) => c.id));
    if (!collectionNames || collectionNames.length <= 0)
        return selectManyBetweenExistingCollections(db);
    if (await collectionsExists(db, collectionNames)) return collectionNames;

    logError(`One or more given collection cannot be found in the ${projectId} project`);
    return selectManyBetweenExistingCollections(db);
}

export async function importJsonToFirestore(jsonPath: string, db: Firestore) {
    // TODO check json file integrity
    const collections: { [collectionName: string]: { [documentName: string]: any } | undefined } =
        parseFile(jsonPath);

    for (const collectionName in collections) {
        const documents = collections[collectionName];
        if (!documents) continue;

        await executeOperationWithProgressBar(
            Object.keys(documents).length,
            `Importing ${collectionName}`,
            async (increment) => {
                for (const documentName in documents) {
                    await db
                        .collection(collectionName)
                        .doc(documentName)
                        .set(documents[documentName]);
                    increment();
                }
            }
        );
    }
}

export async function exportJsonFromFirestore(
    collectionsName: string[],
    jsonPath: string,
    db: Firestore
) {
    await executeOperationWithProgressBar(
        collectionsName.length,
        'Exporting collections',
        async (increment) => {
            fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
            const jsonData: { [collectionName: string]: { [documentName: string]: any } } = {};
            for (const collectionName in collectionsName) {
                const collection = await db.collection(collectionName).get();
                jsonData[collectionName] = {};
                collection.docs.forEach((doc) => {
                    jsonData[collectionName][doc.id] = doc.data();
                });
                increment();
            }
        }
    );
}

export async function deleteCollectionsFromFirestore(collectionsName: string[], db: Firestore) {
    for (const collectionName of collectionsName) {
        await db
            .collection(collectionName)
            .listDocuments()
            .then(async (documents) => {
                await executeOperationWithProgressBar(
                    documents.length,
                    'Deleting',
                    async (increment) => {
                        for (const document of documents) {
                            await document.delete();
                            increment();
                        }
                    }
                );
            });
    }
}

export async function copyCollectionAcrossProjects(
    collectionsName: string[],
    sourceDb: Firestore,
    destinationDb: Firestore
) {
    for (const collectionName of collectionsName) {
        const sourceCollection = sourceDb.collection(collectionName);
        const destinationCollection = destinationDb.collection(collectionName);

        const documents = (await sourceCollection.get()).docs;
        await executeOperationWithProgressBar(
            documents.length,
            `Copying ${collectionName}`,
            async (increment) => {
                for (const document of documents) {
                    await destinationCollection.doc(document.id).set(document.data());
                    increment();
                }
            }
        );
    }
}
