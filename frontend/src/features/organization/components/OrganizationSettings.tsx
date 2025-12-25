import { useState, useEffect } from 'react'
import { organizationsApi, Organization, OrganizationMemberWithProfile } from '@/api/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function OrganizationSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [newMemberUserId, setNewMemberUserId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'guest'>('member')

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      loadMembers(selectedOrg.id)
    }
  }, [selectedOrg])

  async function loadOrganizations() {
    try {
      const orgs = await organizationsApi.list()
      setOrganizations(orgs)
      if (orgs.length > 0 && !selectedOrg) {
        setSelectedOrg(orgs[0])
      }
    } catch (error) {
      console.error('failed to load organizations:', error)
    }
  }

  async function loadMembers(orgId: string) {
    try {
      const memberList = await organizationsApi.listMembers(orgId)
      setMembers(memberList)
    } catch (error) {
      console.error('failed to load members:', error)
    }
  }

  async function handleCreateOrg() {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return

    setLoading(true)
    try {
      const org = await organizationsApi.create({
        name: newOrgName,
        slug: newOrgSlug,
      })
      setOrganizations([...organizations, org])
      setSelectedOrg(org)
      setCreateDialogOpen(false)
      setNewOrgName('')
      setNewOrgSlug('')
    } catch (error) {
      console.error('failed to create organization:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember() {
    if (!selectedOrg || !newMemberUserId.trim()) return

    setLoading(true)
    try {
      await organizationsApi.addMember(selectedOrg.id, {
        user_id: newMemberUserId,
        role: newMemberRole,
      })
      await loadMembers(selectedOrg.id)
      setAddMemberDialogOpen(false)
      setNewMemberUserId('')
      setNewMemberRole('member')
    } catch (error) {
      console.error('failed to add member:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedOrg) return

    try {
      await organizationsApi.removeMember(selectedOrg.id, memberId)
      await loadMembers(selectedOrg.id)
    } catch (error) {
      console.error('failed to remove member:', error)
    }
  }

  async function handleUpdateRole(memberId: string, role: 'admin' | 'member' | 'guest') {
    if (!selectedOrg) return

    try {
      await organizationsApi.updateMemberRole(selectedOrg.id, memberId, { role })
      await loadMembers(selectedOrg.id)
    } catch (error) {
      console.error('failed to update member role:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">organizations</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>create organization</Button>
      </div>

      {organizations.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          no organizations yet. create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>select organization</Label>
            <Select
              value={selectedOrg?.id}
              onValueChange={(id) => {
                const org = organizations.find((o) => o.id === id)
                setSelectedOrg(org || null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && (
            <div className="space-y-4 border rounded-lg p-4">
              <div>
                <div className="text-sm font-medium mb-1">name</div>
                <div className="text-sm text-muted-foreground">{selectedOrg.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">slug</div>
                <div className="text-sm text-muted-foreground">{selectedOrg.slug}</div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">members</h3>
                  <Button size="sm" onClick={() => setAddMemberDialogOpen(true)}>
                    add member
                  </Button>
                </div>

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {member.display_name || member.username || 'unnamed user'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.username && `@${member.username}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(role) =>
                            handleUpdateRole(member.id, role as 'admin' | 'member' | 'guest')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="member">member</SelectItem>
                            <SelectItem value="guest">guest</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>create organization</DialogTitle>
            <DialogDescription>
              create a new organization to share vaults with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">organization name</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="acme corp"
              />
            </div>
            <div>
              <Label htmlFor="org-slug">slug</Label>
              <Input
                id="org-slug"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="acme-corp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={loading}>
              create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>add member</DialogTitle>
            <DialogDescription>
              add a new member to {selectedOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-id">user id</Label>
              <Input
                id="user-id"
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                placeholder="user uuid"
              />
            </div>
            <div>
              <Label htmlFor="role">role</Label>
              <Select
                value={newMemberRole}
                onValueChange={(role) => setNewMemberRole(role as 'admin' | 'member' | 'guest')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="guest">guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              cancel
            </Button>
            <Button onClick={handleAddMember} disabled={loading}>
              add member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
