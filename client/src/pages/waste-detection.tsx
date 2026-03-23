import { MdClose, MdDelete, MdDescription, MdDns, MdDownload, MdFlashOn, MdInsertDriveFile, MdLocalFireDepartment, MdSearch, MdTableChart, MdTrendingDown } from 'react-icons/md';
import { useMemo, useState } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateResources } from '@/lib/mock-data';
import type { HuaweiService, HuaweiRegion, Resource } from '@shared/schema';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// TYPES
// ============================================================
interface WasteCategory {
  name: string;
  count: number;
  monthlyCost: number;
}

interface WastedResource {
  id: string;
  name: string;
  service: HuaweiService;
  type: string;
  region: HuaweiRegion;
  monthlyCost: number;
  reason: string;
  lastActive: string;
  category: string;
  wasteScore: number;
}

// ============================================================
// CONSTANTS
// ============================================================

// Idle reasons: assigned when cpu < 15 && mem < 15
const IDLE_REASONS = [
  'Idle for 30+ days',
  'CPU utilization < 5%',
  'No network traffic for 14 days',
  'Development resource left running',
  'Idle serverless function',
];

// Orphaned reasons: assigned when status === 'stopped' or storage services (EVS, OBS)
const ORPHANED_REASONS = [
  'Unattached volume',
  'Orphaned snapshot',
  'Duplicate backup',
  'Stopped instance still incurring storage costs',
  'Empty container registry',
];

// Oversized reasons: assigned when cpu < 30 && monthlyCost > 500
const OVERSIZED_REASONS = [
  'Oversized - using < 10% capacity',
  'Oversized database instance',
  'Test environment not cleaned up',
  'Unused load balancer',
];

// Unattached reasons: assigned when networkUtilization < 5 and network-related services
const UNATTACHED_REASONS = [
  'Unused reserved IP',
  'Expired SSL certificate resource',
  'Unused NAT gateway',
  'Unattached network interface',
];

const CATEGORY_CONFIG: Record<string, { color: string; bgClass: string; textClass: string; borderClass: string; icon: typeof MdDelete }> = {
  'Idle Resources': {
    color: '#E53935',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/20',
    icon: MdDns,
  },
  'Orphaned Volumes': {
    color: '#FB8C00',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/20',
    icon: MdDns,
  },
  'Oversized Instances': {
    color: '#8E24AA',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500/20',
    icon: MdLocalFireDepartment,
  },
  'Unattached IPs/NICs': {
    color: '#3949AB',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-500',
    borderClass: 'border-indigo-500/20',
    icon: MdFlashOn,
  },
};

const CATEGORY_NAMES = ['Idle Resources', 'Orphaned Volumes', 'Oversized Instances', 'Unattached IPs/NICs'];

