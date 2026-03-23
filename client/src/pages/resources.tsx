import { MdAccessTime, MdAccountBalanceWallet, MdAccountTree, MdApartment, MdCalendarToday, MdCancel, MdCheckCircle, MdChevronLeft, MdChevronRight, MdClose, MdDns, MdDownload, MdExpandMore, MdFilterList, MdFirstPage, MdFlashOn, MdGridView, MdLabel, MdLastPage, MdLayers, MdLink, MdList, MdMemory, MdRefresh, MdSearch, MdStorage, MdViewSidebar, MdWarning } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import {
  generateResources,
  generateAllVDCHierarchies,
  flattenVDCTree,
  getAllVDCIds,
  mockTenants,
} from '@/lib/mock-data';
import {
  serviceInfo,
  regionNames,
  serviceDependencies,
  type HuaweiService,
  type Resource,
  type VDCNode,
} from '@shared/schema';
import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// =====================================================
// CONSTANTS & HELPERS
// =====================================================

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

type ViewMode = 'table' | 'thumbnail';

const vdcLevelColors: Record<string, string> = {
  vdc1: 'border-l-blue-500',
  vdc2: 'border-l-indigo-500',
  vdc3: 'border-l-purple-500',
  vdc4: 'border-l-amber-500',
  vdc5: 'border-l-emerald-500',
};

const vdcLevelBgColors: Record<string, string> = {
  vdc1: 'bg-blue-500',
  vdc2: 'bg-indigo-500',
  vdc3: 'bg-violet-500',
  vdc4: 'bg-amber-500',
  vdc5: 'bg-emerald-500',
};

