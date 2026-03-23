import { MdAdd, MdCheckCircle, MdClose, MdContentCopy, MdDelete, MdDescription, MdDownload, MdEdit, MdInsertDriveFile, MdLabel, MdLayers, MdSearch, MdTableChart, MdVerifiedUser, MdWarning } from 'react-icons/md';
import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useFinOpsStore, formatCompactCurrency, formatCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { mockTenants, generateResources } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types imported from data-store
import type { TagGroup, TagKey, ValueType } from '@/lib/data-store';

interface TagRule {
  tag: string;
  compliant: number;
  nonCompliant: number;
  percentage: number;
}

interface TenantCompliance {
  tenantId: string;
  tenantName: string;
  compliance: number;
  untaggedCost: number;
}

interface TagViolation {
  resourceId: string;
  resourceName: string;
  service: string;
  missingTags: string[];
  monthlyCost: number;
}

// =====================================================
// Seeded random for deterministic data
// =====================================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// =====================================================
// Color palette for tag groups
// =====================================================

const GROUP_COLORS = [
  '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#E53935', '#00ACC1', '#6D4C41', '#546E7A',
];

const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  string: 'STR',
  int: 'INT',
  float: 'FLT',
  bool: 'BOOL',
  date: 'DATE',
  json: 'JSON',
  list: 'LIST',
  enum: 'ENUM',
};

const VALUE_TYPE_HINTS: Record<ValueType, string> = {
  string: 'e.g. "production-web-01"',
  int: 'e.g. 42',
  float: 'e.g. 3.14',
  bool: 'Accepts true or false only',
  date: 'e.g. 2026-01-15',
  json: 'Key-value pairs stored as JSON',
  list: 'Comma-separated list of allowed values',
  enum: 'Comma-separated list of allowed values',
};

// Tag groups now come from useDataStore

// =====================================================
// Mock data generators
// =====================================================

const REQUIRED_TAGS = ['environment', 'cost_center', 'owner', 'project', 'department'];

// =====================================================
// Component
// =====================================================

