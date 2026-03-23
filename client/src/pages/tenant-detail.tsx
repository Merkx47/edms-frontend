import { MdAccessTime, MdAccountBalanceWallet, MdArrowBack, MdAttachMoney, MdBarChart, MdApartment, MdCalendarToday, MdChevronRight, MdDns, MdEmail, MdExpandMore, MdFlashOn, MdInventory2, MdLayers, MdMemory, MdPeople, MdPerson, MdPublic, MdSettings, MdShield, MdShowChart, MdStorage, MdTrendingDown, MdTrendingUp, MdVisibility, MdWarning } from 'react-icons/md';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { generateVDCHierarchy, flattenVDCTree, generateResources, generateCostTrend } from '@/lib/mock-data';
import type { VDCNode } from '@shared/schema';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

// VDC type styling - using consistent primary/muted theme colors for tree
// Chart colors are separate for better visibility
const vdcConfig = {
  vdc1: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-400 dark:border-green-600', text: 'text-green-700 dark:text-green-400', color: 'bg-green-400' },
  vdc2: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-400', color: 'bg-amber-400' },
  vdc3: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-400 dark:border-cyan-600', text: 'text-cyan-700 dark:text-cyan-400', color: 'bg-cyan-400' },
  vdc4: { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-400 dark:border-pink-600', text: 'text-pink-700 dark:text-pink-400', color: 'bg-pink-400' },
  vdc5: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-400 dark:border-indigo-600', text: 'text-indigo-700 dark:text-indigo-400', color: 'bg-indigo-400' },
};

// Distinct colors for charts - clear differentiation between VDC levels
const chartColors = {
  vdc1: '#DC2626', // Red-600
  vdc2: '#2563EB', // Blue-600
  vdc3: '#16A34A', // Green-600
  vdc4: '#D97706', // Amber-600
  vdc5: '#7C3AED', // Violet-600
};

// Seeded random for deterministic mock data
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Generate mock activity logs for a tenant
function generateActivityLogs(tenantId: string) {
  const tenantIndex = parseInt(tenantId.replace('tenant-', ''), 10) || 1;

  const templates = [
    { action: 'Budget threshold alert at 85% utilization', category: 'budget' as const, severity: 'warning' as const },
    { action: 'New ECS instance ecs-prod-15 deployed', category: 'resource' as const, severity: 'info' as const },
    { action: 'Recommendation implemented: Downsize ECS Instance', category: 'recommendation' as const, severity: 'info' as const },
    { action: 'User admin@company.com modified budget allocation', category: 'access' as const, severity: 'info' as const },
    { action: 'Resource rds-staging-db stopped', category: 'resource' as const, severity: 'warning' as const },
    { action: 'Budget threshold alert at 92% utilization', category: 'budget' as const, severity: 'critical' as const },
    { action: 'New OBS bucket obs-backup-01 created', category: 'resource' as const, severity: 'info' as const },
    { action: 'Recommendation generated: Rightsize RDS instance', category: 'recommendation' as const, severity: 'info' as const },
    { action: 'User viewer@company.com accessed cost report', category: 'access' as const, severity: 'info' as const },
    { action: 'ECS instance ecs-dev-03 auto-scaled to 4 vCPUs', category: 'resource' as const, severity: 'info' as const },
    { action: 'Monthly cost report generated and distributed', category: 'budget' as const, severity: 'info' as const },
    { action: 'Resource cce-cluster-01 scaled up to 5 nodes', category: 'resource' as const, severity: 'warning' as const },
    { action: 'Recommendation dismissed: Delete unused EIP', category: 'recommendation' as const, severity: 'info' as const },
    { action: 'Budget allocation updated for Q2 planning', category: 'budget' as const, severity: 'info' as const },
    { action: 'User editor@company.com modified VDC configuration', category: 'access' as const, severity: 'info' as const },
    { action: 'Resource ecs-staging-07 restarted after failure', category: 'resource' as const, severity: 'critical' as const },
    { action: 'Savings plan recommendation: Reserve ECS instances', category: 'recommendation' as const, severity: 'info' as const },
    { action: 'Anomaly detected: 35% cost spike in OBS service', category: 'budget' as const, severity: 'critical' as const },
  ];

  const logs = [];
  const now = Date.now();

  for (let i = 0; i < 18; i++) {
    const seed = tenantIndex * 37 + i * 13;
    const templateIdx = (seed + i * 7) % templates.length;
    const template = templates[templateIdx];
    // Spread entries over last 14 days
    const hoursAgo = Math.floor(seededRandom(seed + 100) * 14 * 24);
    const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000);

    logs.push({
      id: `log-${tenantId}-${i}`,
      timestamp,
      action: template.action,
      category: template.category,
      severity: template.severity,
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate mock access users for a tenant
function generateAccessUsers(tenantId: string) {
  const tenantIndex = parseInt(tenantId.replace('tenant-', ''), 10) || 1;

  const allUsers = [
    { name: 'Chidi Okonkwo', email: 'chidi.okonkwo@company.com' },
    { name: 'Amaka Eze', email: 'amaka.eze@company.com' },
    { name: 'Oluwaseun Adeyemi', email: 'oluwaseun@company.com' },
    { name: 'Fatima Hassan', email: 'fatima.hassan@company.com' },
    { name: 'Kwame Asante', email: 'kwame.asante@company.com' },
    { name: 'Ngozi Okafor', email: 'ngozi.okafor@company.com' },
    { name: 'Ibrahim Musa', email: 'ibrahim.musa@company.com' },
    { name: 'Aisha Bello', email: 'aisha.bello@company.com' },
  ];

  const roles: Array<'Admin' | 'Editor' | 'Viewer'> = ['Admin', 'Editor', 'Editor', 'Viewer', 'Viewer'];
  const count = 3 + (tenantIndex % 3); // 3-5 users per tenant
  const users = [];

  for (let i = 0; i < count; i++) {
    const userIdx = (tenantIndex * 3 + i * 5) % allUsers.length;
    const user = allUsers[userIdx];
    const roleIdx = i % roles.length;
    const daysAgo = Math.floor(seededRandom(tenantIndex * 17 + i * 31) * 30);

    users.push({
      id: `user-${tenantId}-${i}`,
      name: user.name,
      email: user.email,
      role: roles[roleIdx],
      lastActive: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  return users;
}

// The VDCNode type and generateVDCHierarchy are imported from shared/schema and mock-data

// Use flattenVDCTree imported from mock-data

// VDC Tree Node Component
const levelLabels: Record<string, string> = {
  vdc1: 'L1 - Enterprise',
  vdc2: 'L2 - Division',
  vdc3: 'L3 - Department',
  vdc4: 'L4 - Team',
  vdc5: 'L5 - Project',
};

function VDCTreeNode({
  node,
  depth = 0,
  currency,
}: {
  node: VDCNode;
  depth?: number;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(depth < 3);
  const config = vdcConfig[node.level];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node box — matches guide standard */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "px-4 py-2.5 rounded-lg border-2 bg-background cursor-pointer transition-all min-w-[160px] text-center",
          config.border,
          "hover:shadow-md"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 justify-center">
          <MdLayers className={cn("h-4 w-4 flex-shrink-0", config.text)} />
          <div>
            <p className={cn("text-xs font-semibold", config.text)}>{node.name}</p>
            <p className="text-[10px] text-muted-foreground">{levelLabels[node.level]}</p>
          </div>
          {hasChildren && (
            <MdExpandMore className={cn(
              "h-3.5 w-3.5 transition-transform text-muted-foreground ml-1",
              expanded && "rotate-180"
            )} />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MdAccountBalanceWallet className="h-3 w-3" />
            {formatCompactCurrency(node.spend, currency as any)}
          </span>
          <span className="flex items-center gap-0.5">
            <MdStorage className="h-3 w-3" />
            {node.resources}
          </span>
        </div>
      </motion.div>

      {/* Vertical connector + children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center w-full"
          >
            {/* Vertical line down from parent */}
            <div className="w-0.5 h-5 bg-border" />

            {/* Children row with proper connectors */}
            <div className="relative">
              {/* Horizontal connector bar spanning from first child center to last child center */}
              {node.children!.length > 1 && (
                <div className="absolute top-0 left-0 right-0 flex">
                  <div className="flex-1" />
                  {node.children!.map((_, i) => (
                    <div key={i} className="flex-1 flex justify-center">
                      {i === 0 ? null : null}
                    </div>
                  ))}
                  <div className="flex-1" />
                </div>
              )}

              <table className="border-collapse mx-auto">
                {/* Horizontal bar row */}
                {node.children!.length > 1 && (
                  <tbody>
                    <tr>
                      {node.children!.map((_, i) => (
                        <td key={`bar-${i}`} className="p-0">
                          <div className="flex">
                            <div className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : "bg-border")} />
                            <div className={cn("h-0.5 flex-1", i === node.children!.length - 1 ? "bg-transparent" : "bg-border")} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                )}
                {/* Vertical stubs + child nodes */}
                <tbody>
                  <tr className="align-top">
                    {node.children!.map((child) => (
                      <td key={child.id} className="px-2 pt-0 pb-0 align-top">
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-border" />
                          <VDCTreeNode
                            node={child}
                            depth={depth + 1}
                            currency={currency}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utilization Ring Component
function UtilizationRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function TenantDetail() {
  const [, params] = useRoute('/tenant/:id');
  const [, setLocation] = useLocation();
  const { currency, selectedRegion } = useFinOpsStore();
  const { tenants } = useDataStore();

  const tenantId = params?.id;
  const tenant = tenants.find(t => t.id === tenantId);

  const vdcHierarchy = useMemo(() => {
    if (!tenant) return null;
    return generateVDCHierarchy(tenant.id, tenant.budget);
  }, [tenant]);

  const allVDCs = useMemo(() => {
    if (!vdcHierarchy) return [];
    return flattenVDCTree(vdcHierarchy);
  }, [vdcHierarchy]);

  // Resources for this tenant
  const resources = useMemo(() => {
    if (!tenant) return [];
    return generateResources(tenant.id, selectedRegion);
  }, [tenant, selectedRegion]);

  // Cost trend data
  const costTrend = useMemo(() => {
    if (!tenant) return [];
    return generateCostTrend(tenant.id, 30, selectedRegion);
  }, [tenant, selectedRegion]);

  // Show logs
  const activityLogs = useMemo(() => {
    if (!tenant) return [];
    return generateActivityLogs(tenant.id);
  }, [tenant]);

  // Access users
  const accessUsers = useMemo(() => {
    if (!tenant) return [];
    return generateAccessUsers(tenant.id);
  }, [tenant]);

  // Resource utilization metrics
  const utilizationMetrics = useMemo(() => {
    if (resources.length === 0) return { avgCpu: 0, avgMem: 0, avgDisk: 0, underutilized: 0 };
    const avgCpu = Math.round(resources.reduce((sum, r) => sum + r.cpuUtilization, 0) / resources.length);
    const avgMem = Math.round(resources.reduce((sum, r) => sum + r.memoryUtilization, 0) / resources.length);
    const avgDisk = Math.round(resources.reduce((sum, r) => sum + r.diskUtilization, 0) / resources.length);
    const underutilized = resources.filter(r => r.cpuUtilization < 20).length;
    return { avgCpu, avgMem, avgDisk, underutilized };
  }, [resources]);

  // Resources grouped by VDC
  const resourcesByVDC = useMemo(() => {
    const grouped: Record<string, { vdcName: string; resources: typeof resources }> = {};
    const vdcMap = new Map(allVDCs.map(v => [v.id, v.name]));

    resources.forEach(r => {
      if (!grouped[r.vdcId]) {
        grouped[r.vdcId] = { vdcName: vdcMap.get(r.vdcId) || r.vdcId, resources: [] };
      }
      grouped[r.vdcId].resources.push(r);
    });

    return Object.entries(grouped).sort((a, b) => a[1].vdcName.localeCompare(b[1].vdcName));
  }, [resources, allVDCs]);

  // Collapsible VDC sections state
  const [expandedVDCs, setExpandedVDCs] = useState<Record<string, boolean>>({});

  const toggleVDC = (vdcId: string) => {
    setExpandedVDCs(prev => ({ ...prev, [vdcId]: !prev[vdcId] }));
  };

  // Chart data - only count leaf nodes (VDCs without children) to avoid double-counting
  const spendByLevel = useMemo(() => {
    const levelSpend: Record<string, number> = {};
    // Only count VDCs that don't have children (leaf nodes)
    const leafVDCs = allVDCs.filter(vdc => !vdc.children || vdc.children.length === 0);
    leafVDCs.forEach(vdc => {
      const levelName = vdc.level.toUpperCase().replace('VDC', 'VDC L');
      levelSpend[levelName] = (levelSpend[levelName] || 0) + vdc.spend;
    });
    return Object.entries(levelSpend).map(([name, value]) => ({ name, value }));
  }, [allVDCs]);

  const vdcSpendData = useMemo(() => {
    return allVDCs.slice(0, 8).map(vdc => ({
      name: vdc.name,
      spend: vdc.spend,
      budget: vdc.budget,
      level: vdc.level,
    }));
  }, [allVDCs]);

  if (!tenant || !vdcHierarchy) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6 text-center">
          <MdApartment className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tenant Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested tenant could not be found.</p>
          <Button onClick={() => setLocation('/tenants')}>
            <MdArrowBack className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </ScrollArea>
    );
  }

  const totalSpend = vdcHierarchy.spend;
  const budgetUsage = (totalSpend / tenant.budget) * 100;

  const categoryIcons: Record<string, typeof MdShowChart> = {
    budget: MdAttachMoney,
    resource: MdDns,
    recommendation: MdFlashOn,
    access: MdShield,
  };

  const categoryColors: Record<string, string> = {
    budget: 'text-amber-500 bg-amber-500/10',
    resource: 'text-blue-500 bg-blue-500/10',
    recommendation: 'text-emerald-500 bg-emerald-500/10',
    access: 'text-violet-500 bg-violet-500/10',
  };

  const severityStyles: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-500',
    warning: 'bg-amber-500/10 text-amber-500',
    critical: 'bg-red-500/10 text-red-500',
  };

  const roleStyles: Record<string, string> = {
    Admin: 'bg-red-500/10 text-red-500',
    Editor: 'bg-blue-500/10 text-blue-500',
    Viewer: 'bg-emerald-500/10 text-emerald-500',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation('/tenants')}
          >
            <MdArrowBack className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MdApartment className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{tenant.industry}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MdPublic className="h-3.5 w-3.5" />
                    {tenant.country}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MdEmail className="h-3.5 w-3.5" />
                    {tenant.contactEmail}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant={tenant.status === 'active' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {tenant.status}
            </Badge>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Spend',
              value: formatCurrency(totalSpend, currency as any),
              icon: MdAccountBalanceWallet,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10',
            },
            {
              label: 'Budget Usage',
              value: `${budgetUsage.toFixed(1)}%`,
              icon: MdBarChart,
              color: budgetUsage > 90 ? 'text-red-500' : budgetUsage > 70 ? 'text-amber-500' : 'text-emerald-500',
              bgColor: budgetUsage > 90 ? 'bg-red-500/10' : budgetUsage > 70 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
            },
            {
              label: 'Efficiency Score',
              value: `${tenant.efficiencyScore}%`,
              icon: MdFlashOn,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10',
            },
            {
              label: 'Total VDCs',
              value: allVDCs.length,
              icon: MdLayers,
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature #5: Resource Utilization Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MdMemory className="h-5 w-5 text-primary" />
                Resource Utilization Overview
              </CardTitle>
              <CardDescription>Average utilization across {resources.length} resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around flex-wrap gap-6">
                <UtilizationRing
                  value={utilizationMetrics.avgCpu}
                  label="Avg CPU"
                  color={utilizationMetrics.avgCpu > 80 ? '#DC2626' : utilizationMetrics.avgCpu > 60 ? '#D97706' : '#16A34A'}
                />
                <UtilizationRing
                  value={utilizationMetrics.avgMem}
                  label="Avg Memory"
                  color={utilizationMetrics.avgMem > 80 ? '#DC2626' : utilizationMetrics.avgMem > 60 ? '#D97706' : '#16A34A'}
                />
                <UtilizationRing
                  value={utilizationMetrics.avgDisk}
                  label="Avg Disk"
                  color={utilizationMetrics.avgDisk > 80 ? '#DC2626' : utilizationMetrics.avgDisk > 60 ? '#D97706' : '#16A34A'}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex items-center justify-center w-[88px] h-[88px]">
                    <div className={cn(
                      "p-3 rounded-xl",
                      utilizationMetrics.underutilized > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"
                    )}>
                      <MdWarning className={cn(
                        "h-8 w-8",
                        utilizationMetrics.underutilized > 0 ? "text-amber-500" : "text-emerald-500"
                      )} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold font-mono">{utilizationMetrics.underutilized}</span>
                    <p className="text-xs text-muted-foreground font-medium">Underutilized</p>
                    <p className="text-[10px] text-muted-foreground">(CPU &lt; 20%)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="hierarchy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hierarchy">VDC Hierarchy</TabsTrigger>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdLayers className="h-5 w-5 text-primary" />
                    VDC Organogram
                  </CardTitle>
                  <CardDescription>
                    Hierarchical view of Virtual Data Centers and their spending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mb-6 p-3 rounded-lg bg-muted/30">
                    {Object.entries(vdcConfig).map(([level, config]) => (
                      <div key={level} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded border-2", config.border)} />
                        <span className="text-xs text-muted-foreground font-medium">
                          {levelLabels[level] || level}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* VDC Tree — horizontal layout matching guide standard */}
                  <div className="overflow-x-auto pb-4">
                    <div className="min-w-fit flex justify-center py-4">
                      <VDCTreeNode node={vdcHierarchy} currency={currency} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="spending">
            <div className="space-y-6">
              {/* Feature #4: Cost Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MdTrendingUp className="h-5 w-5 text-primary" />
                      Daily Cost Trend (Last 30 Days)
                    </CardTitle>
                    <CardDescription>Daily spending with forecast</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={costTrend}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="date"
                            className="text-xs"
                            tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            interval={4}
                          />
                          <YAxis
                            className="text-xs"
                            tickFormatter={(v) => formatCompactCurrency(v, currency as any)}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              formatCurrency(value, currency as any),
                              name === 'amount' ? 'Actual' : 'Forecast',
                            ]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#colorAmount)"
                            name="amount"
                          />
                          <Area
                            type="monotone"
                            dataKey="forecast"
                            stroke="#D97706"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="url(#colorForecast)"
                            name="forecast"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend by VDC Level */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardHeader>
                      <CardTitle className="text-base">Spend by VDC Level</CardTitle>
                      <CardDescription>Distribution of costs across VDC levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={spendByLevel}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {spendByLevel.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={Object.values(chartColors)[index % Object.values(chartColors).length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value, currency as any)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* VDC Spend Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardHeader>
                      <CardTitle className="text-base">VDC Spend vs Budget</CardTitle>
                      <CardDescription>Spending comparison across VDCs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vdcSpendData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                              type="number"
                              tickFormatter={(value) => formatCompactCurrency(value, currency as any)}
                              className="text-xs"
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={100}
                              className="text-xs"
                            />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value, currency as any)}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="spend" name="Spend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="budget" name="Budget" fill="#6B7280" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* VDC List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardHeader>
                      <CardTitle className="text-base">All VDCs</CardTitle>
                      <CardDescription>Complete list of Virtual Data Centers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 font-medium">VDC Name</th>
                              <th className="text-left py-3 px-4 font-medium">Level</th>
                              <th className="text-right py-3 px-4 font-medium">Spend</th>
                              <th className="text-right py-3 px-4 font-medium">Budget</th>
                              <th className="text-right py-3 px-4 font-medium">Usage</th>
                              <th className="text-right py-3 px-4 font-medium">Resources</th>
                              <th className="text-right py-3 px-4 font-medium">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allVDCs.map((vdc) => {
                              const config = vdcConfig[vdc.level];
                              const usage = (vdc.spend / vdc.budget) * 100;

                              return (
                                <tr key={vdc.id} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", config.bg, config.border, "border")} />
                                      <span className="font-medium">{vdc.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className={cn("text-xs", config.text)}>
                                      {vdc.level.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono">
                                    {formatCompactCurrency(vdc.spend, currency as any)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                                    {formatCompactCurrency(vdc.budget, currency as any)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "font-medium font-mono inline-block w-[40px]",
                                      usage > 90 ? "text-red-500" :
                                      usage > 70 ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                      {usage.toFixed(0)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono">
                                    {vdc.resources}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                      "inline-flex items-center justify-end gap-1 text-xs font-medium w-[60px]",
                                      vdc.trend >= 0 ? "text-red-500" : "text-emerald-500"
                                    )}>
                                      {vdc.trend >= 0 ? (
                                        <MdTrendingUp className="h-3 w-3 flex-shrink-0" />
                                      ) : (
                                        <MdTrendingDown className="h-3 w-3 flex-shrink-0" />
                                      )}
                                      <span className="font-mono w-[36px] text-right">{Math.abs(vdc.trend).toFixed(1)}%</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Feature #1: Resources Tab */}
          <TabsContent value="resources">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdDns className="h-5 w-5 text-primary" />
                    Tenant Resources
                    <Badge variant="secondary" className="ml-2">{resources.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Resources assigned to this tenant, grouped by VDC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resourcesByVDC.map(([vdcId, group]) => {
                      const isExpanded = expandedVDCs[vdcId] !== false; // Default expanded
                      return (
                        <div key={vdcId} className="border border-border/50 rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                            onClick={() => toggleVDC(vdcId)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <MdExpandMore className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <MdChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <MdLayers className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{group.vdcName}</span>
                              <Badge variant="secondary" className="text-xs">{group.resources.length} resources</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatCompactCurrency(
                                group.resources.reduce((sum, r) => sum + r.monthlyCost, 0),
                                currency as any,
                              )}
                            </span>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border/50 bg-muted/10">
                                        <th className="text-left py-2 px-4 font-medium text-xs">Name</th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">Service</th>
                                        <th className="text-center py-2 px-4 font-medium text-xs">Status</th>
                                        <th className="text-right py-2 px-4 font-medium text-xs">CPU Util</th>
                                        <th className="text-right py-2 px-4 font-medium text-xs">Cost/mo</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.resources.map((resource) => (
                                        <tr key={resource.id} className="border-b border-border/30 hover:bg-muted/20">
                                          <td className="py-2 px-4 font-mono text-xs">{resource.name}</td>
                                          <td className="py-2 px-4">
                                            <Badge variant="outline" className="text-[10px]">{resource.service}</Badge>
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            <Badge
                                              variant="secondary"
                                              className={cn(
                                                "text-[10px]",
                                                resource.status === 'running' && "bg-emerald-500/10 text-emerald-500",
                                                resource.status === 'stopped' && "bg-amber-500/10 text-amber-500",
                                                resource.status === 'error' && "bg-red-500/10 text-red-500",
                                              )}
                                            >
                                              {resource.status}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            <span className={cn(
                                              "font-mono text-xs",
                                              resource.cpuUtilization < 20 ? "text-amber-500" :
                                              resource.cpuUtilization > 80 ? "text-red-500" : "text-foreground"
                                            )}>
                                              {resource.cpuUtilization}%
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-right font-mono text-xs">
                                            {formatCompactCurrency(resource.monthlyCost, currency as any)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Feature #2: Activity Tab */}
          <TabsContent value="activity">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdShowChart className="h-5 w-5 text-primary" />
                    Activity Log
                  </CardTitle>
                  <CardDescription>
                    Recent actions and events for this tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-4">
                      {activityLogs.map((log, index) => {
                        const IconComponent = categoryIcons[log.category] || MdShowChart;
                        const colorClass = categoryColors[log.category] || 'text-muted-foreground bg-muted/30';
                        const [textColor, bgColor] = colorClass.split(' ');

                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-start gap-4 relative"
                          >
                            <div className={cn(
                              "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                              bgColor
                            )}>
                              <IconComponent className={cn("h-4 w-4", textColor)} />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm">{log.action}</p>
                                <Badge
                                  variant="secondary"
                                  className={cn("text-[10px] flex-shrink-0", severityStyles[log.severity])}
                                >
                                  {log.severity}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MdAccessTime className="h-3 w-3" />
                                  {log.timestamp.toLocaleDateString('en', { month: 'short', day: 'numeric' })}{' '}
                                  {log.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Badge variant="outline" className="text-[10px]">{log.category}</Badge>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Feature #3: Access Tab */}
          <TabsContent value="access">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdPeople className="h-5 w-5 text-primary" />
                    Tenant Access
                    <Badge variant="secondary" className="ml-2">{accessUsers.length} users</Badge>
                  </CardTitle>
                  <CardDescription>
                    People with access to this tenant's resources and data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accessUsers.map((user, index) => {
                      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">{initials}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MdEmail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", roleStyles[user.role])}
                            >
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MdAccessTime className="h-3 w-3" />
                              {user.lastActive.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
