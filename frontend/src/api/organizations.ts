import apiClient from './client'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'admin' | 'member' | 'guest'
  invited_by: string | null
  joined_at: string
  created_at: string
}

export interface OrganizationMemberWithProfile {
  id: string
  org_id: string
  user_id: string
  role: 'admin' | 'member' | 'guest'
  joined_at: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export interface CreateOrganizationRequest {
  name: string
  slug: string
}

export interface UpdateOrganizationRequest {
  name?: string
  slug?: string
}

export interface AddMemberRequest {
  user_id: string
  role: 'admin' | 'member' | 'guest'
}

export interface UpdateMemberRoleRequest {
  role: 'admin' | 'member' | 'guest'
}

export const organizationsApi = {
  async create(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await apiClient.post<Organization>('/organizations', data)
    return response.data
  },

  async list(): Promise<Organization[]> {
    const response = await apiClient.get<Organization[]>('/organizations')
    return response.data
  },

  async get(orgId: string): Promise<Organization> {
    const response = await apiClient.get<Organization>(`/organizations/${orgId}`)
    return response.data
  },

  async update(orgId: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await apiClient.put<Organization>(`/organizations/${orgId}`, data)
    return response.data
  },

  async delete(orgId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}`)
  },

  async listMembers(orgId: string): Promise<OrganizationMemberWithProfile[]> {
    const response = await apiClient.get<OrganizationMemberWithProfile[]>(`/organizations/${orgId}/members`)
    return response.data
  },

  async addMember(orgId: string, data: AddMemberRequest): Promise<OrganizationMember> {
    const response = await apiClient.post<OrganizationMember>(`/organizations/${orgId}/members`, data)
    return response.data
  },

  async updateMemberRole(orgId: string, memberId: string, data: UpdateMemberRoleRequest): Promise<OrganizationMember> {
    const response = await apiClient.put<OrganizationMember>(`/organizations/${orgId}/members/${memberId}`, data)
    return response.data
  },

  async removeMember(orgId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/members/${memberId}`)
  },
}