export default function TagGovernancePage() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();
  const { tagGroups, deleteTagGroup, duplicateTagGroup } = useDataStore();
  const [, setLocation] = useLocation();

  // Violations filter state
  const [violationSearch, setViolationSearch] = useState('');
  const [violationServiceFilter, setViolationServiceFilter] = useState<string>('all');
  const [violationPage, setViolationPage] = useState(0);
  const VIOLATIONS_PER_PAGE = 10;

  // Derive all metrics from real resource data, filtered by selected tenant and region
  const allResources = useMemo(() => generateResources(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);

  // Map simple tag strings to required tag categories
  const TAG_TO_REQUIRED: Record<string, string> = useMemo(() => ({
    production: 'environment',
    staging: 'environment',
    dev: 'environment',
    test: 'environment',
    critical: 'department',
    compliance: 'department',
    monitoring: 'project',
    'auto-scaled': 'cost_center',
    backup: 'owner',
  }), []);

  // For each resource, determine which required tags it satisfies
  const resourceRequiredTagCoverage = useMemo(() => {
    return allResources.map(r => {
      const coveredRequired = new Set<string>();
      for (const tag of r.tags) {
        const reqKey = TAG_TO_REQUIRED[tag];
        if (reqKey) coveredRequired.add(reqKey);
      }
      const seed = seededRandom(r.id.length * 31 + r.monthlyCost * 7);
      const extraCoverage = r.tags.length >= 3 ? 2 : r.tags.length >= 2 ? 1 : 0;
      const uncoveredRequired = REQUIRED_TAGS.filter(t => !coveredRequired.has(t));
      for (let i = 0; i < Math.min(extraCoverage, uncoveredRequired.length); i++) {
        const idx = Math.floor(seededRandom(seed + i * 13) * uncoveredRequired.length);
        coveredRequired.add(uncoveredRequired[idx]);
      }
      return { resource: r, coveredRequired };
    });
  }, [allResources, TAG_TO_REQUIRED]);

  const totalResources = allResources.length;

  // Count fully compliant resources (has ALL required tags)
  const fullyCompliantResources = useMemo(() => {
    return resourceRequiredTagCoverage.filter(
      rc => rc.coveredRequired.size >= REQUIRED_TAGS.length
    ).length;
  }, [resourceRequiredTagCoverage]);

  const nonCompliantResources = totalResources - fullyCompliantResources;

  const untaggedCost = useMemo(() => {
    return resourceRequiredTagCoverage
      .filter(rc => rc.coveredRequired.size < REQUIRED_TAGS.length)
      .reduce((sum, rc) => sum + rc.resource.monthlyCost, 0);
  }, [resourceRequiredTagCoverage]);

  // Memoized data - derived from real resources
  const tagRules = useMemo((): TagRule[] => {
    return REQUIRED_TAGS.map(tag => {
      const compliant = resourceRequiredTagCoverage.filter(
        rc => rc.coveredRequired.has(tag)
      ).length;
      const percentage = totalResources > 0 ? Math.round((compliant / totalResources) * 100) : 0;
      return {
        tag,
        compliant,
        nonCompliant: totalResources - compliant,
        percentage,
      };
    });
  }, [resourceRequiredTagCoverage, totalResources]);

  const tenantCompliance = useMemo((): TenantCompliance[] => {
    if (selectedTenantId !== 'all') {
      const tenant = mockTenants.find(t => t.id === selectedTenantId);
      if (!tenant) return [];
      const tenantResources = resourceRequiredTagCoverage.filter(rc => rc.resource.tenantId === selectedTenantId);
      const tenantCompliant = tenantResources.filter(rc => rc.coveredRequired.size >= REQUIRED_TAGS.length).length;
      const compliance = tenantResources.length > 0 ? Math.round((tenantCompliant / tenantResources.length) * 100) : 0;
      const tenantUntaggedCost = tenantResources
        .filter(rc => rc.coveredRequired.size < REQUIRED_TAGS.length)
        .reduce((sum, rc) => sum + rc.resource.monthlyCost, 0);
      return [{
        tenantId: tenant.id,
        tenantName: tenant.name,
        compliance,
        untaggedCost: tenantUntaggedCost,
      }];
    }
    return mockTenants.filter(t => t.status === 'active').map(tenant => {
      const tenantResources = resourceRequiredTagCoverage.filter(rc => rc.resource.tenantId === tenant.id);
      const tenantCompliant = tenantResources.filter(rc => rc.coveredRequired.size >= REQUIRED_TAGS.length).length;
      const compliance = tenantResources.length > 0 ? Math.round((tenantCompliant / tenantResources.length) * 100) : 0;
      const tenantUntaggedCost = tenantResources
        .filter(rc => rc.coveredRequired.size < REQUIRED_TAGS.length)
        .reduce((sum, rc) => sum + rc.resource.monthlyCost, 0);
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        compliance,
        untaggedCost: tenantUntaggedCost,
      };
    });
  }, [selectedTenantId, resourceRequiredTagCoverage]);

  const violations = useMemo((): TagViolation[] => {
    return resourceRequiredTagCoverage
      .filter(rc => rc.coveredRequired.size < REQUIRED_TAGS.length)
      .slice(0, 30)
      .map(rc => ({
        resourceId: rc.resource.id,
        resourceName: rc.resource.name,
        service: rc.resource.service,
        missingTags: REQUIRED_TAGS.filter(t => !rc.coveredRequired.has(t)),
        monthlyCost: rc.resource.monthlyCost,
      }));
  }, [resourceRequiredTagCoverage]);

  const overallCompliance = useMemo(() => {
    return totalResources > 0 ? Math.round((fullyCompliantResources / totalResources) * 100) : 0;
  }, [fullyCompliantResources, totalResources]);

  // Filtered violations
  const filteredViolations = useMemo(() => {
    let result = violations;
    if (violationSearch) {
      const q = violationSearch.toLowerCase();
      result = result.filter(
        v => v.resourceName.toLowerCase().includes(q) || v.resourceId.toLowerCase().includes(q)
      );
    }
    if (violationServiceFilter !== 'all') {
      result = result.filter(v => v.service === violationServiceFilter);
    }
    return result;
  }, [violations, violationSearch, violationServiceFilter]);

  const violationPageCount = Math.ceil(filteredViolations.length / VIOLATIONS_PER_PAGE);
  const paginatedViolations = filteredViolations.slice(
    violationPage * VIOLATIONS_PER_PAGE,
    (violationPage + 1) * VIOLATIONS_PER_PAGE
  );

  const violationServices = useMemo(() => {
    return Array.from(new Set(violations.map(v => v.service))).sort();
  }, [violations]);

  // Pie chart data — now based on compliant vs non-compliant (required tags), not tagged vs untagged
  const pieData = useMemo(() => [
    { name: 'Compliant', value: fullyCompliantResources, color: '#43A047' },
    { name: 'Non-Compliant', value: nonCompliantResources, color: '#E53935' },
  ], [fullyCompliantResources, nonCompliantResources]);

  const complianceBarData = useMemo(() => {
    return [...tenantCompliance].sort((a, b) => b.compliance - a.compliance);
  }, [tenantCompliance]);

  // ---- Export helpers ----

  const exportToCSV = useCallback(() => {
    const headers = ['Resource Name', 'Resource ID', 'Service', 'Missing Tags', 'Monthly Cost'];
    const rows = filteredViolations.map(v => [
      v.resourceName,
      v.resourceId,
      v.service,
      v.missingTags.join('; '),
      v.monthlyCost.toFixed(2),
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `tag-violations-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: 'Exported CSV', description: `${filteredViolations.length} violations exported.` });
  }, [filteredViolations]);

  const exportToXLSX = useCallback(() => {
    const wsData = [
      ['Resource Name', 'Resource ID', 'Service', 'Missing Tags', 'Monthly Cost'],
      ...filteredViolations.map(v => [
        v.resourceName,
        v.resourceId,
        v.service,
        v.missingTags.join('; '),
        v.monthlyCost,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 35 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tag Violations');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `tag-violations-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Exported XLSX', description: `${filteredViolations.length} violations exported.` });
  }, [filteredViolations]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Tag Governance - Violations Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ${filteredViolations.length} violations`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Resource Name', 'Service', 'Missing Tags', 'Monthly Cost']],
      body: filteredViolations.map(v => [
        v.resourceName,
        v.service,
        v.missingTags.join(', '),
        `$${v.monthlyCost.toFixed(2)}`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 136, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`tag-violations-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: 'Exported PDF', description: `${filteredViolations.length} violations exported.` });
  }, [filteredViolations]);

  // ---- Dialog helpers ----

  // ---- Helpers ----

  function complianceColor(pct: number) {
    if (pct >= 80) return 'text-green-500';
    if (pct >= 60) return 'text-amber-500';
    return 'text-red-500';
  }

  function complianceBg(pct: number) {
    if (pct >= 80) return '#43A047';
    if (pct >= 60) return '#FB8C00';
    return '#E53935';
  }

  function progressColor(pct: number) {
    if (pct >= 80) return '[&>div]:bg-green-500';
    if (pct >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MdLabel className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Tag Governance</h1>
          <p className="text-sm text-muted-foreground">
            Manage tag groups, enforce compliance, and track violations across HCS resources
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Overall Compliance',
              value: `${overallCompliance}%`,
              icon: MdVerifiedUser,
              iconColor: 'text-green-500',
              iconBg: 'bg-green-500/10',
              tooltip: 'Percentage of resources with ALL required tags',
            },
            {
              title: 'Compliant Resources',
              value: `${fullyCompliantResources} / ${totalResources}`,
              icon: MdCheckCircle,
              iconColor: 'text-blue-500',
              iconBg: 'bg-blue-500/10',
              tooltip: 'Resources with all 5 required tags vs total',
            },
            {
              title: 'Non-Compliant Cost',
              value: formatCompactCurrency(untaggedCost, currency),
              icon: MdWarning,
              iconColor: 'text-amber-500',
              iconBg: 'bg-amber-500/10',
              tooltip: 'Monthly cost of resources missing required tags',
            },
            {
              title: 'Tag Groups',
              value: String(tagGroups.length),
              icon: MdLayers,
              iconColor: 'text-purple-500',
              iconBg: 'bg-purple-500/10',
              tooltip: 'Active tag group policies',
            },
          ].map((kpi, idx) => (
            <Tooltip key={kpi.title}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                          <p className="text-2xl font-bold">{kpi.value}</p>
                        </div>
                        <div className={cn('p-2.5 rounded-lg', kpi.iconBg)}>
                          <kpi.icon className={cn('h-5 w-5', kpi.iconColor)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kpi.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Tag Groups Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Tag Groups</CardTitle>
            <Button size="sm" onClick={() => setLocation('/tags/create')}>
              <MdAdd className="h-4 w-4 mr-1" />
              New Group
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tagGroups.map((group, gi) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + gi * 0.06, duration: 0.35 }}
                >
                  <Card className="bg-background border border-border/60 h-full flex flex-col shadow-sm hover:shadow-md hover:border-border hover:-translate-y-0.5 transition-all duration-200 group/card">
                    <CardContent className="p-5 flex flex-col flex-1 gap-3">
                      {/* Group header */}
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 h-3.5 w-3.5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-background"
                          style={{ backgroundColor: group.color, boxShadow: `0 0 8px ${group.color}40` }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight">{group.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                        </div>
                      </div>

                      {/* Tag keys as pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map(tk => (
                          <div key={tk.id} className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="text-[11px] py-0.5 px-2 font-mono bg-muted/80"
                            >
                              {tk.key}
                              <span className="ml-1.5 opacity-50 text-[10px] font-semibold">{VALUE_TYPE_LABELS[tk.valueType]}</span>
                            </Badge>
                            {tk.required && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" title="Required" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Enum allowed values preview */}
                      {group.tags
                        .filter(tk => (tk.valueType === 'enum' || tk.valueType === 'list') && tk.allowedValues)
                        .slice(0, 2)
                        .map(tk => (
                          <div key={`av-${tk.id}`} className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-muted-foreground font-medium mr-0.5">{tk.key}:</span>
                            {tk.allowedValues
                              .split(',')
                              .slice(0, 5)
                              .map(v => (
                                <Badge key={v} variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-dashed">
                                  {v.trim()}
                                </Badge>
                              ))}
                            {tk.allowedValues.split(',').length > 5 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{tk.allowedValues.split(',').length - 5}
                              </span>
                            )}
                          </div>
                        ))}

                      {/* Footer */}
                      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{group.tags.length} keys</span>
                          <span>{group.createdAt}</span>
                          <span>{group.appliedTo} resources</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            {group.scope === 'all' ? 'Global' : group.scope === 'vdc' ? `${group.scopeTargets.length} VDCs` : `${group.scopeTargets.length} Resources`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateTagGroup(group.id)}>
                            <MdContentCopy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLocation(`/tags/edit/${group.id}`)}>
                            <MdEdit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <MdDelete className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{group.name}"? This will remove the tag group and its {group.tags.length} tag key{group.tags.length !== 1 ? 's' : ''}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteTagGroup(group.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* New Group placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + tagGroups.length * 0.06, duration: 0.35 }}
              >
                <button
                  onClick={() => setLocation('/tags/create')}
                  className="h-full min-h-[180px] w-full rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                  <MdAdd className="h-6 w-6" />
                  <span className="text-sm font-medium">New Group</span>
                </button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit now uses full-page routes: /tags/create and /tags/edit/:id */}

      {/* Compliance Score + Required Tags Compliance (two-column) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Donut Chart */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [`${value} resources`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-bold', complianceColor(overallCompliance))}>
                  {overallCompliance}%
                </span>
                <span className="text-xs text-muted-foreground">Compliant</span>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Compliant: {fullyCompliantResources}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Non-Compliant: {nonCompliantResources}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Tags Compliance */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Required Tags Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tagRules.map(rule => (
              <div key={rule.tag} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{rule.tag}</code>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-green-500">{rule.compliant} compliant</span>
                    <span className="text-red-500">{rule.nonCompliant} non-compliant</span>
                    <span className={cn('font-semibold', complianceColor(rule.percentage))}>
                      {rule.percentage}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={rule.percentage}
                  className={cn('h-2', progressColor(rule.percentage))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Compliance by Tenant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Compliance by Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="tenantName"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value}%`, 'Compliance']}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="compliance" radius={[0, 4, 4, 0]} barSize={22}>
                    {complianceBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={complianceBg(entry.compliance)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Violations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Top Violations</CardTitle>
              <Badge variant="destructive" className="text-xs">
                {filteredViolations.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  className="pl-8 h-8 w-48 text-sm"
                  value={violationSearch}
                  onChange={e => {
                    setViolationSearch(e.target.value);
                    setViolationPage(0);
                  }}
                />
              </div>
              <Select
                value={violationServiceFilter}
                onValueChange={v => {
                  setViolationServiceFilter(v);
                  setViolationPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {violationServices.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <MdDownload className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                    <MdDescription className="h-4 w-4 text-green-600" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToXLSX} className="gap-2 cursor-pointer">
                    <MdTableChart className="h-4 w-4 text-blue-600" />
                    Export XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                    <MdInsertDriveFile className="h-4 w-4 text-red-600" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Resource Name</TableHead>
                    <TableHead className="w-[100px]">Service</TableHead>
                    <TableHead>Missing Tags</TableHead>
                    <TableHead className="text-right w-[140px]">Monthly Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedViolations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No violations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedViolations.map(v => (
                      <TableRow key={v.resourceId}>
                        <TableCell className="font-mono text-xs">{v.resourceName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {v.service}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {v.missingTags.map(tag => (
                              <Badge key={tag} variant="destructive" className="text-[11px] font-mono">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(v.monthlyCost, currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {violationPageCount > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-muted-foreground">
                  Showing {violationPage * VIOLATIONS_PER_PAGE + 1}-
                  {Math.min((violationPage + 1) * VIOLATIONS_PER_PAGE, filteredViolations.length)} of{' '}
                  {filteredViolations.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={violationPage === 0}
                    onClick={() => setViolationPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: violationPageCount }, (_, i) => (
                    <Button
                      key={i}
                      variant={violationPage === i ? 'default' : 'outline'}
                      size="sm"
                      className="w-8"
                      onClick={() => setViolationPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={violationPage >= violationPageCount - 1}
                    onClick={() => setViolationPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
