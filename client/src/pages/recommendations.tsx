import { MdAccessTime, MdAccountCircle, MdAccountTree, MdArrowForward, MdCancel, MdCheck, MdCheckCircle, MdClose, MdDescription, MdDns, MdDownload, MdFlashOn, MdHistory, MdLightbulb, MdOpenInNew, MdSpeed, MdStorage, MdTableChart, MdTrackChanges, MdTrendingDown, MdWarning } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore, type RecommendationHistoryEntry } from '@/lib/data-store';
import { getRegionScale } from '@/lib/mock-data';
import { serviceInfo, type RecommendationType, type RecommendationImpact, type Recommendation } from '@shared/schema';
import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const typeIcons: Record<RecommendationType, typeof MdDns> = {
  rightsizing: MdSpeed,
  idle_resource: MdDns,
  reserved_instance: MdStorage,
  storage_optimization: MdDns,
  network_optimization: MdAccountTree,
  database_tuning: MdStorage,
};

const typeLabels: Record<RecommendationType, string> = {
  rightsizing: 'Rightsizing',
  idle_resource: 'Idle Resource',
  reserved_instance: 'Reserved Instance',
  storage_optimization: 'Storage Optimization',
  network_optimization: 'Network Optimization',
  database_tuning: 'Database Tuning',
};

const impactColors: Record<RecommendationImpact, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
};