const vdcLevelBadgeColors: Record<string, string> = {
  vdc1: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  vdc2: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  vdc3: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  vdc4: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  vdc5: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const vdcLevelLabels: Record<string, string> = {
  vdc1: 'L1',
  vdc2: 'L2',
  vdc3: 'L3',
  vdc4: 'L4',
  vdc5: 'L5',
};

const vdcLevelConfig = {
  vdc1: { text: 'text-blue-600 dark:text-blue-400', label: 'L1 - Enterprise' },
  vdc2: { text: 'text-indigo-600 dark:text-indigo-400', label: 'L2 - Division' },
  vdc3: { text: 'text-purple-600 dark:text-purple-400', label: 'L3 - Department' },
  vdc4: { text: 'text-amber-600 dark:text-amber-400', label: 'L4 - Team' },
  vdc5: { text: 'text-emerald-600 dark:text-emerald-400', label: 'L5 - Project' },
};

const getUtilizationBadge = (value: number) => {
  if (value < 20) return { label: 'Low', color: 'text-destructive bg-destructive/10' };
  if (value < 40) return { label: 'Below Avg', color: 'text-orange-500 bg-orange-500/10' };
  if (value < 60) return { label: 'Moderate', color: 'text-amber-500 bg-amber-500/10' };
  if (value < 80) return { label: 'Good', color: 'text-emerald-400 bg-emerald-400/10' };
  return { label: 'Optimal', color: 'text-emerald-500 bg-emerald-500/10' };
};

const isResourceIdle = (r: Resource) => r.cpuUtilization < 20 && r.memoryUtilization < 20;

function formatAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const statusDot = (status: Resource['status']) => {
  switch (status) {
    case 'running':
      return 'bg-emerald-500';
    case 'stopped':
      return 'bg-gray-400';
    case 'error':
      return 'bg-red-500';
  }
};

// =====================================================
// VDC TREE SIDEBAR COMPONENT (COLLAPSED BY DEFAULT)
// =====================================================

function VDCTreeNode({
  node,
  depth = 0,
  currency,
  selectedVDCId,
  onSelectVDC,
  resourceCountMap,
  costMap,
  expandedNodes,
  onToggleExpand,
}: {
  node: VDCNode;
  depth?: number;
  currency: string;
  selectedVDCId: string | null;
  onSelectVDC: (vdcId: string | null) => void;
  resourceCountMap: Map<string, number>;
  costMap: Map<string, number>;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}) {
  const config = vdcLevelConfig[node.level];
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedVDCId === node.id;
  const expanded = expandedNodes.has(node.id);

  const allIds = useMemo(() => getAllVDCIds(node), [node]);
  const totalResources = allIds.reduce((sum, id) => sum + (resourceCountMap.get(id) || 0), 0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectVDC(isSelected ? null : node.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) onToggleExpand(node.id);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs group flex items-center gap-1',
          isSelected
            ? 'bg-primary/8 text-primary font-semibold'
            : 'hover:bg-muted/50 text-foreground/80',
        )}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-muted rounded flex-shrink-0 transition-colors"
          >
            <MdExpandMore
              className={cn(
                'h-3 w-3 transition-transform duration-150 text-muted-foreground',
                !expanded && '-rotate-90',
              )}
            />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <MdLayers className={cn('h-3 w-3 flex-shrink-0', config.text)} />
        <span className="truncate flex-1">{node.name}</span>
        <span className={cn('text-[9px] font-medium flex-shrink-0 opacity-60', config.text)}>
          {vdcLevelLabels[node.level]}
        </span>
        {totalResources > 0 && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 min-w-[20px] justify-center font-mono flex-shrink-0"
          >
            {totalResources}
          </Badge>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="ml-3 pl-3 border-l border-dotted border-muted-foreground/20"
          >
            {node.children?.map((child) => (
              <VDCTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                currency={currency}
                selectedVDCId={selectedVDCId}
                onSelectVDC={onSelectVDC}
                resourceCountMap={resourceCountMap}
                costMap={costMap}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// RESOURCE DETAIL DIALOG (kept from original)
// =====================================================

function ResourceDetailDialog({
  resource,
  open,
  onOpenChange,
  currency,
  allResources,
  vdcName,
  tenantName,
}: {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  allResources: Resource[];
  vdcName: string;
  tenantName: string;
}) {
  if (!resource) return null;

  const utilizationData = [
    { name: 'CPU', value: resource.cpuUtilization, color: '#3b82f6' },
    { name: 'Memory', value: resource.memoryUtilization, color: '#8b5cf6' },
    { name: 'Disk', value: resource.diskUtilization, color: '#f59e0b' },
    { name: 'Network', value: resource.networkUtilization, color: '#10b981' },
  ];

  const depServices = serviceDependencies[resource.service] || [];
  const dependencies = depServices.map((depService) => {
    const match = allResources.find(
      (r) => r.service === depService && r.tenantId === resource.tenantId && r.id !== resource.id,
    );
    return {
      service: depService,
      name: match?.name || `${depService.toLowerCase()}-shared-01`,
      id: match?.id || `dep-${depService.toLowerCase()}`,
      status: match?.status || ('running' as const),
    };
  });

  const idle = isResourceIdle(resource);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MdDns className="h-5 w-5 text-primary" />
            {resource.name}
            {idle && (
              <Badge variant="destructive" className="ml-2 text-xs">
                IDLE
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {serviceInfo[resource.service]?.name} - {resource.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <MdLabel className="h-3.5 w-3.5" /> Metadata
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${serviceInfo[resource.service]?.color}20`,
                      color: serviceInfo[resource.service]?.color,
                    }}
                  >
                    {resource.service}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region</span>
                  <span>{regionNames[resource.region] || resource.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-mono text-xs">{resource.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5">
                    {resource.status === 'running' ? (
                      <MdCheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : resource.status === 'error' ? (
                      <MdWarning className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <MdCancel className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="capitalize">{resource.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <MdApartment className="h-3.5 w-3.5" /> Ownership
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant</span>
                  <span>{tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VDC</span>
                  <span>{vdcName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(resource.monthlyCost, currency as any)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <MdLabel className="h-3.5 w-3.5" /> Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lifecycle */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <MdAccessTime className="h-3.5 w-3.5" /> Lifecycle
            </h4>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground mr-2">Created:</span>
                <span>{formatDate(resource.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground mr-2">Age:</span>
                <span className="font-medium">{formatAge(resource.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Utilization Charts */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <MdFlashOn className="h-3.5 w-3.5" /> Utilization
            </h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={70} className="text-xs" />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value}%`, 'Utilization']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {utilizationData.map((u) => {
                const badge = getUtilizationBadge(u.value);
                return (
                  <div key={u.name} className="text-center">
                    <p className="text-xs text-muted-foreground">{u.name}</p>
                    <p className={cn('text-lg font-mono font-bold', badge.color.split(' ')[0])}>
                      {u.value}%
                    </p>
                    <Badge className={cn('text-[10px]', badge.color)}>{badge.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MdLink className="h-3.5 w-3.5" /> Infrastructure Dependencies
              </h4>
              <div className="space-y-2">
                {dependencies.map((dep, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${serviceInfo[dep.service]?.color}20`,
                          color: serviceInfo[dep.service]?.color,
                        }}
                      >
                        {dep.service}
                      </Badge>
                      <span className="text-sm font-medium">{dep.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {dep.status === 'running' ? (
                        <MdCheckCircle className="h-3 w-3 text-emerald-500" />
                      ) : dep.status === 'error' ? (
                        <MdWarning className="h-3 w-3 text-red-500" />
                      ) : (
                        <MdCancel className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="capitalize text-muted-foreground">{dep.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// THUMBNAIL VIEW - VDC HIERARCHY CARDS
// =====================================================

interface VDCSummary {
  vdc: VDCNode;
  resourceCount: number;
  totalCost: number;
  running: number;
  stopped: number;
  errored: number;
  serviceDistribution: { service: HuaweiService; count: number }[];
  childCount: number;
  breadcrumb: string;
  tenantName: string;
}

function VDCSummaryCard({
  summary,
  currency,
  onClick,
  depth = 0,
}: {
  summary: VDCSummary;
  currency: string;
  onClick: () => void;
  depth?: number;
}) {
  const topServices = summary.serviceDistribution.slice(0, 3);
  const levelConf = vdcLevelConfig[summary.vdc.level as keyof typeof vdcLevelConfig];
  const levelBadge = vdcLevelBadgeColors[summary.vdc.level];
  const levelBg = vdcLevelBgColors[summary.vdc.level];
  const maxResources = 200; // for progress bar normalization
  const utilizationPct = Math.min((summary.resourceCount / maxResources) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * depth }}
    >
      <div
        className="p-4 rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        onClick={onClick}
      >
        {/* Top: Icon + Name + Level */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
              `${levelBg}/10`,
            )}>
              <MdLayers className={cn('h-5 w-5', levelConf?.text)} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{summary.vdc.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {summary.breadcrumb || summary.tenantName}
              </p>
            </div>
          </div>
          <Badge className={cn('text-[10px] px-2 py-0.5 flex-shrink-0', levelBadge)}>
            {levelConf?.label || summary.vdc.level}
          </Badge>
        </div>

        {/* Middle: Spend + Resource utilization bars */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Monthly Spend</span>
              <span className="font-mono font-medium">
                {formatCompactCurrency(summary.totalCost, currency as any)}
              </span>
            </div>
            <Progress value={utilizationPct} className="h-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Resources</span>
              <span className="font-mono font-medium">{summary.resourceCount}</span>
            </div>
            <div className="flex items-center gap-1 h-1.5 w-full rounded-full overflow-hidden bg-muted">
              {summary.running > 0 && (
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(summary.running / summary.resourceCount) * 100}%` }}
                />
              )}
              {summary.stopped > 0 && (
                <div
                  className="h-full bg-gray-400 rounded-full"
                  style={{ width: `${(summary.stopped / summary.resourceCount) * 100}%` }}
                />
              )}
              {summary.errored > 0 && (
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(summary.errored / summary.resourceCount) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {summary.running} running
              </span>
              {summary.stopped > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {summary.stopped} stopped
                </span>
              )}
              {summary.errored > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {summary.errored} error
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Top services + View arrow */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            {topServices.map((s) => (
              <Badge
                key={s.service}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-normal"
                style={{
                  backgroundColor: `${serviceInfo[s.service]?.color}15`,
                  color: serviceInfo[s.service]?.color,
                }}
              >
                {s.service}
              </Badge>
            ))}
            {summary.serviceDistribution.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{summary.serviceDistribution.length - 3}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View
            <MdChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Collect all leaf VDC summaries from a hierarchy tree
function collectLeafSummaries(
  node: VDCNode,
  tenantName: string,
  parentPath: string,
  allResources: Resource[],
): VDCSummary[] {
  const currentPath = parentPath ? `${parentPath} › ${node.name}` : node.name;
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    // Leaf node — collect its summary
    const nodeResources = allResources.filter((r) => r.vdcId === node.id);
    const svcMap = new Map<HuaweiService, number>();
    nodeResources.forEach((r) => svcMap.set(r.service, (svcMap.get(r.service) || 0) + 1));
    const serviceDistribution = Array.from(svcMap.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    return [{
      vdc: node,
      resourceCount: nodeResources.length,
      totalCost: nodeResources.reduce((sum, r) => sum + r.monthlyCost, 0),
      running: nodeResources.filter((r) => r.status === 'running').length,
      stopped: nodeResources.filter((r) => r.status === 'stopped').length,
      errored: nodeResources.filter((r) => r.status === 'error').length,
      serviceDistribution,
      childCount: 0,
      breadcrumb: parentPath,
      tenantName,
    }];
  }

  // Recurse into children
  return node.children!.flatMap((child) =>
    collectLeafSummaries(child, tenantName, currentPath, allResources),
  );
}

// =====================================================
// MAIN RESOURCES PAGE
// =====================================================

export default function Resources() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedVDCId, setSelectedVDCId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  // VDC tree: collapsed by default (empty set)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand tree to a specific VDC node
  const expandTreeToNode = useCallback((targetVdcId: string, hierarchies: VDCNode[]) => {
    // Find path from root to target
    const findPath = (node: VDCNode, target: string, path: string[]): string[] | null => {
      if (node.id === target) return [...path, node.id];
      if (node.children) {
        for (const child of node.children) {
          const result = findPath(child, target, [...path, node.id]);
          if (result) return result;
        }
      }
      return null;
    };

    for (const hierarchy of hierarchies) {
      const path = findPath(hierarchy, targetVdcId, []);
      if (path) {
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          // Expand all ancestors (not the target itself, unless it has children)
          path.forEach((id) => next.add(id));
          return next;
        });
        break;
      }
    }
  }, []);

  // Data generation
  const resources = useMemo(() => generateResources(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);

  const vdcHierarchies = useMemo(
    () => generateAllVDCHierarchies(selectedTenantId),
    [selectedTenantId],
  );

  // Flatten all VDCs for lookup
  const allVDCs = useMemo(() => {
    const flat: VDCNode[] = [];
    vdcHierarchies.forEach((h) => flattenVDCTree(h, flat));
    return flat;
  }, [vdcHierarchies]);

  // Build VDC name lookup
  const vdcNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allVDCs.forEach((v) => map.set(v.id, v.name));
    return map;
  }, [allVDCs]);

  // Build VDC level lookup
  const vdcLevelMap = useMemo(() => {
    const map = new Map<string, string>();
    allVDCs.forEach((v) => map.set(v.id, v.level));
    return map;
  }, [allVDCs]);

  // Build tenant name lookup
  const tenantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    mockTenants.forEach((t) => map.set(t.id, t.name));
    return map;
  }, []);

  // Resource count per VDC
  const resourceCountMap = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((r) => {
      map.set(r.vdcId, (map.get(r.vdcId) || 0) + 1);
    });
    return map;
  }, [resources]);

  // Cost per VDC
  const costMap = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((r) => {
      map.set(r.vdcId, (map.get(r.vdcId) || 0) + r.monthlyCost);
    });
    return map;
  }, [resources]);

  // Get all VDC IDs under the selected VDC node
  const selectedVDCIds = useMemo(() => {
    if (!selectedVDCId) return null;
    const node = allVDCs.find((v) => v.id === selectedVDCId);
    if (!node) return null;
    return new Set(getAllVDCIds(node));
  }, [selectedVDCId, allVDCs]);

  // FilterList resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedVDCIds && !selectedVDCIds.has(r.vdcId)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.service.toLowerCase().includes(q) ||
          (regionNames[r.region] || r.region).toLowerCase().includes(q) ||
          r.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (serviceFilter !== 'all' && r.service !== serviceFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (tenantFilter !== 'all' && r.tenantId !== tenantFilter) return false;

      return true;
    });
  }, [resources, searchQuery, serviceFilter, statusFilter, tenantFilter, selectedVDCIds]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, serviceFilter, statusFilter, tenantFilter, selectedVDCId, selectedTenantId]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const uniqueServices = useMemo(
    () => Array.from(new Set(resources.map((r) => r.service))).sort(),
    [resources],
  );

  // Unique tenants in current data
  const uniqueTenants = useMemo(
    () => Array.from(new Set(resources.map((r) => r.tenantId))),
    [resources],
  );

  const handleSelectVDC = useCallback((vdcId: string | null) => {
    setSelectedVDCId(vdcId);
  }, []);

  // Handle clicking a VDC card in thumbnail view:
  // switch to table, select VDC, expand tree to it
  const handleThumbnailVDCClick = useCallback((vdcId: string) => {
    setSelectedVDCId(vdcId);
    setViewMode('table');
    expandTreeToNode(vdcId, vdcHierarchies);
    setSidebarOpen(true);
  }, [vdcHierarchies, expandTreeToNode]);

  const handleOpenDetail = useCallback((resource: Resource) => {
    setDetailResource(resource);
    setDetailOpen(true);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const running = filteredResources.filter((r) => r.status === 'running').length;
    const stopped = filteredResources.filter((r) => r.status === 'stopped').length;
    const errored = filteredResources.filter((r) => r.status === 'error').length;
    const totalCost = filteredResources.reduce((sum, r) => sum + r.monthlyCost, 0);
    return { running, stopped, errored, totalCost };
  }, [filteredResources]);

  // For thumbnail view: group hierarchies by tenant
  const tenantHierarchies = useMemo(() => {
    const groups: { tenantId: string; tenantName: string; hierarchies: VDCNode[] }[] = [];
    const tenantMap = new Map<string, VDCNode[]>();

    vdcHierarchies.forEach((h) => {
      const existing = tenantMap.get(h.tenantId) || [];
      existing.push(h);
      tenantMap.set(h.tenantId, existing);
    });

    tenantMap.forEach((hierarchies, tenantId) => {
      groups.push({
        tenantId,
        tenantName: tenantNameMap.get(tenantId) || tenantId,
        hierarchies,
      });
    });

    return groups;
  }, [vdcHierarchies, tenantNameMap]);

  // FilterList tenant hierarchies by tenantFilter
  const filteredTenantHierarchies = useMemo(() => {
    if (tenantFilter === 'all') return tenantHierarchies;
    return tenantHierarchies.filter((g) => g.tenantId === tenantFilter);
  }, [tenantHierarchies, tenantFilter]);

  return (
    <ScrollArea className="h-full">
      <section aria-label="Resource Management" className="p-6 max-w-[1920px] mx-auto" data-testid="resources-page">
        {/* ============ TOP BAR ============ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          {/* Title row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <MdDns className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Resources</h1>
                <p className="text-sm text-muted-foreground">View and manage cloud resources across VDCs with utilization and cost insights</p>
              </div>
              <Badge variant="secondary" className="font-mono ml-2">
                {filteredResources.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-muted/50 rounded-md p-0.5 border border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode('table')}
                    >
                      <MdList className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'thumbnail' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode('thumbnail')}
                    >
                      <MdGridView className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>VDC Hierarchy View</TooltipContent>
                </Tooltip>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.classList.add('animate-spin');
                    setTimeout(() => icon.classList.remove('animate-spin'), 1000);
                  }
                }}
              >
                <MdRefresh className="h-3.5 w-3.5 mr-1.5 transition-transform" />
                Sync
              </Button>
              <Button variant="outline" size="sm">
                <MdDownload className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name, type, service, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-[260px] text-sm"
                data-testid="input-search-resources"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <MdClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm" data-testid="select-service-filter">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServices.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8 text-sm" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            {selectedTenantId === 'all' && (
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {uniqueTenants.map((tid) => (
                    <SelectItem key={tid} value={tid}>
                      {tenantNameMap.get(tid) || tid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Summary stats inline */}
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {stats.running} running
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                {stats.stopped} stopped
              </span>
              {stats.errored > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {stats.errored} error
                </span>
              )}
              <span className="font-mono font-medium text-foreground">
                {formatCompactCurrency(stats.totalCost, currency as any)}/mo
              </span>
            </div>
          </div>
        </motion.div>

        {/* ============ MAIN CONTENT ============ */}
        {viewMode === 'table' ? (
          /* ===== TABLE VIEW ===== */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-4"
          >
            {/* LEFT: VDC Tree Sidebar */}
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Card className="bg-card border-border/60 h-full">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                          <MdAccountTree className="h-3.5 w-3.5" />
                          VDC Navigator
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <MdViewSidebar className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0">
                      <ScrollArea className="h-[calc(100vh-280px)]">
                        {/* All Resources button */}
                        <div
                          className={cn(
                            'px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs mb-1 flex items-center gap-1.5',
                            selectedVDCId === null
                              ? 'bg-primary/8 text-primary font-semibold'
                              : 'hover:bg-muted/50 text-foreground/80',
                          )}
                          onClick={() => handleSelectVDC(null)}
                        >
                          <MdDns className="h-3 w-3 flex-shrink-0" />
                          <span className="flex-1">All Resources</span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 min-w-[20px] justify-center font-mono"
                          >
                            {resources.length}
                          </Badge>
                        </div>

                        <div className="h-px bg-border/50 my-1.5 mx-2" />

                        {/* VDC Trees */}
                        <div className="space-y-0.5">
                          {vdcHierarchies.map((hierarchy) => (
                            <div key={hierarchy.id}>
                              {selectedTenantId === 'all' && (
                                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-0.5">
                                  {tenantNameMap.get(hierarchy.tenantId) || hierarchy.tenantId}
                                </p>
                              )}
                              <VDCTreeNode
                                node={hierarchy}
                                currency={currency}
                                selectedVDCId={selectedVDCId}
                                onSelectVDC={handleSelectVDC}
                                resourceCountMap={resourceCountMap}
                                costMap={costMap}
                                expandedNodes={expandedNodes}
                                onToggleExpand={handleToggleExpand}
                              />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {/* VDC Level Legend */}
                      <div className="mt-2 pt-2 border-t border-border/50 px-2 pb-1 space-y-0.5">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Hierarchy</p>
                        {(['vdc1', 'vdc2', 'vdc3', 'vdc4', 'vdc5'] as const).map((level) => (
                          <div key={level} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', vdcLevelBgColors[level])} />
                            <span>{vdcLevelConfig[level].label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RIGHT: Resource Table */}
            <div className="flex-1 min-w-0">
              <Card className="bg-card border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    {!sidebarOpen && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSidebarOpen(true)}
                      >
                        <MdViewSidebar className="h-4 w-4" />
                      </Button>
                    )}
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {selectedVDCId
                        ? vdcNameMap.get(selectedVDCId) || 'VDC Resources'
                        : 'All Resources'}
                    </CardTitle>
                    {selectedVDCId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={() => handleSelectVDC(null)}
                      >
                        <MdClose className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Table with horizontal scroll */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]" data-testid="table-resources">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5 w-[220px]">
                            Resource
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[90px]">
                            Service
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[130px]">
                            Owner
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[85px]">
                            Status
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[100px]">
                            CPU
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[100px]">
                            Memory
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[100px]">
                            Network
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[100px]">
                            Disk
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 w-[60px]">
                            Age
                          </th>
                          <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5 w-[90px]">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResources.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-16 text-muted-foreground text-sm">
                              No resources found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedResources.map((resource) => {
                            const cpuBadge = getUtilizationBadge(resource.cpuUtilization);
                            const memBadge = getUtilizationBadge(resource.memoryUtilization);
                            const netBadge = getUtilizationBadge(resource.networkUtilization);
                            const diskBadge = getUtilizationBadge(resource.diskUtilization);
                            const idle = isResourceIdle(resource);

                            return (
                              <tr
                                key={resource.id}
                                className={cn(
                                  'border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors',
                                  idle && 'bg-amber-500/5 hover:bg-amber-500/10',
                                )}
                                data-testid={`resource-row-${resource.id}`}
                                onClick={() => handleOpenDetail(resource)}
                              >
                                <td className="px-4 py-2.5">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-medium text-sm truncate">{resource.name}</p>
                                      {idle && (
                                        <Badge
                                          variant="destructive"
                                          className="text-[9px] px-1 py-0 flex-shrink-0"
                                        >
                                          IDLE
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">{resource.type}</p>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      {resource.tags.slice(0, 2).map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-[9px] px-1 py-0 text-muted-foreground"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                      {resource.tags.length > 2 && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1 py-0 text-muted-foreground"
                                        >
                                          +{resource.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5"
                                    style={{
                                      backgroundColor: `${serviceInfo[resource.service]?.color}15`,
                                      color: serviceInfo[resource.service]?.color,
                                    }}
                                  >
                                    {resource.service}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="text-xs min-w-0">
                                    <p className="font-medium truncate">
                                      {tenantNameMap.get(resource.tenantId) || resource.tenantId}
                                    </p>
                                    <p className="text-muted-foreground truncate text-[11px]">
                                      {vdcNameMap.get(resource.vdcId) || resource.vdcId}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusDot(resource.status))} />
                                    <span className="text-xs capitalize">{resource.status}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Progress value={resource.cpuUtilization} className="w-10 h-1.5" />
                                    <span
                                      className={cn(
                                        'text-[11px] font-mono w-8 text-right',
                                        cpuBadge.color.split(' ')[0],
                                      )}
                                    >
                                      {resource.cpuUtilization}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Progress value={resource.memoryUtilization} className="w-10 h-1.5" />
                                    <span
                                      className={cn(
                                        'text-[11px] font-mono w-8 text-right',
                                        memBadge.color.split(' ')[0],
                                      )}
                                    >
                                      {resource.memoryUtilization}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Progress value={resource.networkUtilization} className="w-10 h-1.5" />
                                    <span className="text-[11px] font-mono w-8 text-right text-muted-foreground">
                                      {resource.networkUtilization}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Progress value={resource.diskUtilization} className="w-10 h-1.5" />
                                    <span
                                      className={cn(
                                        'text-[11px] font-mono w-8 text-right',
                                        diskBadge.color.split(' ')[0],
                                      )}
                                    >
                                      {resource.diskUtilization}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                    {formatAge(resource.createdAt)}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <span className="text-sm font-mono font-medium whitespace-nowrap">
                                    {formatCurrency(resource.monthlyCost, currency)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {filteredResources.length === 0 ? 0 : startIndex + 1}
                        {' - '}
                        {Math.min(endIndex, filteredResources.length)} of {filteredResources.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>Rows:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-[60px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option.toString()}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <MdFirstPage className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <MdChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1 mx-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="icon"
                              className="h-7 w-7 text-xs"
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <MdChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <MdLastPage className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          /* ===== VDC CARD VIEW (flat grid of leaf VDCs) ===== */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredTenantHierarchies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <MdAccountTree className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No VDCs found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredTenantHierarchies.map((group) => {
                  // Collect leaf VDCs as flat summaries
                  const leafSummaries = group.hierarchies.flatMap((h) =>
                    collectLeafSummaries(h, group.tenantName, '', resources),
                  ).sort((a, b) => b.totalCost - a.totalCost);

                  return (
                    <div key={group.tenantId}>
                      {/* Tenant section header */}
                      {(selectedTenantId === 'all' || filteredTenantHierarchies.length > 1) && (
                        <div className="flex items-center gap-2 mb-4">
                          <MdApartment className="h-4 w-4 text-muted-foreground" />
                          <h2 className="text-base font-semibold text-foreground">
                            {group.tenantName}
                          </h2>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {leafSummaries.length} VDCs
                          </Badge>
                          <div className="h-px flex-1 bg-border/50" />
                        </div>
                      )}

                      {/* Flat grid of leaf VDC cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {leafSummaries.map((summary, idx) => (
                          <VDCSummaryCard
                            key={summary.vdc.id}
                            summary={summary}
                            currency={currency}
                            onClick={() => handleThumbnailVDCClick(summary.vdc.id)}
                            depth={idx}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Resource Detail Dialog */}
      <ResourceDetailDialog
        resource={detailResource}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        currency={currency}
        allResources={resources}
        vdcName={detailResource ? (vdcNameMap.get(detailResource.vdcId) || 'Unknown') : ''}
        tenantName={
          detailResource ? (tenantNameMap.get(detailResource.tenantId) || 'Unknown') : ''
        }
      />
    </ScrollArea>
  );
}
