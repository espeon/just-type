import * as Y from 'yjs'
import { getImage, deleteImage } from './image-storage'
import { uploadsApi } from '@/api/uploads'

interface ImageReference {
    localUrl: string
    position: string // path in the Yjs doc for debugging
}

/**
 * Find all local:// image URLs in a Yjs document
 */
export function findLocalImages(doc: Y.Doc): ImageReference[] {
    const images: ImageReference[] = []

    const fragment = doc.get('default', Y.XmlFragment) as Y.XmlFragment

    if (!fragment) {
        return images
    }

    // Walk the XML tree and find all image nodes
    const walkXml = (node: Y.XmlElement | Y.XmlFragment, path: string = '') => {
        if (node instanceof Y.XmlElement) {
            if (node.nodeName === 'image') {
                const src = node.getAttribute('src')
                if (src && src.startsWith('local://')) {
                    images.push({
                        localUrl: src,
                        position: path
                    })
                }
            }

            // Recurse into children
            let index = 0
            node.forEach((child) => {
                if (
                    child instanceof Y.XmlElement ||
                    child instanceof Y.XmlFragment
                ) {
                    walkXml(child, `${path}/${node.nodeName}[${index}]`)
                }
                index++
            })
        } else if (node instanceof Y.XmlFragment) {
            // Recurse into fragment children
            let index = 0
            node.forEach((child) => {
                if (
                    child instanceof Y.XmlElement ||
                    child instanceof Y.XmlFragment
                ) {
                    walkXml(child, `${path}/[${index}]`)
                }
                index++
            })
        }
    }

    walkXml(fragment)

    return images
}

/**
 * Upload a local image to the server and return the server URL
 */
async function uploadLocalImageToServer(localUrl: string): Promise<string> {
    // Get the blob from IndexedDB
    const objectUrl = await getImage(localUrl)
    if (!objectUrl) {
        throw new Error(`Image not found in IndexedDB: ${localUrl}`)
    }

    // Fetch the blob from the object URL
    const response = await fetch(objectUrl)
    const blob = await response.blob()

    // Convert to File for upload
    const file = new File([blob], 'image.png', { type: blob.type })

    // Upload to server
    const upload = await uploadsApi.upload(file)
    const serverUrl = uploadsApi.getUrl(upload)

    // Clean up object URL
    URL.revokeObjectURL(objectUrl)

    return serverUrl
}

/**
 * Replace a local:// URL with a server URL in the Yjs document
 */
function replaceImageUrl(
    doc: Y.Doc,
    localUrl: string,
    serverUrl: string
): void {
    doc.transact(() => {
        const fragment = doc.get('default', Y.XmlFragment) as Y.XmlFragment

        if (!fragment) {
            return
        }

        // Walk the XML tree and replace matching src attributes
        const walkAndReplace = (node: Y.XmlElement | Y.XmlFragment) => {
            if (node instanceof Y.XmlElement) {
                if (node.nodeName === 'image') {
                    const src = node.getAttribute('src')
                    if (src === localUrl) {
                        node.setAttribute('src', serverUrl)
                    }
                }

                // Recurse into children
                node.forEach((child) => {
                    if (
                        child instanceof Y.XmlElement ||
                        child instanceof Y.XmlFragment
                    ) {
                        walkAndReplace(child)
                    }
                })
            } else if (node instanceof Y.XmlFragment) {
                // Recurse into fragment children
                node.forEach((child) => {
                    if (
                        child instanceof Y.XmlElement ||
                        child instanceof Y.XmlFragment
                    ) {
                        walkAndReplace(child)
                    }
                })
            }
        }

        walkAndReplace(fragment)
    })
}

/**
 * Sync all local images in a document to the server
 * Returns the number of images synced
 */
export async function syncImagesToServer(doc: Y.Doc): Promise<number> {
    const localImages = findLocalImages(doc)

    if (localImages.length === 0) {
        return 0
    }

    console.log(`Found ${localImages.length} local images to sync`)

    // Upload each image and replace the URL
    let syncedCount = 0
    for (const { localUrl } of localImages) {
        try {
            console.log(`Uploading image: ${localUrl}`)
            const serverUrl = await uploadLocalImageToServer(localUrl)
            console.log(`Uploaded to: ${serverUrl}`)

            // Replace in document
            replaceImageUrl(doc, localUrl, serverUrl)

            // Delete from IndexedDB (no longer needed)
            await deleteImage(localUrl)

            syncedCount++
        } catch (error) {
            console.error(`Failed to sync image ${localUrl}:`, error)
            // Continue with other images
        }
    }

    console.log(`Synced ${syncedCount}/${localImages.length} images`)
    return syncedCount
}
