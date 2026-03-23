import { MdApartment, MdCheck, MdCloud, MdDns, MdExpandMore, MdInfoOutline, MdInventory2, MdLan, MdPersonAdd, MdStorage } from 'react-icons/md';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TenantBuildingIcon = ({ className }: { className?: string }) => <MdApartment className={className} />;
import { motion, AnimatePresence } from 'framer-motion';

// Type configuration matching the guide
const typeConfig = {
  root: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-400 dark:border-red-600', text: 'text-red-700 dark:text-red-400', icon: MdCloud, ring: 'ring-red-500' },
  zone: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-400 dark:border-blue-600', text: 'text-blue-700 dark:text-blue-400', icon: MdDns, ring: 'ring-blue-500' },
  tenant: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-400 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-400', icon: TenantBuildingIcon, ring: 'ring-purple-500' },
  vdc1: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-400 dark:border-green-600', text: 'text-green-700 dark:text-green-400', icon: MdLan, ring: 'ring-green-500' },
  vdc2: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-400', icon: MdLan, ring: 'ring-amber-500' },
  vdc3: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-400 dark:border-cyan-600', text: 'text-cyan-700 dark:text-cyan-400', icon: MdLan, ring: 'ring-cyan-500' },
  vdc4: { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-400 dark:border-pink-600', text: 'text-pink-700 dark:text-pink-400', icon: MdLan, ring: 'ring-pink-500' },
  vdc5: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-400 dark:border-indigo-600', text: 'text-indigo-700 dark:text-indigo-400', icon: MdInventory2, ring: 'ring-indigo-500' },
  resource: { bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-400 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-400', icon: MdStorage, ring: 'ring-slate-500' },
} as const;

type NodeType = keyof typeof typeConfig;

// Hierarchy node structure
interface HierarchyNode {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  children?: HierarchyNode[];
}

// Full hierarchy data structure
const hierarchyData: HierarchyNode = {
  id: 'root',
  label: 'ROOT (ManageOne)',
  sublabel: 'Cloud Platform Admin',
  type: 'root',
  children: [
    {
      id: 'zone-lagos',
      label: 'Region - Lagos MTN-1',
      sublabel: 'Region',
      type: 'zone',
      children: [
        {
          id: 'bank-corp',
          label: 'Bank Corp',
          sublabel: 'Financial Services',
          type: 'tenant',
          children: [
            {
              id: 'bank-vdc1',
              label: 'VDC L1',
              sublabel: 'Enterprise',
              type: 'vdc1',
              children: [
                {
                  id: 'bank-vdc2',
                  label: 'VDC L2',
                  sublabel: 'IT Division',
                  type: 'vdc2',
                  children: [
                    { id: 'bank-vdc3', label: 'VDC L3', sublabel: 'Infrastructure', type: 'vdc3' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'telco-inc',
          label: 'Telco Inc',
          sublabel: 'Telecommunications',
          type: 'tenant',
          children: [
            {
              id: 'telco-vdc1',
              label: 'VDC L1',
              sublabel: 'Operations',
              type: 'vdc1',
              children: [
                { id: 'telco-vdc2', label: 'VDC L2', sublabel: 'Network Ops', type: 'vdc2' },
              ],
            },
          ],
        },
        {
          id: 'gov-agency',
          label: 'Gov Agency',
          sublabel: 'Government',
          type: 'tenant',
          children: [
            { id: 'gov-vdc1', label: 'VDC L1', sublabel: 'Services', type: 'vdc1' },
          ],
        },
      ],
    },
    {
      id: 'zone-abuja',
      label: 'Region - AF South',
      sublabel: 'Region',
      type: 'zone',
      children: [
        {
          id: 'retail-co',
          label: 'Retail Co',
          sublabel: 'E-Commerce',
          type: 'tenant',
          children: [
            {
              id: 'retail-vdc1',
              label: 'VDC L1',
              sublabel: 'Platform',
              type: 'vdc1',
              children: [
                { id: 'retail-vdc2', label: 'VDC L2', sublabel: 'Engineering', type: 'vdc2' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Get the path (breadcrumb) to a node
function getNodePath(nodeId: string, node: HierarchyNode = hierarchyData, path: HierarchyNode[] = []): HierarchyNode[] | null {
  if (node.id === nodeId) return [...path, node];
  if (!node.children) return null;
  for (const child of node.children) {
    const result = getNodePath(nodeId, child, [...path, node]);
    if (result) return result;
  }
  return null;
}

// Get level name for display
function getLevelName(type: NodeType): string {
  switch (type) {
    case 'root': return 'Root Level';
    case 'zone': return 'Region Level';
    case 'tenant': return 'Tenant Level';
    case 'vdc1': return 'VDC Level 1';
    case 'vdc2': return 'VDC Level 2';
    case 'vdc3': return 'VDC Level 3';
    case 'vdc4': return 'VDC Level 4';
    case 'vdc5': return 'VDC Level 5';
    default: return 'Unknown';
  }
}

// Get access description
function getAccessDescription(type: NodeType): string {
  switch (type) {
    case 'root': return 'Full platform access - all zones, tenants, and resources';
    case 'zone': return 'Region-level access - all tenants and resources in this region';
    case 'tenant': return 'Tenant-level access - all VDCs and resources in this organization';
    case 'vdc1': return 'VDC L1 access - enterprise-wide view and all child VDCs';
    case 'vdc2': return 'VDC L2 access - division-level view and child VDCs';
    case 'vdc3': return 'VDC L3 access - department-level view and child VDCs';
    case 'vdc4': return 'VDC L4 access - team-level view and child VDCs';
    case 'vdc5': return 'VDC L5 access - project-level view only';
    default: return '';
  }
}

// Interactive Organogram Node
function SelectableNode({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node: HierarchyNode;
  selected: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = typeConfig[node.type];
  const Icon = config.icon;
  const isSelected = selected === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer transition-all duration-200",
          "min-w-[140px]",
          config.border,
          isSelected
            ? cn("ring-2 ring-offset-1", config.ring, config.bg)
            : "bg-background hover:bg-muted/50"
        )}
        onClick={() => onSelect(node.id)}
      >
        <Icon className={cn("h-3 w-3 flex-shrink-0", config.text)} />
        <div className="flex-1 min-w-0">
          <p className={cn("text-[11px] font-medium truncate", config.text)}>{node.label}</p>
          {node.sublabel && <p className="text-[9px] text-muted-foreground truncate">{node.sublabel}</p>}
        </div>
        {isSelected && (
          <MdCheck className="h-3 w-3 text-primary flex-shrink-0" />
        )}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            <MdExpandMore className={cn(
              "h-2.5 w-2.5 transition-transform text-muted-foreground",
              expanded && "rotate-180"
            )} />
          </button>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 ml-4 space-y-2 pl-3 border-l-2 border-dashed border-muted-foreground/30"
          >
            {node.children?.map((child) => (
              <SelectableNode
                key={child.id}
                node={child}
                selected={selected}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// User form state
interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessLevel: string | null;
}

export function UserOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    accessLevel: null,
  });
  const [users, setUsers] = useState([
    { id: 1, name: 'Chidi Okonkwo', email: 'chidi@company.com', role: 'Admin', access: 'Bank Corp', accessType: 'tenant' as NodeType },
    { id: 2, name: 'Adaeze Nnamdi', email: 'adaeze@company.com', role: 'User', access: 'VDC L2 - IT Division', accessType: 'vdc2' as NodeType },
    { id: 3, name: 'Emeka Eze', email: 'emeka@company.com', role: 'Viewer', access: 'Region - Lagos MTN-1', accessType: 'zone' as NodeType },
  ]);

  const selectedPath = selectedNode ? getNodePath(selectedNode) : null;
  const selectedNodeData = selectedPath ? selectedPath[selectedPath.length - 1] : null;

  const handleCreateUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !selectedNode) return;

    const newUserEntry = {
      id: users.length + 1,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      role: newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1),
      access: selectedNodeData?.label || '',
      accessType: selectedNodeData?.type || 'vdc1' as NodeType,
    };

    setUsers([...users, newUserEntry]);
    setNewUser({ firstName: '', lastName: '', email: '', role: 'user', accessLevel: null });
    setSelectedNode(null);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Person button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">User Access Management</h3>
          <p className="text-sm text-muted-foreground">
            Assign users to specific levels in the cloud hierarchy
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <MdPersonAdd className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Fill in user details and click on the hierarchy to assign access level
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="grid grid-cols-2 gap-8 mt-4">
                {/* User Form */}
                <div className="space-y-4 px-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        placeholder="Chidi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        placeholder="Okonkwo"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="chidi@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Access Level */}
                  {selectedNodeData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg border border-primary/50 bg-primary/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MdCheck className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-xs">Selected Access Level</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            const Icon = typeConfig[selectedNodeData.type].icon;
                            return <Icon className={cn("h-3.5 w-3.5", typeConfig[selectedNodeData.type].text)} />;
                          })()}
                          <span className="font-medium text-sm">{selectedNodeData.label}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {getLevelName(selectedNodeData.type)}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {getAccessDescription(selectedNodeData.type)}
                        </p>
                        {/* Breadcrumb path */}
                        {selectedPath && selectedPath.length > 1 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1.5 pt-1.5 border-t border-border/50">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mr-1">Path:</span>
                            {selectedPath.map((p, i) => (
                              <span key={p.id} className="flex items-center gap-0.5">
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                  {p.label.split(' ')[0]}
                                </Badge>
                                {i < selectedPath.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Interactive Organogram */}
                <div className="space-y-2 px-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Click to Select Access Level</Label>
                    <MdInfoOutline className="h-3 w-3 text-muted-foreground" />
                  </div>

                  {/* Hierarchy Legend */}
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/30 text-[9px]">
                    <span className="text-muted-foreground font-medium">Hierarchy:</span>
                    <span className="text-red-600 dark:text-red-400">Root</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-blue-600 dark:text-blue-400">Region</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-purple-600 dark:text-purple-400">Tenant</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-green-600 dark:text-green-400">VDC L1-L5</span>
                  </div>

                  <div className="border rounded-lg p-3 bg-muted/10 max-h-[300px] overflow-y-auto">
                    <SelectableNode
                      node={hierarchyData}
                      selected={selectedNode}
                      onSelect={setSelectedNode}
                    />
                  </div>

                  {/* Help text */}
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      <strong>Tip:</strong> Users can only access the selected level and all levels below it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={!newUser.firstName || !newUser.lastName || !newUser.email || !selectedNode}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Users List */}
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Existing Users</CardTitle>
          <CardDescription>Users and their access levels in the hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => {
              const config = typeConfig[user.accessType];
              const Icon = config.icon;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{user.role}</Badge>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
                      config.bg, config.border
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", config.text)} />
                      <span className={cn("text-xs font-medium", config.text)}>{user.access}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
