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
import { writeFileSync } from 'fs';

/**
 * Ask user to choose one collection of the project.
 * @param { Firestore } db firestore instance.
 */
export async function selectOneBetweenExistingCollections(db: Firestore): Promise<string> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    return promptListSelection(
        collectionsName,
        'No collection name given, please select one of the followings:'
    );
}

/**
 * Ask user to choose one or more collections of the project.
 * @param { Firestore } db firestore instance.
 */
export async function selectManyBetweenExistingCollections(db: Firestore): Promise<string[]> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    return promptCheckbox(collectionsName, 'Select collection(s) from the followings:');
}

/**
 * Check if the collections exist in the given project.
 * Returns true if all collections exist in the given project.
 * @param { Firestore } db firestore instance.
 * @param { string[] } collections list of collection names.
 */
export async function collectionsExists(db: Firestore, collections: string[]): Promise<boolean> {
    const actualCollections = await db.listCollections();
    const actualCollectionsName = actualCollections.map((collection) => collection.id);
    return collections.every((collectionName) => actualCollectionsName.includes(collectionName));
}

/**
 * Check the validity of given collections, ask the user to choose one or more if no collection given.
 * If allCollections is true and no collection is given, all the collections of the project will be selected.
 * Returns a list of validated collections.
 * @param { Firestore } db firestore instance.
 * @param { boolean } allCollections select all collections of the project.
 * @param { string[] } collectionNames list of the names of the selected collections.
 * @param { string } projectId id of the current project id for logging.
 */
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

/**
 * Import a JSON file to firestore.
 * @param { string } jsonPath path to the json to import.
 * @param { Firestore } db firestore instance.
 */
export async function importJsonToFirestore(jsonPath: string, db: Firestore) {
    // TODO check json file integrity
    const collections: { [collectionName: string]: { [documentName: string]: any } | undefined } =
        parseFile(jsonPath);

    const batch = db.batch();
    for (const collectionName in collections) {
        const documents = collections[collectionName];
        if (!documents) continue;
        for (const documentName in documents) {
            batch.set(db.collection(collectionName).doc(documentName), documents[documentName]);
        }
    }
    return batch.commit();
}

/**
 * Export one or more collections as a JSON.
 * @param { string[] } collectionsName names of the collections to export.
 * @param { string } jsonPath path of the file to save.
 * @param { Firestore } db firestore instance.
 */
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
            for (const collectionName of collectionsName) {
                const collection = await db.collection(collectionName).get();
                jsonData[collectionName] = {};
                collection.docs.forEach((doc) => {
                    jsonData[collectionName][doc.id] = doc.data();
                });
                increment();
            }
            writeFileSync(jsonPath, JSON.stringify(jsonData));
        }
    );
}

/**
 * Delete one or more collections from firestore.
 * @param { string } collectionsName name of the collections to delete.
 * @param { Firestore } db firestore instance.
 */
export async function deleteCollectionsFromFirestore(collectionsName: string[], db: Firestore) {
    const batch = db.batch();
    for (const collectionName of collectionsName) {
        await db
            .collection(collectionName)
            .listDocuments()
            .then(async (documents) => {
                documents.forEach((doc) => {
                    batch.delete(doc);
                });
            });
    }
    return batch.commit();
}

/**
 * Copy one or more collections from a project to another.
 * @param { string[] } collectionsName name of the collections to copy.
 * @param { Firestore } sourceDb firestore instance of the source project.
 * @param { Firestore } destinationDb firestore instance of the destination project.
 */
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
