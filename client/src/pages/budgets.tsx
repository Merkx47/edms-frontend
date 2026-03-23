import { MdAdd, MdApartment, MdCheckCircle, MdChevronRight, MdDelete, MdEdit, MdLayers, MdPublic, MdTrackChanges, MdTrendingUp, MdWarning } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore, type EntityType } from '@/lib/data-store';
import { generateKPIs } from '@/lib/mock-data';
import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// HCS Hierarchy Data Structure
interface VDCNode {
  id: string;
  name: string;
  level: 'vdc1' | 'vdc2' | 'vdc3' | 'vdc4' | 'vdc5';
  children?: VDCNode[];
}

interface TenantNode {
  id: string;
  name: string;
  vdcs: VDCNode[];
}

interface ZoneNode {
  id: string;
  name: string;
  tenants: TenantNode[];
}

// Mock HCS hierarchy data
const hcsHierarchy: ZoneNode[] = [
  {
    id: 'zone-a',
    name: 'Region - Lagos MTN-1',
    tenants: [
      {
        id: 'tenant-1',
        name: 'Dangote Industries',
        vdcs: [
          {
            id: 'vdc-it-division',
            name: 'IT Division',
            level: 'vdc1',
            children: [
              {
                id: 'vdc-dev-team-1',
                name: 'Development Team',
                level: 'vdc2',
                children: [
                  { id: 'vdc-frontend', name: 'Frontend', level: 'vdc3' },
                  { id: 'vdc-backend', name: 'Backend', level: 'vdc3' },
                ],
              },
              { id: 'vdc-ops-team-1', name: 'Operations Team', level: 'vdc2' },
            ],
          },
          {
            id: 'vdc-operations',
            name: 'Operations Division',
            level: 'vdc1',
            children: [
              { id: 'vdc-logistics', name: 'Logistics', level: 'vdc2' },
              { id: 'vdc-manufacturing', name: 'Manufacturing', level: 'vdc2' },
            ],
          },
          { id: 'vdc-finance', name: 'Finance Division', level: 'vdc1' },
        ],
      },
      {
        id: 'tenant-2',
        name: 'MTN Nigeria',
        vdcs: [
          {
            id: 'vdc-mtn-it',
            name: 'IT Division',
            level: 'vdc1',
            children: [
              {
                id: 'vdc-dev-team',
                name: 'Development Team',
                level: 'vdc2',
                children: [
                  { id: 'vdc-mobile-apps', name: 'Mobile Apps', level: 'vdc3' },
                  { id: 'vdc-web-platform', name: 'Web Platform', level: 'vdc3' },
                ],
              },
              { id: 'vdc-network-ops', name: 'Network Operations', level: 'vdc2' },
            ],
          },
          { id: 'vdc-mtn-marketing', name: 'Marketing', level: 'vdc1' },
        ],
      },
    ],
  },
  {
    id: 'zone-b',
    name: 'Region - AF South',
    tenants: [
      {
        id: 'tenant-3',
        name: 'Flutterwave',
        vdcs: [
          {
            id: 'vdc-flutter-engineering',
            name: 'Engineering',
            level: 'vdc1',
            children: [
              { id: 'vdc-payments', name: 'Payments Team', level: 'vdc2' },
              { id: 'vdc-security', name: 'Security Team', level: 'vdc2' },
            ],
          },
          { id: 'vdc-flutter-product', name: 'Product', level: 'vdc1' },
        ],
      },
      {
        id: 'tenant-6',
        name: 'Andela',
        vdcs: [
          { id: 'vdc-andela-talent', name: 'Talent Operations', level: 'vdc1' },
          { id: 'vdc-andela-eng', name: 'Engineering', level: 'vdc1' },
        ],
      },
    ],
  },
  {
    id: 'zone-c',
    name: 'Region - AP Southeast',
    tenants: [
      {
        id: 'tenant-4',
        name: 'Safaricom Kenya',
        vdcs: [
          {
            id: 'vdc-safari-mpesa',
            name: 'M-Pesa Division',
            level: 'vdc1',
            children: [
              { id: 'vdc-mpesa-core', name: 'Core Systems', level: 'vdc2' },
              { id: 'vdc-mpesa-api', name: 'API Services', level: 'vdc2' },
            ],
          },
          { id: 'vdc-safari-network', name: 'Network Division', level: 'vdc1' },
        ],
      },
    ],
  },
  {
    id: 'zone-d',
    name: 'Region - EU West',
    tenants: [
      {
        id: 'tenant-5',
        name: 'Standard Bank SA',
        vdcs: [
          {
            id: 'vdc-bank-digital',
            name: 'Digital Banking',
            level: 'vdc1',
            children: [
              { id: 'vdc-online-banking', name: 'Online Banking', level: 'vdc2' },
              { id: 'vdc-mobile-banking', name: 'Mobile Banking', level: 'vdc2' },
            ],
          },
          { id: 'vdc-bank-core', name: 'Core Systems', level: 'vdc1' },
        ],
      },
      {
        id: 'tenant-7',
        name: 'Jumia Group',
        vdcs: [
          { id: 'vdc-jumia-ecom', name: 'E-Commerce Platform', level: 'vdc1' },
          { id: 'vdc-jumia-logistics', name: 'Logistics', level: 'vdc1' },
        ],
      },
    ],
  },
];