const statusInfo = {
  new: { icon: MdWarning, label: 'New', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  in_progress: { icon: MdAccessTime, label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  implemented: { icon: MdCheckCircle, label: 'Implemented', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  dismissed: { icon: MdClose, label: 'Dismissed', color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

const historyActionConfig: Record<RecommendationHistoryEntry['action'], { icon: typeof MdCheck; color: string; bg: string; label: string }> = {
  implemented: { icon: MdCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Implemented' },
  dismissed: { icon: MdCancel, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Dismissed' },
  moved_to_in_progress: { icon: MdArrowForward, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Moved to In Progress' },
  created: { icon: MdLightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Created' },
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function Recommendations() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();
  const { recommendations, recommendationHistory, implementRecommendation, dismissRecommendation, implementEasyWins } = useDataStore();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showEasyWinsDialog, setShowEasyWinsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');

  const filteredByTenant = useMemo(() => {
    let filtered = selectedTenantId === 'all' ? recommendations : recommendations.filter(r => r.tenantId === selectedTenantId);
    // Filter by region — only show recommendations for tenants with allocation in the selected region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(r => getRegionScale(r.tenantId, selectedRegion) > 0);
    }
    return filtered;
  }, [recommendations, selectedTenantId, selectedRegion]);

  const filteredRecommendations = useMemo(() => {
    return filteredByTenant.filter(r => {
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const matchesImpact = impactFilter === 'all' || r.impact === impactFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesType && matchesImpact && matchesStatus;
    });
  }, [filteredByTenant, typeFilter, impactFilter, statusFilter]);

  const stats = useMemo(() => {
    const newCount = filteredByTenant.filter(r => r.status === 'new').length;
    const totalSavings = filteredByTenant.filter(r => r.status === 'new').reduce((sum, r) => sum + r.projectedSavings, 0);
    const highImpact = filteredByTenant.filter(r => r.impact === 'high' && r.status === 'new').length;
    const easyWins = filteredByTenant.filter(r => r.effort === 'easy' && r.status === 'new').length;
    const implemented = filteredByTenant.filter(r => r.status === 'implemented').length;
    return { newCount, totalSavings, highImpact, easyWins, implemented };
  }, [filteredByTenant]);

  const easyWinsData = useMemo(() => {
    const easyWins = filteredByTenant.filter(r => r.effort === 'easy' && r.status === 'new');
    const totalSavings = easyWins.reduce((sum, r) => sum + r.projectedSavings, 0);
    return { count: easyWins.length, savings: totalSavings };
  }, [filteredByTenant]);

  const byType = filteredByTenant.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { count: 0, savings: 0 };
    acc[r.type].count++;
    if (r.status === 'new') acc[r.type].savings += r.projectedSavings;
    return acc;
  }, {} as Record<RecommendationType, { count: number; savings: number }>);

  const handleImplementEasyWins = () => {
    implementEasyWins();
    setShowEasyWinsDialog(false);
  };

  // Export functionality
  const getExportData = useCallback(() => {
    const data = filteredRecommendations.length > 0 ? filteredRecommendations : filteredByTenant;
    return data;
  }, [filteredRecommendations, filteredByTenant]);

  const handleExportCSV = useCallback(() => {
    const data = getExportData();
    const headers = ['Title', 'Type', 'Impact', 'Status', 'Current Cost', 'Projected Savings', 'Resource', 'Service'];
    const rows = data.map(r => [
      `"${r.title.replace(/"/g, '""')}"`,
      typeLabels[r.type] || r.type,
      r.impact.charAt(0).toUpperCase() + r.impact.slice(1),
      statusInfo[r.status]?.label || r.status,
      r.currentCost.toFixed(2),
      r.projectedSavings.toFixed(2),
      `"${r.resourceName.replace(/"/g, '""')}"`,
      r.service,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Export Complete', description: `${data.length} recommendations exported as CSV.` });
  }, [getExportData]);

  const handleExportPDF = useCallback(() => {
    const data = getExportData();

    const lines: string[] = [
      'RECOMMENDATIONS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Recommendations: ${data.length}`,
      '',
      '='.repeat(80),
    ];

    data.forEach((r, i) => {
      lines.push('');
      lines.push(`${i + 1}. ${r.title}`);
      lines.push(`   Type: ${typeLabels[r.type] || r.type} | Impact: ${r.impact.toUpperCase()} | Status: ${statusInfo[r.status]?.label || r.status}`);
      lines.push(`   Service: ${r.service} | Resource: ${r.resourceName}`);
      lines.push(`   Current Cost: $${r.currentCost.toFixed(2)}/mo | Projected Savings: $${r.projectedSavings.toFixed(2)}/mo`);
      lines.push(`   ${'-'.repeat(76)}`);
    });

    const content = lines.join('\n');
    const blob = new Blob([`%PDF-1.4\n${content}`], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Export Complete', description: `${data.length} recommendations exported as PDF.` });
  }, [getExportData]);

  return (
    <ScrollArea className="h-full">
      <section aria-label="Recommendations" className="p-6 max-w-[1920px] mx-auto" data-testid="recommendations-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdLightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recommendations</h1>
              <p className="text-sm text-muted-foreground">AI-powered recommendations to reduce your cloud spend</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export">
                  <MdDownload className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <MdTableChart className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <MdDescription className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={showEasyWinsDialog} onOpenChange={setShowEasyWinsDialog}>
              <Button
                className="bg-primary hover:bg-primary/90"
                data-testid="button-implement-all"
                onClick={() => setShowEasyWinsDialog(true)}
                disabled={easyWinsData.count === 0}
              >
                <MdFlashOn className="h-4 w-4 mr-2" />
                Implement Easy Wins ({easyWinsData.count})
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Implement Easy Wins</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will implement {easyWinsData.count} easy recommendations, saving approximately {formatCurrency(easyWinsData.savings, currency)} per month. Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImplementEasyWins}>
                    <MdCheck className="h-4 w-4 mr-2" />
                    Implement All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'New', value: stats.newCount, icon: MdLightbulb, color: 'text-amber-500' },
            { label: 'Potential Savings', value: formatCurrency(stats.totalSavings, currency), icon: MdTrendingDown, color: 'text-emerald-500', isValue: true },
            { label: 'High Impact', value: stats.highImpact, icon: MdTrackChanges, color: 'text-primary' },
            { label: 'Easy Wins', value: stats.easyWins, icon: MdFlashOn, color: 'text-blue-500' },
            { label: 'Implemented', value: stats.implemented, icon: MdCheckCircle, color: 'text-emerald-500' },
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
                        stat.isValue ? "text-lg" : "text-2xl"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' : stat.color === 'text-amber-500' ? 'bg-amber-500/10' : stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10')}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <MdLightbulb className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <MdHistory className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="lg:col-span-1"
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">By Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(Object.entries(byType) as [RecommendationType, { count: number; savings: number }][]).map(([type, data]) => {
                      const Icon = typeIcons[type];
                      return (
                        <div
                          key={type}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer hover-elevate",
                            typeFilter === type ? "bg-primary/10 border-primary" : "border-border"
                          )}
                          onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{typeLabels[type]}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                          </div>
                          <p className="text-sm font-mono text-emerald-500">
                            {formatCompactCurrency(data.savings, currency)} potential
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="lg:col-span-3"
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MdLightbulb className="h-5 w-5 text-amber-500" />
                        Recommendations
                        <Badge variant="secondary" className="ml-2">{filteredRecommendations.length}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="implemented">Implemented</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={impactFilter} onValueChange={setImpactFilter}>
                          <SelectTrigger className="w-[130px]" data-testid="select-impact-filter">
                            <SelectValue placeholder="Impact" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Impact</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setTypeFilter('all'); setImpactFilter('all'); setStatusFilter('new'); }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredRecommendations.map((rec, index) => {
                      const Icon = typeIcons[rec.type];
                      const StatusIcon = statusInfo[rec.status].icon;
                      const impact = impactColors[rec.impact];
                      const status = statusInfo[rec.status];

                      return (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * index }}
                        >
                          <div
                            className={cn(
                              "p-4 rounded-lg border bg-background/50 hover-elevate",
                              rec.status === 'implemented' && "opacity-70",
                              rec.status === 'dismissed' && "opacity-50"
                            )}
                            data-testid={`recommendation-${rec.id}`}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className="p-3 rounded-xl flex-shrink-0"
                                style={{ backgroundColor: `${serviceInfo[rec.service]?.color}15` }}
                              >
                                <Icon
                                  className="h-5 w-5"
                                  style={{ color: serviceInfo[rec.service]?.color }}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div>
                                    <h3 className="text-base font-semibold">{rec.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                        style={{
                                          backgroundColor: `${serviceInfo[rec.service]?.color}20`,
                                          color: serviceInfo[rec.service]?.color,
                                        }}
                                      >
                                        {rec.service}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{rec.resourceName}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs", status.bg, status.color)}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {status.label}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs border", impact.bg, impact.text, impact.border)}
                                    >
                                      {rec.impact.toUpperCase()} IMPACT
                                    </Badge>
                                  </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">
                                  {rec.description}
                                </p>

                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Current Cost</p>
                                      <p className="text-sm font-mono">{formatCurrency(rec.currentCost, currency)}/mo</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Effort</p>
                                      <Badge variant="secondary" className="text-xs capitalize">{rec.effort}</Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Potential Savings</p>
                                      <div className="flex items-center gap-1 text-emerald-500">
                                        <MdTrendingDown className="h-4 w-4" />
                                        <span className="text-lg font-mono font-bold">
                                          {formatCurrency(rec.projectedSavings, currency)}
                                        </span>
                                        <span className="text-xs">/mo</span>
                                      </div>
                                    </div>
                                    {rec.status === 'new' && (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => dismissRecommendation(rec.id)}
                                        >
                                          <MdClose className="h-4 w-4 mr-1" />
                                          Dismiss
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-primary hover:bg-primary/90"
                                          onClick={() => setSelectedRec(rec)}
                                        >
                                          View Details
                                          <MdOpenInNew className="h-4 w-4 ml-1" />
                                        </Button>
                                      </div>
                                    )}
                                    {rec.status === 'implemented' && (
                                      <Badge className="bg-emerald-500/10 text-emerald-500">
                                        <MdCheckCircle className="h-4 w-4 mr-1" />
                                        Saving {formatCurrency(rec.projectedSavings, currency)}/mo
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredRecommendations.length === 0 && (
                      <div className="text-center py-12">
                        <MdCheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Recommendations Found</h3>
                        <p className="text-sm text-muted-foreground">
                          {typeFilter !== 'all' || impactFilter !== 'all' || statusFilter !== 'new'
                            ? 'Try adjusting your filters to see more recommendations.'
                            : 'Great job! Your cloud resources are well optimized.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdHistory className="h-5 w-5 text-blue-500" />
                    Recommendation History
                    <Badge variant="secondary" className="ml-2">{recommendationHistory.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-1">
                      {recommendationHistory.map((entry, index) => {
                        const config = historyActionConfig[entry.action];
                        const ActionIcon = config.icon;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.04 * index }}
                            className="relative flex items-start gap-4 py-3"
                          >
                            {/* Timeline dot */}
                            <div className={cn(
                              "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-background",
                              config.bg
                            )}>
                              <ActionIcon className={cn("h-4 w-4", config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-snug">
                                    <span className="font-semibold">{entry.recommendationTitle}</span>
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs", config.bg, config.color)}
                                    >
                                      {config.label}
                                    </Badge>
                                    {entry.savings && (
                                      <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                                        <MdTrendingDown className="h-3 w-3 mr-1" />
                                        ${entry.savings.toFixed(2)}/mo saved
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                    <MdAccountCircle className="h-3.5 w-3.5" />
                                    <span>{entry.user}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5">
                                  {formatRelativeTime(entry.timestamp)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {recommendationHistory.length === 0 && (
                      <div className="text-center py-12">
                        <MdHistory className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Actions taken on recommendations will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedRec && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedRec.title}</DialogTitle>
                  <DialogDescription>
                    Review and implement this optimization recommendation
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${serviceInfo[selectedRec.service]?.color}20`,
                        color: serviceInfo[selectedRec.service]?.color,
                      }}
                    >
                      {selectedRec.service}
                    </Badge>
                    <Badge variant="outline" className={cn(impactColors[selectedRec.impact].bg, impactColors[selectedRec.impact].text)}>
                      {selectedRec.impact.toUpperCase()} IMPACT
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{selectedRec.effort} effort</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selectedRec.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resource</p>
                      <p className="font-medium">{selectedRec.resourceName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resource ID</p>
                      <p className="font-mono text-sm">{selectedRec.resourceId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Monthly Cost</p>
                      <p className="font-mono font-medium">{formatCurrency(selectedRec.currentCost, currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Projected Savings</p>
                      <p className="font-mono font-medium text-emerald-500">{formatCurrency(selectedRec.projectedSavings, currency)}/mo</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MdTrendingDown className="h-4 w-4 text-emerald-500" />
                      Annual Savings Projection
                    </h4>
                    <p className="text-2xl font-mono font-bold text-emerald-500">
                      {formatCurrency(selectedRec.projectedSavings * 12, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on current usage patterns
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedRec(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      dismissRecommendation(selectedRec.id);
                      setSelectedRec(null);
                    }}
                  >
                    <MdClose className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      implementRecommendation(selectedRec.id);
                      setSelectedRec(null);
                    }}
                  >
                    <MdCheck className="h-4 w-4 mr-2" />
                    Implement
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </ScrollArea>
  );
}