const REASON_BADGE_CONFIG: Record<string, { className: string }> = {
  'Idle Resources': { className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'Orphaned Volumes': { className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  'Oversized Instances': { className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  'Unattached IPs/NICs': { className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
};

// ============================================================
// CLASSIFY WASTE FROM REAL RESOURCES
// ============================================================
function classifyWaste(resources: Resource[]): WastedResource[] {
  const wasted: WastedResource[] = [];

  resources.forEach((r, idx) => {
    let category: string | null = null;
    let reasons: string[];

    // Idle: low CPU and memory utilization
    if (r.cpuUtilization < 15 && r.memoryUtilization < 15) {
      category = 'Idle Resources';
      reasons = IDLE_REASONS;
    }
    // Orphaned: stopped instances, or storage services with low utilization
    else if (r.status === 'stopped' || ((r.service === 'EVS' || r.service === 'OBS') && r.cpuUtilization < 20)) {
      category = 'Orphaned Volumes';
      reasons = ORPHANED_REASONS;
    }
    // Oversized: low CPU but expensive
    else if (r.cpuUtilization < 30 && r.monthlyCost > 500) {
      category = 'Oversized Instances';
      reasons = OVERSIZED_REASONS;
    }
    // Unattached: very low network utilization on network-related services
    else if (r.networkUtilization < 5 && (r.service === 'ELB' || r.service === 'VPC' || r.service === 'NAT')) {
      category = 'Unattached IPs/NICs';
      reasons = UNATTACHED_REASONS;
    }
    else {
      return; // Not waste
    }

    // Pick a reason deterministically based on resource index
    const reason = reasons[idx % reasons.length];

    // Derive lastActive from createdAt
    const lastActive = r.createdAt.split('T')[0];

    // Waste score (0-100): inverse of avg utilization, weighted by cost
    const avgUtil = (r.cpuUtilization + r.memoryUtilization + r.networkUtilization) / 3;
    const costWeight = Math.min(r.monthlyCost / 1000, 1); // normalize cost 0-1
    const wasteScore = Math.round(Math.min(100, (100 - avgUtil) * (0.6 + 0.4 * costWeight)));

    wasted.push({
      id: r.id,
      name: r.name,
      service: r.service,
      type: r.type,
      region: r.region,
      monthlyCost: r.monthlyCost,
      reason,
      lastActive,
      category,
      wasteScore,
    });
  });

  return wasted;
}

// ============================================================
// COMPUTE CATEGORY DATA FROM RESOURCES
// ============================================================
function computeCategories(resources: WastedResource[]): WasteCategory[] {
  const map: Record<string, WasteCategory> = {};
  CATEGORY_NAMES.forEach(name => {
    map[name] = { name, count: 0, monthlyCost: 0 };
  });
  resources.forEach(r => {
    const cat = map[r.category];
    if (cat) {
      cat.count += 1;
      cat.monthlyCost += r.monthlyCost;
    }
  });
  return CATEGORY_NAMES.map(name => map[name]);
}

// ============================================================
// WASTE SCORE COLOR HELPER
// ============================================================
function wasteScoreColor(score: number): string {
  if (score >= 80) return 'text-red-500 bg-red-500/15 border-red-500/30';
  if (score >= 60) return 'text-orange-500 bg-orange-500/15 border-orange-500/30';
  if (score >= 40) return 'text-amber-500 bg-amber-500/15 border-amber-500/30';
  return 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30';
}

function wasteScoreRingColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

// ============================================================
// WASTE TREND MOCK DATA (last 6 months, gradually decreasing)
// ============================================================
function generateWasteTrendData() {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const baseValues = [18400, 17200, 15800, 13500, 11200, 9800];
  return months.map((month, i) => ({
    month,
    waste: baseValues[i],
  }));
}

const WASTE_TREND_DATA = generateWasteTrendData();

// ============================================================
// CHART COLORS
// ============================================================
const PIE_COLORS = ['#E53935', '#FB8C00', '#8E24AA', '#3949AB'];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WasteDetection() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  // State
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('highest-cost');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Generate all resources from the shared data model, filtered by tenant and region
  const allResources = useMemo(() => generateResources(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);

  // Derive wasted resources from the real resource pool
  const allWastedResources = useMemo(() => classifyWaste(allResources), [allResources]);

  // Active resources (excluding removed)
  const activeResources = useMemo(
    () => allWastedResources.filter(r => !removedIds.has(r.id)),
    [allWastedResources, removedIds],
  );

  // Categories from active resources
  const categories = useMemo(() => computeCategories(activeResources), [activeResources]);

  // KPIs derived from real resource data
  const kpis = useMemo(() => {
    const totalSpend = allResources.reduce((s, r) => s + r.monthlyCost, 0);
    const totalWaste = activeResources.reduce((s, r) => s + r.monthlyCost, 0);
    const wastePercent = totalSpend > 0 ? (totalWaste / totalSpend) * 100 : 0;
    const idleCount = activeResources.filter(r => r.category === 'Idle Resources').length;
    const orphanedCount = activeResources.filter(r => r.category === 'Orphaned Volumes').length;
    return { totalWaste, totalSpend, wastePercent, idleCount, orphanedCount };
  }, [allResources, activeResources]);

  // Quick wins: top 5 resources over $50/mo by cost
  const quickWins = useMemo(
    () => activeResources
      .filter(r => r.monthlyCost > 50)
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .slice(0, 5),
    [activeResources],
  );

  // Filtered + sorted resources for the table
  const filteredResources = useMemo(() => {
    let items = activeResources;

    if (categoryFilter !== 'all') {
      items = items.filter(r => r.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'highest-cost') {
      items = [...items].sort((a, b) => b.monthlyCost - a.monthlyCost);
    } else {
      // least-active: sort by lastActive ascending (oldest first)
      items = [...items].sort((a, b) => a.lastActive.localeCompare(b.lastActive));
    }

    return items;
  }, [activeResources, categoryFilter, sortBy, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset page when filters change
  const handleCategoryFilter = (v: string) => { setCategoryFilter(v); setPage(1); };
  const handleSortBy = (v: string) => { setSortBy(v); setPage(1); };
  const handleSearch = (v: string) => { setSearchQuery(v); setPage(1); };

  // Remove resource (fix / terminate)
  const removeResource = (resource: WastedResource, action: 'fix' | 'terminate') => {
    setRemovedIds(prev => new Set(prev).add(resource.id));
    toast({
      title: action === 'fix' ? 'Quick Win Applied' : 'Resource Terminated',
      description: `${resource.name} has been ${action === 'fix' ? 'fixed' : 'terminated'}. Estimated savings: ${formatCurrency(resource.monthlyCost, currency as any)}/mo`,
    });
  };

  // ---- Export helpers ----
  const exportToCSV = () => {
    const headers = ['Resource Name', 'ID', 'Service', 'Region', 'Category', 'Reason', 'Monthly Cost', 'Last Active'];
    const rows = filteredResources.map(r => [
      r.name, r.id, r.service, r.region, r.category, r.reason,
      r.monthlyCost.toFixed(2), r.lastActive,
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `waste-detection-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: 'Exported CSV', description: `${filteredResources.length} resources exported.` });
  };

  const exportToXLSX = () => {
    const wsData = [
      ['Resource Name', 'ID', 'Service', 'Region', 'Category', 'Reason', 'Monthly Cost', 'Last Active'],
      ...filteredResources.map(r => [
        r.name, r.id, r.service, r.region, r.category, r.reason,
        r.monthlyCost, r.lastActive,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wasted Resources');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `waste-detection-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Exported XLSX', description: `${filteredResources.length} resources exported.` });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Waste Detection - Resource Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ${filteredResources.length} wasted resources`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['Resource Name', 'Service', 'Category', 'Reason', 'Monthly Cost']],
      body: filteredResources.map(r => [
        r.name, r.service, r.category, r.reason, `$${r.monthlyCost.toFixed(2)}`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [229, 57, 53], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`waste-detection-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: 'Exported PDF', description: `${filteredResources.length} resources exported.` });
  };

  // Pie chart data
  const pieData = useMemo(
    () => categories.map(c => ({ name: c.name, value: Math.round(c.monthlyCost * 100) / 100 })),
    [categories],
  );

  // Stagger animation
  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* ============================================================
            1. HEADER
            ============================================================ */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MdDelete className="h-6 w-6 text-red-500" />
            Waste Detection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Identify idle, orphaned, and oversized resources to reduce unnecessary cloud spend
          </p>
        </div>

        {/* ============================================================
            2. KPI CARDS
            ============================================================ */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Total Waste */}
          <motion.div variants={fadeUp}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Waste</p>
                        <p className="text-2xl font-bold">
                          {formatCompactCurrency(kpis.totalWaste, currency as any)}
                        </p>
                        <p className="text-xs text-muted-foreground">estimated monthly</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-red-500/10">
                        <MdDelete className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated monthly cost of wasted resources</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          {/* Waste % of Spend */}
          <motion.div variants={fadeUp}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Waste % of Spend</p>
                        <p className="text-2xl font-bold">{kpis.wastePercent.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">of total cloud spend</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-amber-500/10">
                        <MdLocalFireDepartment className="h-6 w-6 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Waste as a percentage of total cloud spend</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          {/* Idle Resources */}
          <motion.div variants={fadeUp}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Idle Resources</p>
                        <p className="text-2xl font-bold">{kpis.idleCount}</p>
                        <p className="text-xs text-muted-foreground">no activity 14+ days</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-violet-500/10">
                        <MdDns className="h-6 w-6 text-violet-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resources with no activity for 14+ days</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          {/* Orphaned Volumes */}
          <motion.div variants={fadeUp}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Orphaned Volumes</p>
                        <p className="text-2xl font-bold">{kpis.orphanedCount}</p>
                        <p className="text-xs text-muted-foreground">unattached storage</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-indigo-500/10">
                        <MdDns className="h-6 w-6 text-indigo-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unattached storage volumes still incurring charges</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.div>

        {/* ============================================================
            3. WASTE BY CATEGORY (1/3) + CATEGORY DETAIL CARDS (2/3)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Donut Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-base">Waste by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      dataKey="value"
                      nameKey="name"
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-2 mt-2">
                {categories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatCompactCurrency(cat.monthlyCost, currency as any)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: 2x2 Grid of Category Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => {
              const config = CATEGORY_CONFIG[cat.name];
              if (!config) return null;
              const IconComp = config.icon;
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn('bg-card/50 backdrop-blur-sm border-card-border h-full')}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', config.bgClass)}>
                          <IconComp className={cn('h-5 w-5', config.textClass)} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.count} resource{cat.count !== 1 ? 's' : ''}
                          </p>
                          <p className={cn('text-lg font-bold', config.textClass)}>
                            {formatCompactCurrency(cat.monthlyCost, currency as any)}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            4. QUICK WINS
            ============================================================ */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MdFlashOn className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle className="text-base">Quick Wins</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Highest-impact actions to reduce waste immediately
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {quickWins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No quick wins remaining. All high-cost waste items have been addressed.
              </p>
            ) : (
              <div className="space-y-3">
                {quickWins.map(resource => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between rounded-lg border border-card-border bg-muted/20 p-4 gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium truncate">
                          {resource.name}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {resource.service}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 font-bold border shrink-0', wasteScoreColor(resource.wasteScore))}>
                          {resource.wasteScore}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{resource.reason}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-bold text-red-500 font-mono">
                        {formatCurrency(resource.monthlyCost, currency as any)}/mo
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 focus-visible:ring-0"
                        onClick={() => removeResource(resource, 'fix')}
                      >
                        <MdFlashOn className="h-3.5 w-3.5 mr-1" />
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================
            4b. WASTE TRENDS
            ============================================================ */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MdTrendingDown className="h-5 w-5 text-emerald-500" />
              <div>
                <CardTitle className="text-base">Waste Trends</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly waste amount over the last 6 months
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={WASTE_TREND_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Waste']}
                  />
                  <Area
                    type="monotone"
                    dataKey="waste"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#wasteGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            5. ALL WASTED RESOURCES TABLE
            ============================================================ */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">All Wasted Resources</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredResources.length}
                </Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-8 w-[220px] h-9 text-sm"
                  />
                </div>
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_NAMES.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortBy}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest-cost">Highest Cost</SelectItem>
                    <SelectItem value="least-active">Least Active</SelectItem>
                  </SelectContent>
                </Select>
                {/* Export */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-card-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Resource Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Monthly Cost</TableHead>
                    <TableHead className="text-center">Waste Score</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                        No wasted resources found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedResources.map(resource => {
                      const reasonBadge = REASON_BADGE_CONFIG[resource.category] || REASON_BADGE_CONFIG['Idle Resources'];
                      return (
                        <TableRow key={resource.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-xs">{resource.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{resource.service}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{resource.type}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{resource.region}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium text-red-500">
                            {formatCurrency(resource.monthlyCost, currency as any)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center relative" title={`Waste Score: ${resource.wasteScore}/100`}>
                              <svg width="32" height="32" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                                <circle
                                  cx="18" cy="18" r="14"
                                  fill="none"
                                  stroke={wasteScoreRingColor(resource.wasteScore)}
                                  strokeWidth="3"
                                  strokeDasharray={`${resource.wasteScore * 0.88} 88`}
                                  strokeDashoffset="22"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute text-[9px] font-bold" style={{ color: wasteScoreRingColor(resource.wasteScore) }}>
                                {resource.wasteScore}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-xs', reasonBadge.className)}>
                              {resource.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{resource.lastActive}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-3 text-xs font-medium text-red-500 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 rounded-md transition-colors ring-0 focus-visible:ring-0"
                              onClick={() => removeResource(resource, 'terminate')}
                            >
                              <MdClose className="h-3.5 w-3.5 mr-1" />
                              Terminate
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredResources.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}
                  {' '}-{' '}
                  {Math.min(currentPage * PAGE_SIZE, filteredResources.length)}
                  {' '}of {filteredResources.length} resources
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
