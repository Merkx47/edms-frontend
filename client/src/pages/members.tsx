import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { MdPerson, MdAdd, MdSearch, MdEdit, MdDelete, MdAdminPanelSettings } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { departments } from '@shared/schema';
import type { UserRole, Department } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  director: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  officer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const roles: UserRole[] = ['admin', 'director', 'manager', 'officer', 'viewer'];

const rolePermissions: Record<UserRole, string[]> = {
  admin: ['Full system access', 'Manage members', 'All document actions', 'System settings', 'Audit logs'],
  director: ['Approve documents', 'Manage workflows', 'View audit logs', 'Download documents'],
  manager: ['Upload documents', 'Create workflows', 'Approve team documents', 'View reports'],
  officer: ['Upload documents', 'View documents', 'Comment on workflows'],
  viewer: ['View documents', 'Download (watermarked)'],
};

export default function Members() {
  const { staff, addStaffMember, updateStaffMember, removeStaffMember, currentUser } = useDataStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<typeof staff[0] | null>(null);

  // Add form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('officer');
  const [newDept, setNewDept] = useState<Department>('Ministry of Finance');

  const resetForm = () => { setNewName(''); setNewEmail(''); setNewRole('officer'); setNewDept('Ministry of Finance'); };

  const handleAdd = () => {
    if (!newName || !newEmail) return;
    addStaffMember({ fullName: newName, email: newEmail, role: newRole, department: newDept, isActive: true });
    setAddOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editMember) return;
    updateStaffMember(editMember.id, { fullName: newName || editMember.fullName, email: newEmail || editMember.email, role: newRole, department: newDept });
    setEditMember(null);
  };

  const openEdit = (m: typeof staff[0]) => {
    setEditMember(m);
    setNewName(m.fullName); setNewEmail(m.email); setNewRole(m.role); setNewDept(m.department);
  };

  const isAdmin = currentUser?.role === 'admin';

  const filtered = staff.filter(m => {
    const matchSearch = !search || m.fullName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members & Directors</h1>
          <p className="text-sm text-muted-foreground">Manage staff, roles, and access permissions</p>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><MdAdd className="h-4 w-4 mr-2" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Full Name <span className="text-destructive">*</span></Label><Input className="mt-1" placeholder="e.g. Ngozi Okafor" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><Label>Email Address <span className="text-destructive">*</span></Label><Input className="mt-1" type="email" placeholder="name@gov.ng" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                <div>
                  <Label>Role <span className="text-destructive">*</span></Label>
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                  </Select>
                  {newRole && (
                    <ul className="mt-2 space-y-0.5">
                      {rolePermissions[newRole].map(p => (
                        <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <Label>Department <span className="text-destructive">*</span></Label>
                  <Select value={newDept} onValueChange={(v: any) => setNewDept(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required fields</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!newName || !newEmail}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* RBAC Summary */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MdAdminPanelSettings className="h-4 w-4" /> Role Permissions (RBAC)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {roles.map(role => (
              <div key={role} className="rounded-lg border border-border p-3 space-y-2">
                <Badge className={`capitalize text-xs ${roleColors[role]}`}>{role}</Badge>
                <ul className="space-y-0.5">
                  {rolePermissions[role].map(p => (
                    <li key={p} className="text-[10px] text-muted-foreground flex items-start gap-1">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-1" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} member(s)</p>

      {/* Members list */}
      <div className="space-y-2">
        {filtered.map(member => (
          <Card key={member.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MdPerson className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{member.fullName}</p>
                    <Badge className={`text-[10px] capitalize ${roleColors[member.role]}`}>{member.role}</Badge>
                    {!member.isActive && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.department}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={member.isActive}
                      onCheckedChange={(v) => {
                        updateStaffMember(member.id, { isActive: v });
                        toast({ title: v ? 'Member Activated' : 'Member Deactivated', description: `${member.fullName} access has been ${v ? 'enabled' : 'disabled'}.` });
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(member)}>
                      <MdEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (member.id === currentUser?.id) { toast({ title: 'Cannot remove yourself', variant: 'destructive' }); return; }
                        removeStaffMember(member.id);
                      }}>
                      <MdDelete className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editMember} onOpenChange={(o) => { if (!o) setEditMember(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Full Name <span className="text-destructive">*</span></Label><Input className="mt-1" value={newName} onChange={e => setNewName(e.target.value)} /></div>
            <div><Label>Email Address <span className="text-destructive">*</span></Label><Input className="mt-1" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
            <div>
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department <span className="text-destructive">*</span></Label>
              <Select value={newDept} onValueChange={(v: any) => setNewDept(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
