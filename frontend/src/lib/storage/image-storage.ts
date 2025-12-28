import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface ImageDB extends DBSchema {
    images: {
        key: string
        value: {
            id: string
            blob: Blob
            mimeType: string
            createdAt: number
        }
    }
}

const DB_NAME = 'just-type-images'
const STORE_NAME = 'images'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ImageDB>> | null = null

function getDB(): Promise<IDBPDatabase<ImageDB>> {
    if (!dbPromise) {
        dbPromise = openDB<ImageDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                }
            }
        })
    }
    return dbPromise
}

export async function storeImage(blob: Blob): Promise<string> {
    const db = await getDB()
    const id = crypto.randomUUID()
    const mimeType = blob.type || 'image/png'

    await db.put(STORE_NAME, {
        id,
        blob,
        mimeType,
        createdAt: Date.now()
    })

    return `local://${id}`
}

export async function getImage(localUrl: string): Promise<string | null> {
    if (!localUrl.startsWith('local://')) {
        return localUrl // not a local URL, return as-is
    }

    const id = localUrl.replace('local://', '')
    const db = await getDB()
    const record = await db.get(STORE_NAME, id)

    if (!record) {
        console.error(`Image not found: ${id}`)
        return null
    }

    // Create object URL from blob
    return URL.createObjectURL(record.blob)
}

export async function deleteImage(localUrl: string): Promise<void> {
    if (!localUrl.startsWith('local://')) {
        return // not a local URL, nothing to delete
    }

    const id = localUrl.replace('local://', '')
    const db = await getDB()
    await db.delete(STORE_NAME, id)
}

export async function getAllImages(): Promise<string[]> {
    const db = await getDB()
    const keys = await db.getAllKeys(STORE_NAME)
    return keys.map(key => `local://${key}`)
}
