import { useConfigStore } from '@/features/vault/stores/configStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface Upload {
    id: string
    filename: string
    url: string
    mime_type: string
    size_bytes: number
}

export const uploadsApi = {
    upload: async (file: File): Promise<Upload> => {
        const formData = new FormData()
        formData.append('file', file)

        const token = useConfigStore.getState().authToken

        const response = await fetch(`${API_BASE_URL}/api/uploads`, {
            method: 'POST',
            headers: token
                ? {
                      Authorization: `Bearer ${token}`
                  }
                : {},
            body: formData
        })

        if (!response.ok) {
            throw new Error('Upload failed')
        }

        return response.json()
    },

    getUrl: (upload: Upload): string => {
        return `${API_BASE_URL}${upload.url}`
    }
}
