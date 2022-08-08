import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;
import * as inquirer from 'inquirer';
import * as chalk from 'chalk';

export async function selectOneBetweenExistingCollections(db: Firestore): Promise<string> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    const answer = await inquirer.prompt([
        {
            name: 'selectedCollection',
            type: 'list',
            choices: collectionsName,
            message: 'No collection name given, please select one of the followings:',
        },
    ]);

    return answer.selectedCollection;
}

export async function selectManyBetweenExistingCollections(db: Firestore): Promise<string[]> {
    const collections = await db.listCollections();
    const collectionsName = collections.map((collection) => collection.id);
    const answer = await inquirer.prompt([
        {
            name: 'selectedCollections',
            type: 'checkbox',
            choices: collectionsName,
            message: 'Select collection(s) from the followings:',
        },
    ]);

    return answer.selectedCollections;
}

export async function collectionsExists(db: Firestore, collections: string[]): Promise<boolean> {
    const actualCollections = await db.listCollections();
    const actualCollectionsName = actualCollections.map((collection) => collection.id);
    return collections.every((collectionName) => collectionName in actualCollectionsName);
}

export async function validateCollectionList(
    db: Firestore,
    allCollections: boolean | undefined,
    collectionNames: string[] | undefined,
    projectId: string
): Promise<string[]> {
    if (allCollections) {
        return db.listCollections().then((l) => l.map((c) => c.id));
    } else {
        if (!collectionNames || collectionNames.length <= 0) {
            return selectManyBetweenExistingCollections(db);
        } else {
            if (await collectionsExists(db, collectionNames)) {
                return collectionNames;
            } else {
                console.log(
                    chalk.yellow(
                        `One or more given collection cannot be found in the ${projectId} project`
                    )
                );
                return selectManyBetweenExistingCollections(db);
            }
        }
    }
}