// Helper to get entity type display name
const getEntityTypeLabel = (type: EntityType): string => {
  const labels: Record<EntityType, string> = {
    zone: 'Region',
    tenant: 'Tenant',
    vdc1: 'VDC Level 1',
    vdc2: 'VDC Level 2',
    vdc3: 'VDC Level 3',
    vdc4: 'VDC Level 4',
    vdc5: 'VDC Level 5',
  };
  return labels[type];
};

export default function Budgets() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();
  const { tenants, budgets, addBudget, updateBudget, deleteBudget } = useDataStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<typeof budgets[0] | null>(null);

  // Entity selection state for hierarchical picker
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedVdc1, setSelectedVdc1] = useState<string>('');
  const [selectedVdc2, setSelectedVdc2] = useState<string>('');
  const [selectedVdc3, setSelectedVdc3] = useState<string>('');
  const [entityType, setEntityType] = useState<EntityType>('tenant');

  // Form state
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    alertThreshold: '80',
  });

  // Get available options based on selections
  const availableZones = hcsHierarchy;
  const availableTenants = useMemo(() => {
    if (!selectedZone) return [];
    const zone = hcsHierarchy.find(z => z.id === selectedZone);
    return zone?.tenants || [];
  }, [selectedZone]);

  const availableVdc1 = useMemo(() => {
    if (!selectedTenant) return [];
    const zone = hcsHierarchy.find(z => z.id === selectedZone);
    const tenant = zone?.tenants.find(t => t.id === selectedTenant);
    return tenant?.vdcs || [];
  }, [selectedZone, selectedTenant]);

  const availableVdc2 = useMemo(() => {
    if (!selectedVdc1) return [];
    const zone = hcsHierarchy.find(z => z.id === selectedZone);
    const tenant = zone?.tenants.find(t => t.id === selectedTenant);
    const vdc1 = tenant?.vdcs.find(v => v.id === selectedVdc1);
    return vdc1?.children || [];
  }, [selectedZone, selectedTenant, selectedVdc1]);

  const availableVdc3 = useMemo(() => {
    if (!selectedVdc2) return [];
    const zone = hcsHierarchy.find(z => z.id === selectedZone);
    const tenant = zone?.tenants.find(t => t.id === selectedTenant);
    const vdc1 = tenant?.vdcs.find(v => v.id === selectedVdc1);
    const vdc2 = vdc1?.children?.find(v => v.id === selectedVdc2);
    return vdc2?.children || [];
  }, [selectedZone, selectedTenant, selectedVdc1, selectedVdc2]);

  // Calculate entity path and resolve selections
  const getEntityPath = useCallback((): string => {
    const parts: string[] = [];
    const zone = hcsHierarchy.find(z => z.id === selectedZone);
    if (zone) parts.push(zone.name);
    if (entityType === 'zone') return parts.join(' > ');

    const tenant = zone?.tenants.find(t => t.id === selectedTenant);
    if (tenant) parts.push(tenant.name);
    if (entityType === 'tenant') return parts.join(' > ');

    const vdc1 = tenant?.vdcs.find(v => v.id === selectedVdc1);
    if (vdc1) parts.push(vdc1.name);
    if (entityType === 'vdc1') return parts.join(' > ');

    const vdc2 = vdc1?.children?.find(v => v.id === selectedVdc2);
    if (vdc2) parts.push(vdc2.name);
    if (entityType === 'vdc2') return parts.join(' > ');

    const vdc3 = vdc2?.children?.find(v => v.id === selectedVdc3);
    if (vdc3) parts.push(vdc3.name);
    return parts.join(' > ');
  }, [selectedZone, selectedTenant, selectedVdc1, selectedVdc2, selectedVdc3, entityType]);

  const getSelectedEntityId = useCallback((): string => {
    switch (entityType) {
      case 'zone': return selectedZone;
      case 'tenant': return selectedTenant;
      case 'vdc1': return selectedVdc1;
      case 'vdc2': return selectedVdc2;
      case 'vdc3': return selectedVdc3;
      default: return '';
    }
  }, [entityType, selectedZone, selectedTenant, selectedVdc1, selectedVdc2, selectedVdc3]);

  const getSelectedTenantId = useCallback((): string => {
    // Always return the tenant ID for budget tracking purposes
    return selectedTenant || '';
  }, [selectedTenant]);

  // Determine entity type based on deepest selection
  const updateEntityType = useCallback(() => {
    if (selectedVdc3) setEntityType('vdc3');
    else if (selectedVdc2) setEntityType('vdc2');
    else if (selectedVdc1) setEntityType('vdc1');
    else if (selectedTenant) setEntityType('tenant');
    else if (selectedZone) setEntityType('zone');
  }, [selectedZone, selectedTenant, selectedVdc1, selectedVdc2, selectedVdc3]);

  // Check if entity selection is valid
  const isEntityValid = selectedZone && (entityType === 'zone' || selectedTenant);

  const budgetData = useMemo(() => {
    const relevantBudgets = selectedTenantId === 'all'
      ? budgets
      : budgets.filter(b => b.tenantId === selectedTenantId);

    return relevantBudgets.map(budget => {
      const tenant = tenants.find(t => t.id === budget.tenantId);
      const kpis = generateKPIs(budget.tenantId, 30, selectedRegion);
      const spent = kpis.totalSpend;
      const percentage = (spent / budget.amount) * 100;

      return {
        ...budget,
        tenantName: tenant?.name || 'Unknown Tenant',
        spent,
        percentage,
      };
    });
  }, [selectedTenantId, budgets, tenants]);

  // Also show tenants without explicit budgets (using their default budget)
  const tenantsWithoutBudgets = useMemo(() => {
    if (selectedTenantId !== 'all') return [];
    const budgetTenantIds = budgets.map(b => b.tenantId);
    return tenants.filter(t => !budgetTenantIds.includes(t.id)).map(tenant => {
      const kpis = generateKPIs(tenant.id, 30, selectedRegion);
      return {
        id: `default-${tenant.id}`,
        tenantId: tenant.id,
        name: `${tenant.name} (Default)`,
        amount: tenant.budget,
        period: 'monthly' as const,
        alertThreshold: 80,
        createdAt: '',
        tenantName: tenant.name,
        spent: kpis.totalSpend,
        percentage: kpis.budgetUsed,
        isDefault: true,
      };
    });
  }, [selectedTenantId, tenants, budgets]);

  const allBudgets = [...budgetData, ...tenantsWithoutBudgets];

  const totalBudget = allBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = allBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudget = allBudgets.filter(b => b.percentage > 100).length;
  const atRisk = allBudgets.filter(b => b.percentage > 80 && b.percentage <= 100).length;

  const resetForm = () => {
    setFormData({
      tenantId: '',
      name: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '80',
    });
    setSelectedZone('');
    setSelectedTenant('');
    setSelectedVdc1('');
    setSelectedVdc2('');
    setSelectedVdc3('');
    setEntityType('tenant');
  };

  const handleAddBudget = () => {
    if (!isEntityValid || !formData.name || !formData.amount) return;

    addBudget({
      tenantId: getSelectedTenantId() || selectedZone, // Use zone if no tenant selected
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold) || 80,
      entityType: entityType,
      entityId: getSelectedEntityId(),
      entityPath: getEntityPath(),
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditBudget = () => {
    if (!editingBudget || !formData.name || !formData.amount) return;

    updateBudget(editingBudget.id, {
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold),
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingBudget(null);
  };

  const openEditDialog = (budget: typeof budgetData[0]) => {
    setEditingBudget(budget);
    setFormData({
      tenantId: budget.tenantId,
      name: budget.name,
      amount: budget.amount.toString(),
      period: budget.period,
      alertThreshold: budget.alertThreshold.toString(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="budgets-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdTrackChanges className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Budget Management</h1>
              <p className="text-sm text-muted-foreground">Create and monitor budgets across tenants and VDCs</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <MdAdd className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>
                  Set up a budget for any entity in the HCS hierarchy.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Entity Selection - HCS Organogram */}
                <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MdLayers className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Select Entity (HCS Hierarchy)</Label>
                  </div>

                  {/* Region Selection */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs text-muted-foreground">Region</Label>
                    <div className="col-span-3">
                      <Select
                        value={selectedZone}
                        onValueChange={(v) => {
                          setSelectedZone(v);
                          setSelectedTenant('');
                          setSelectedVdc1('');
                          setSelectedVdc2('');
                          setSelectedVdc3('');
                          setEntityType('zone');
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <MdPublic className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableZones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tenant Selection */}
                  {selectedZone && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-xs text-muted-foreground">Tenant</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <Select
                          value={selectedTenant}
                          onValueChange={(v) => {
                            setSelectedTenant(v);
                            setSelectedVdc1('');
                            setSelectedVdc2('');
                            setSelectedVdc3('');
                            setEntityType('tenant');
                          }}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <MdApartment className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select tenant (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* VDC Level 1 Selection */}
                  {selectedTenant && availableVdc1.length > 0 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-xs text-muted-foreground">VDC L1</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <Select
                          value={selectedVdc1}
                          onValueChange={(v) => {
                            setSelectedVdc1(v);
                            setSelectedVdc2('');
                            setSelectedVdc3('');
                            setEntityType('vdc1');
                          }}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <MdLayers className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select VDC Level 1 (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVdc1.map((vdc) => (
                              <SelectItem key={vdc.id} value={vdc.id}>{vdc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* VDC Level 2 Selection */}
                  {selectedVdc1 && availableVdc2.length > 0 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-xs text-muted-foreground">VDC L2</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <Select
                          value={selectedVdc2}
                          onValueChange={(v) => {
                            setSelectedVdc2(v);
                            setSelectedVdc3('');
                            setEntityType('vdc2');
                          }}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <MdLayers className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select VDC Level 2 (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVdc2.map((vdc) => (
                              <SelectItem key={vdc.id} value={vdc.id}>{vdc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* VDC Level 3 Selection */}
                  {selectedVdc2 && availableVdc3.length > 0 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-xs text-muted-foreground">VDC L3</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <MdChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -ml-2" />
                        <Select
                          value={selectedVdc3}
                          onValueChange={(v) => {
                            setSelectedVdc3(v);
                            setEntityType('vdc3');
                          }}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <MdLayers className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select VDC Level 3 (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVdc3.map((vdc) => (
                              <SelectItem key={vdc.id} value={vdc.id}>{vdc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Selected Path Display */}
                  {selectedZone && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Budget applies to:</span>
                        <Badge variant="secondary" className="text-xs">
                          {getEntityTypeLabel(entityType)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-1 text-primary">{getEntityPath()}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Budget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q1 Cloud Budget"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">Period</Label>
                  <div className="col-span-3">
                    <Select value={formData.period} onValueChange={(v: any) => setFormData({ ...formData, period: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertThreshold" className="text-right">Alert (%)</Label>
                  <div className="col-span-3">
                    <Input
                      id="alertThreshold"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                      value={formData.alertThreshold}
                      onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Alert when spending reaches this % of budget</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddBudget} disabled={!isEntityValid || !formData.name || !formData.amount}>
                  Create Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>
                Update budget settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Budget Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">Amount (USD)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-period" className="text-right">Period</Label>
                <div className="col-span-3">
                  <Select value={formData.period} onValueChange={(v: any) => setFormData({ ...formData, period: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-alertThreshold" className="text-right">Alert (%)</Label>
                <Input
                  id="edit-alertThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingBudget(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditBudget}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: MdTrackChanges, color: 'text-primary', isValue: true },
            { label: 'Total Spent', value: formatCurrency(totalSpent, currency), icon: MdTrendingUp, color: 'text-blue-500', isValue: true },
            { label: 'At Risk', value: atRisk, icon: MdWarning, color: 'text-amber-500' },
            { label: 'Over Budget', value: overBudget, icon: MdWarning, color: 'text-destructive' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={cn(
                        "font-bold font-mono",
                        stat.isValue ? "text-xl" : "text-2xl"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      stat.color === 'text-destructive' ? 'bg-destructive/10' :
                      stat.color === 'text-amber-500' ? 'bg-amber-500/10' :
                      stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                    )}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MdTrackChanges className="h-5 w-5 text-primary" />
                Budget Overview
                <Badge variant="secondary" className="ml-2">{allBudgets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allBudgets.map((budget, index) => (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="p-4 rounded-lg border border-border bg-background/50 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{budget.name}</h3>
                          {'entityType' in budget && budget.entityType && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {getEntityTypeLabel(budget.entityType as EntityType)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {'entityPath' in budget && budget.entityPath
                            ? budget.entityPath
                            : budget.tenantName} • {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-24 flex justify-end">
                          {budget.percentage >= 100 ? (
                            <Badge variant="destructive" className="text-xs">
                              <MdWarning className="h-3 w-3 mr-1" />
                              Over Budget
                            </Badge>
                          ) : budget.percentage >= budget.alertThreshold ? (
                            <Badge className="text-xs bg-amber-500/10 text-amber-500">
                              <MdWarning className="h-3 w-3 mr-1" />
                              At Risk
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                              <MdCheckCircle className="h-3 w-3 mr-1" />
                              On Track
                            </Badge>
                          )}
                        </div>
                        {!('isDefault' in budget) ? (
                          <div className="flex items-center gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(budget)}
                            >
                              <MdEdit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <MdDelete className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this budget? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteBudget(budget.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                          <div className="w-20" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.amount, currency)}
                        </span>
                        <span className={cn(
                          "font-mono font-medium",
                          budget.percentage >= 100 ? "text-destructive" :
                          budget.percentage >= budget.alertThreshold ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className={cn(
                          "h-2",
                          budget.percentage >= 100 && "[&>div]:bg-destructive",
                          budget.percentage >= budget.alertThreshold && budget.percentage < 100 && "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>
                  </motion.div>
                ))}

                {allBudgets.length === 0 && (
                  <div className="text-center py-12">
                    <MdTrackChanges className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Budgets Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a budget to start tracking your cloud spending.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <MdAdd className="h-4 w-4 mr-2" />
                      Create Budget
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
