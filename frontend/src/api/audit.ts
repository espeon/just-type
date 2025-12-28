import { apiClient } from './client'
import type { DocumentEdit, DocumentSnapshot } from './types'

export interface EditQueryParams {
    limit?: number
    offset?: number
}

export const auditApi = {
    async getDocumentEdits(
        docGuid: string,
        params?: EditQueryParams
    ): Promise<DocumentEdit[]> {
        const query = new URLSearchParams()
        if (params?.limit) query.append('limit', params.limit.toString())
        if (params?.offset) query.append('offset', params.offset.toString())
        const queryString = query.toString() ? `?${query.toString()}` : ''

        return apiClient.get<DocumentEdit[]>(
            `/api/audit/documents/${docGuid}/edits${queryString}`
        )
    },

    async getDocumentSnapshots(
        docGuid: string,
        params?: EditQueryParams
    ): Promise<DocumentSnapshot[]> {
        const query = new URLSearchParams()
        if (params?.limit) query.append('limit', params.limit.toString())
        if (params?.offset) query.append('offset', params.offset.toString())
        const queryString = query.toString() ? `?${query.toString()}` : ''

        return apiClient.get<DocumentSnapshot[]>(
            `/api/audit/documents/${docGuid}/snapshots${queryString}`
        )
    }
}
