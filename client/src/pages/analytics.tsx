import { MdBarChart, MdCalendarToday, MdClose, MdDownload, MdExpandMore, MdFilterList, MdLayers, MdLocationOn, MdPeople, MdSchedule, MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateCostTrend, generateServiceBreakdown, generateRegionBreakdown, generateKPIs, getDaysFromPreset, generateTenantSummaries, mockTenants } from '@/lib/mock-data';
import { serviceInfo, regionNames } from '@shared/schema';
import type { HuaweiService, HuaweiRegion } from '@shared/schema';
import { useMemo, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const CHART_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

const CATEGORY_COLORS: Record<string, string> = {
  Compute: '#E53935',
  Storage: '#43A047',
  Database: '#1E88E5',
  Network: '#8E24AA',
  Security: '#D81B60',
  Application: '#7CB342',
  Analytics: '#5E35B1',
  AI: '#6A1B9A',
  Management: '#546E7A',
};

type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'custom';

export default function Analytics() {
  const {
    currency, selectedTenantId, selectedRegion, dateRange,
    selectedServices, setSelectedServices,
    selectedRegions, setSelectedRegions,
  } = useFinOpsStore();

  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('month');
  const [drilldownService, setDrilldownService] = useState<HuaweiService | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [serviceFilterOpen, setServiceFilterOpen] = useState(false);
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);
  // Gap #12: Selectable time period for trend chart
  const [trendWindow, setTrendWindow] = useState<7 | 14 | 30 | 90>(14);
  // Gap #16: Comparison mode (time periods vs tenants vs regions)
  const [comparisonMode, setComparisonMode] = useState<'periods' | 'tenants' | 'regions'>('periods');

  // Get days from the selected date range preset
  const daysInPeriod = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);

  // Generate enough data to support the largest trend window (90d) or the global date range, whichever is bigger
  const trendDays = useMemo(() => Math.max(daysInPeriod, trendWindow), [daysInPeriod, trendWindow]);
  const costTrend = useMemo(() => generateCostTrend(selectedTenantId, trendDays, selectedRegion), [selectedTenantId, trendDays, selectedRegion]);
  const serviceBreakdown = useMemo(() => generateServiceBreakdown(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);
  const regionBreakdown = useMemo(() => generateRegionBreakdown(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);
  const kpis = useMemo(() => generateKPIs(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);

  // ---- Feature #17: Apply filters to data ----
  const filteredServiceBreakdown = useMemo(() => {
    let data = serviceBreakdown;
    if (selectedServices.length > 0) {
      data = data.filter(s => selectedServices.includes(s.service));
    }
    if (selectedRegions.length > 0) {
      // When region filter is active, we scale service costs proportionally
      // based on the selected regions' share of total spend
      const totalRegionCost = regionBreakdown.reduce((sum, r) => sum + r.cost, 0);
      const selectedRegionCost = regionBreakdown
        .filter(r => selectedRegions.includes(r.region))
        .reduce((sum, r) => sum + r.cost, 0);
      const regionRatio = totalRegionCost > 0 ? selectedRegionCost / totalRegionCost : 1;
      data = data.map(s => ({ ...s, cost: s.cost * regionRatio }));
    }
    return data;
  }, [serviceBreakdown, selectedServices, selectedRegions, regionBreakdown]);

  const filteredRegionBreakdown = useMemo(() => {
    let data = regionBreakdown;
    if (selectedRegions.length > 0) {
      data = data.filter(r => selectedRegions.includes(r.region));
    }
    if (selectedServices.length > 0) {
      const totalServiceCost = serviceBreakdown.reduce((sum, s) => sum + s.cost, 0);
      const selectedServiceCost = serviceBreakdown
        .filter(s => selectedServices.includes(s.service))
        .reduce((sum, s) => sum + s.cost, 0);
      const serviceRatio = totalServiceCost > 0 ? selectedServiceCost / totalServiceCost : 1;
      data = data.map(r => ({ ...r, cost: r.cost * serviceRatio }));
    }
    return data;
  }, [regionBreakdown, selectedRegions, selectedServices, serviceBreakdown]);

  const filteredKpis = useMemo(() => {
    if (selectedServices.length === 0 && selectedRegions.length === 0) return kpis;
    const totalOriginal = serviceBreakdown.reduce((s, b) => s + b.cost, 0);
    const totalFiltered = filteredServiceBreakdown.reduce((s, b) => s + b.cost, 0);
    const ratio = totalOriginal > 0 ? totalFiltered / totalOriginal : 1;
    return {
      ...kpis,
      totalSpend: kpis.totalSpend * ratio,
    };
  }, [kpis, serviceBreakdown, filteredServiceBreakdown, selectedServices, selectedRegions]);

  // ---- Gap #10: Cost by Tenant data ----
  const tenantSummaries = useMemo(() => generateTenantSummaries(), []);

  // ---- Gap #12: Windowed trend data (selectable time period) ----
  const windowedTrendData = useMemo(() => {
    const filtered = costTrend.filter(d => d.amount > 0);
    return filtered.slice(-trendWindow).map((d, i, arr) => ({
      ...d,
      previousAmount: arr[i - 1]?.amount || d.amount,
      change: i > 0 ? ((d.amount - arr[i - 1].amount) / arr[i - 1].amount * 100) : 0,
    }));
  }, [costTrend, trendWindow]);

  // ---- Gap #14: Forecasted Spend data ----
  const forecastData = useMemo(() => {
    const filtered = costTrend.filter(d => d.amount > 0);
    const recentDays = filtered.slice(-7);
    const avgDaily = recentDays.reduce((sum, d) => sum + d.amount, 0) / recentDays.length;
    const today = new Date();
    const forecast: { date: string; forecast: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      // Add slight variance to make the forecast realistic
      const dayVariance = 0.95 + (((i * 13 + 7) % 11) / 11) * 0.1;
      forecast.push({
        date: date.toISOString().split('T')[0],
        forecast: Math.round(avgDaily * dayVariance * 100) / 100,
      });
    }
    const projectedWeekly = forecast.reduce((sum, d) => sum + d.forecast, 0);
    return { points: forecast, avgDaily, projectedWeekly };
  }, [costTrend]);

  // Combined trend + forecast data for the chart
  const trendWithForecastData = useMemo(() => {
    const actual = windowedTrendData.map(d => ({
      date: d.date,
      amount: d.amount,
      forecast: null as number | null,
      change: d.change,
    }));
    // Bridge: last actual point also appears as first forecast point
    const forecastPoints = forecastData.points.map(d => ({
      date: d.date,
      amount: null as number | null,
      forecast: d.forecast,
      change: 0,
    }));
    if (actual.length > 0 && forecastPoints.length > 0) {
      forecastPoints.unshift({
        date: actual[actual.length - 1].date,
        amount: null,
        forecast: actual[actual.length - 1].amount,
        change: 0,
      });
    }
    return [...actual, ...forecastPoints];
  }, [windowedTrendData, forecastData]);

  // ---- Gap #16: Cross-tenant service comparison data ----
  const crossTenantData = useMemo(() => {
    const topServices = filteredServiceBreakdown.slice(0, 6).map(s => s.service);
    return topServices.map(service => {
      const row: Record<string, any> = { service };
      mockTenants.forEach(tenant => {
        const breakdown = generateServiceBreakdown(tenant.id, daysInPeriod, selectedRegion);
        const svc = breakdown.find(s => s.service === service);
        row[tenant.name] = svc ? Math.round(svc.cost * 100) / 100 : 0;
      });
      return row;
    });
  }, [filteredServiceBreakdown, daysInPeriod]);

  // ---- Gap #16: Cross-region service comparison data ----
  const crossRegionServiceData = useMemo(() => {
    const topServices = filteredServiceBreakdown.slice(0, 6).map(s => s.service);
    const topRegions = filteredRegionBreakdown.slice(0, 4);
    const totalRegionCost = regionBreakdown.reduce((sum, r) => sum + r.cost, 0);
    return topServices.map(service => {
      const svc = filteredServiceBreakdown.find(s => s.service === service);
      if (!svc) return { service };
      const row: Record<string, any> = { service };
      topRegions.forEach(region => {
        const regionShare = totalRegionCost > 0 ? region.cost / totalRegionCost : 0;
        row[regionNames[region.region] || region.region] = Math.round(svc.cost * regionShare * 100) / 100;
      });
      return row;
    });
  }, [filteredServiceBreakdown, filteredRegionBreakdown, regionBreakdown]);

  // ---- Feature #1: Cost by Resource Type (category grouping) ----
  const categoryBreakdown = useMemo(() => {
    const categoryMap: Record<string, { cost: number; services: string[]; resourceCount: number }> = {};
    filteredServiceBreakdown.forEach(s => {
      const cat = serviceInfo[s.service]?.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { cost: 0, services: [], resourceCount: 0 };
      }
      categoryMap[cat].cost += s.cost;
      categoryMap[cat].services.push(s.service);
      categoryMap[cat].resourceCount += s.resourceCount;
    });
    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        cost: Math.round(data.cost * 100) / 100,
        services: data.services,
        resourceCount: data.resourceCount,
        fill: CATEGORY_COLORS[category] || '#546E7A',
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredServiceBreakdown]);

  // ---- Feature #2: Period Comparison data ----
  const comparisonData = useMemo(() => {
    const periodLabels: Record<ComparisonPeriod, { current: string; previous: string; factor: number }> = {
      week: { current: 'This Week', previous: 'Last Week', factor: 7 / 30 },
      month: { current: 'This Month', previous: 'Last Month', factor: 1 },
      quarter: { current: 'This Quarter', previous: 'Last Quarter', factor: 3 },
      custom: { current: 'Period A', previous: 'Period B', factor: 1 },
    };
    const labels = periodLabels[comparisonPeriod];
    // Simulate different growth rates per period
    const growthMultipliers: Record<ComparisonPeriod, number> = {
      week: 0.03,   // 3% week-over-week
      month: 0.06,  // 6% month-over-month (existing)
      quarter: 0.15, // 15% quarter-over-quarter
      custom: 0.08,
    };
    const growth = growthMultipliers[comparisonPeriod];

    return {
      labels,
      chartData: filteredServiceBreakdown.slice(0, 8).map(s => {
        const scaledCost = s.cost * labels.factor;
        return {
          service: s.service,
          current: Math.round(scaledCost * 100) / 100,
          previous: Math.round(scaledCost * (1 - growth) * 100) / 100,
        };
      }),
    };
  }, [filteredServiceBreakdown, comparisonPeriod]);

  // ---- Feature #4: Drilldown data ----
  const drilldownData = useMemo(() => {
    if (!drilldownService) return null;
    const svc = filteredServiceBreakdown.find(s => s.service === drilldownService);
    if (!svc) return null;

    // Generate region breakdown for this service
    const totalRegionCost = regionBreakdown.reduce((sum, r) => sum + r.cost, 0);
    const regionDetail = regionBreakdown.map(r => ({
      region: r.region,
      regionName: regionNames[r.region] || r.region,
      cost: Math.round((svc.cost * (r.cost / totalRegionCost)) * 100) / 100,
      percentage: Math.round((r.cost / totalRegionCost) * 1000) / 10,
    })).filter(r => r.cost > 0).sort((a, b) => b.cost - a.cost);

    // Generate daily trend for this service (respects selected trend window)
    const dailyTrend = costTrend.filter(d => d.amount > 0).slice(-trendWindow).map((d, i) => {
      const totalForDay = d.amount;
      const totalAllServices = filteredServiceBreakdown.reduce((s, b) => s + b.cost, 0);
      const svcShare = totalAllServices > 0 ? svc.cost / totalAllServices : 0;
      // Add some daily variation
      const variation = 0.85 + (((i * 7 + 3) % 11) / 11) * 0.3;
      return {
        date: d.date,
        amount: Math.round(totalForDay * svcShare * variation * 100) / 100,
      };
    });

    // Calculate resource stats
    const avgCostPerResource = svc.resourceCount > 0 ? svc.cost / svc.resourceCount : 0;

    return {
      service: drilldownService,
      serviceName: serviceInfo[drilldownService]?.name || drilldownService,
      category: serviceInfo[drilldownService]?.category || 'Other',
      color: serviceInfo[drilldownService]?.color || '#1E88E5',
      totalCost: svc.cost,
      percentage: svc.percentage,
      trend: svc.trend,
      resourceCount: svc.resourceCount,
      avgCostPerResource: Math.round(avgCostPerResource * 100) / 100,
      regionDetail,
      dailyTrend,
    };
  }, [drilldownService, filteredServiceBreakdown, regionBreakdown, costTrend]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-mono font-semibold" style={{ color: entry.color }}>
              {entry.name}: {formatCompactCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const dailyTrendData = costTrend.filter(d => d.amount > 0).slice(-trendWindow).map((d, i, arr) => ({
    ...d,
    previousAmount: arr[i - 1]?.amount || d.amount,
    change: i > 0 ? ((d.amount - arr[i - 1].amount) / arr[i - 1].amount * 100) : 0,
  }));

  const serviceTreemapData = filteredServiceBreakdown.slice(0, 12).map((s, i) => ({
    name: s.service,
    fullName: serviceInfo[s.service]?.name || s.service,
    size: s.cost,
    fill: serviceInfo[s.service]?.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Handle pie/bar chart click for drilldown
  const handleServiceClick = useCallback((service: HuaweiService) => {
    setDrilldownService(service);
  }, []);

  // Toggle service in filter
  const toggleServiceFilter = useCallback((service: HuaweiService) => {
    setSelectedServices(
      selectedServices.includes(service)
        ? selectedServices.filter(s => s !== service)
        : [...selectedServices, service]
    );
  }, [selectedServices, setSelectedServices]);

  // Toggle region in filter
  const toggleRegionFilter = useCallback((region: HuaweiRegion) => {
    setSelectedRegions(
      selectedRegions.includes(region)
        ? selectedRegions.filter(r => r !== region)
        : [region]
    );
  }, [selectedRegions, setSelectedRegions]);

  const allServices = useMemo(() => {
    return serviceBreakdown.map(s => s.service);
  }, [serviceBreakdown]);

  const allRegions = useMemo(() => {
    return regionBreakdown.map(r => r.region);
  }, [regionBreakdown]);

  const activeFilterCount = selectedServices.length + selectedRegions.length;

  return (
    <ScrollArea className="h-full">
      <section aria-label="Cost Analytics" className="p-6 max-w-[1920px] mx-auto" data-testid="analytics-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdTrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cost Analytics</h1>
              <p className="text-sm text-muted-foreground">Analyze spending patterns, trends, and breakdowns across services and tenants</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Feature #17: FilterList Controls */}
            <Popover open={serviceFilterOpen} onOpenChange={setServiceFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(selectedServices.length > 0 && "border-primary text-primary")}>
                  <MdLayers className="h-4 w-4 mr-2" />
                  Services
                  {selectedServices.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{selectedServices.length}</Badge>
                  )}
                  <MdExpandMore className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="flex items-center justify-between mb-2 px-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">FilterList by Service</p>
                  {selectedServices.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedServices([])}>
                      Clear
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-0.5">
                    {allServices.map(service => (
                      <button
                        key={service}
                        onClick={() => toggleServiceFilter(service)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                          selectedServices.includes(service)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: serviceInfo[service]?.color || '#888' }}
                        />
                        <span className="font-mono text-xs">{service}</span>
                        <span className="text-xs text-muted-foreground truncate ml-auto">
                          {serviceInfo[service]?.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Popover open={regionFilterOpen} onOpenChange={setRegionFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(selectedRegions.length > 0 && "border-primary text-primary")}>
                  <MdLocationOn className="h-4 w-4 mr-2" />
                  Region
                  {selectedRegions.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">1</Badge>
                  )}
                  <MdExpandMore className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="flex items-center justify-between mb-2 px-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">FilterList by Region</p>
                  {selectedRegions.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedRegions([])}>
                      Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {allRegions.map(region => (
                    <button
                      key={region}
                      onClick={() => toggleRegionFilter(region)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                        selectedRegions.includes(region)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <span>{regionNames[region]}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedServices([]); setSelectedRegions([]); }}
                className="text-muted-foreground"
              >
                <MdClose className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}

            <Button variant="outline" size="sm">
              <MdDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Active Filters Indicator */}
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-4 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {selectedServices.map(s => (
              <Badge key={s} variant="secondary" className="text-xs gap-1">
                {s}
                <button onClick={() => toggleServiceFilter(s)} className="ml-1 hover:text-destructive">
                  <MdClose className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedRegions.map(r => (
              <Badge key={r} variant="secondary" className="text-xs gap-1">
                {regionNames[r]}
                <button onClick={() => toggleRegionFilter(r)} className="ml-1 hover:text-destructive">
                  <MdClose className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Spend', value: filteredKpis.totalSpend, trend: kpis.spendGrowthRate },
            { label: 'Daily Average', value: filteredKpis.totalSpend / daysInPeriod, trend: null },
            { label: 'Peak Day', value: Math.max(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null },
            { label: 'Lowest Day', value: Math.min(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold font-mono">{formatCompactCurrency(metric.value, currency)}</p>
                    {metric.trend !== null && (
                      <Badge
                        variant={metric.trend > 0 ? "destructive" : "secondary"}
                        className={cn(
                          "text-xs",
                          metric.trend < 0 && "bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        {metric.trend > 0 ? <MdTrendingUp className="h-3 w-3 mr-1" /> : <MdTrendingDown className="h-3 w-3 mr-1" />}
                        {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="trend" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="trend">Cost Trend</TabsTrigger>
            <TabsTrigger value="services">By Service</TabsTrigger>
            <TabsTrigger value="resourceType">By Resource Type</TabsTrigger>
            <TabsTrigger value="regions">By Region</TabsTrigger>
            <TabsTrigger value="tenants">By Tenant</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <MdBarChart className="h-5 w-5 text-primary" />
                      Daily Cost Trend
                    </CardTitle>
                    {/* Gap #12: Selectable time period buttons */}
                    <div className="flex items-center gap-1">
                      <MdSchedule className="h-4 w-4 text-muted-foreground mr-1" />
                      {([7, 14, 30, 90] as const).map(days => (
                        <Button
                          key={days}
                          variant={trendWindow === days ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => setTrendWindow(days)}
                        >
                          {days}d
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendWithForecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={70}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="amount"
                          name="Daily Cost"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCost)"
                          connectNulls={false}
                        />
                        {/* Gap #14: Forecast line/area */}
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="forecast"
                          name="Forecast"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          fillOpacity={1}
                          fill="url(#colorForecast)"
                          connectNulls={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gap #14: Forecast Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdTrendingUp className="h-5 w-5 text-amber-500" />
                    Forecasted Spend (Next 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Daily (Last 7d)</p>
                      <p className="text-xl font-bold font-mono">{formatCompactCurrency(forecastData.avgDaily, currency)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Projected Next 7 Days</p>
                      <p className="text-xl font-bold font-mono text-amber-600">{formatCompactCurrency(forecastData.projectedWeekly, currency)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Projected 30-Day</p>
                      <p className="text-xl font-bold font-mono">{formatCompactCurrency(forecastData.avgDaily * 30, currency)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecastData.points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                          />
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                          <Bar dataKey="forecast" name="Forecast" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} fillOpacity={0.7} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Service Distribution</CardTitle>
                    <p className="text-xs text-muted-foreground">Click a segment to drill down</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={filteredServiceBreakdown.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="cost"
                            nameKey="service"
                            label={({ service, percentage }) => `${service} (${percentage}%)`}
                            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                            onClick={(data: any) => {
                              if (data && data.service) handleServiceClick(data.service);
                            }}
                            className="cursor-pointer"
                          >
                            {filteredServiceBreakdown.slice(0, 8).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={serviceInfo[entry.service]?.color || CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Service Ranking</CardTitle>
                    <p className="text-xs text-muted-foreground">Click a bar to drill down</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredServiceBreakdown.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          onClick={(data: any) => {
                            if (data?.activePayload?.[0]?.payload?.service) {
                              handleServiceClick(data.activePayload[0].payload.service);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="service"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            width={50}
                          />
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                          <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={20} className="cursor-pointer">
                            {filteredServiceBreakdown.slice(0, 10).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={serviceInfo[entry.service]?.color || CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Feature #1: Cost by Resource Type Tab */}
          <TabsContent value="resourceType" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Cost by Resource Category</CardTitle>
                    <p className="text-xs text-muted-foreground">Services grouped by type: Compute, Storage, Database, etc.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryBreakdown}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            width={75}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(label) => `${label} Services`}
                          />
                          <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={28}>
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cat-cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Category Donut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="cost"
                            nameKey="category"
                            label={({ category, cost }) => `${category} (${formatCompactCurrency(cost, currency)})`}
                            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`donut-cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Category detail list */}
                    <div className="space-y-2 mt-4">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                            <div>
                              <p className="text-sm font-medium">{cat.category}</p>
                              <p className="text-xs text-muted-foreground">{cat.services.join(', ')}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-mono font-semibold">{formatCompactCurrency(cat.cost, currency)}</p>
                            <p className="text-xs text-muted-foreground">{cat.resourceCount} resources</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Regional Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredRegionBreakdown}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="region"
                            tickFormatter={(value) => regionNames[value as keyof typeof regionNames]?.split('-')[0] || value}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(label) => regionNames[label as keyof typeof regionNames] || label}
                          />
                          <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Region Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredRegionBreakdown.map((region, index) => (
                        <div key={region.region} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <div>
                              <p className="text-sm font-medium">{regionNames[region.region]}</p>
                              <p className="text-xs text-muted-foreground">{region.resourceCount} resources</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold">{formatCurrency(region.cost, currency)}</p>
                            <p className="text-xs text-muted-foreground">{region.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Gap #10: Cost by Tenant */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <MdPeople className="h-5 w-5 text-primary" />
                      Spend by Tenant
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Cost distribution across all tenants</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={tenantSummaries}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="tenant.name"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            width={95}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.tenant?.name || ''}
                          />
                          <Bar dataKey="totalSpend" name="Total Spend" radius={[0, 4, 4, 0]} maxBarSize={24}>
                            {tenantSummaries.map((_, index) => (
                              <Cell key={`tenant-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Tenant Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tenantSummaries.map((ts, index) => {
                        const totalAllTenants = tenantSummaries.reduce((sum, t) => sum + t.totalSpend, 0);
                        const pct = totalAllTenants > 0 ? (ts.totalSpend / totalAllTenants) * 100 : 0;
                        return (
                          <div key={ts.tenant.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{ts.tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ts.tenant.industry} &middot; Top: {ts.topService} &middot; Budget: {ts.budgetUsage.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-mono font-semibold">{formatCompactCurrency(ts.totalSpend, currency)}</p>
                              <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% of total</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Feature #2: Enhanced Period Comparison + Gap #16: Cross-tenant/region comparison */}
          <TabsContent value="comparison" className="space-y-6">
            {/* Gap #16: Comparison mode selector */}
            <div className="flex items-center gap-2">
              {(['periods', 'tenants', 'regions'] as const).map(mode => (
                <Button
                  key={mode}
                  variant={comparisonMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setComparisonMode(mode)}
                >
                  {mode === 'periods' ? 'By Time Period' : mode === 'tenants' ? 'Across Tenants' : 'Across Regions'}
                </Button>
              ))}
            </div>

            {comparisonMode === 'periods' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Period Comparison</CardTitle>
                    <Select value={comparisonPeriod} onValueChange={(val) => setComparisonPeriod(val as ComparisonPeriod)}>
                      <SelectTrigger className="w-[200px] h-8 text-sm">
                        <MdCalendarToday className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week vs Last Week</SelectItem>
                        <SelectItem value="month">This Month vs Last Month</SelectItem>
                        <SelectItem value="quarter">This Quarter vs Last Quarter</SelectItem>
                        <SelectItem value="custom">Custom Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonData.chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="service"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value, currency)}
                        />
                        <Legend />
                        <Bar dataKey="previous" name={comparisonData.labels.previous} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="current" name={comparisonData.labels.current} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{comparisonData.labels.previous}</p>
                      <p className="text-lg font-mono font-semibold">
                        {formatCompactCurrency(comparisonData.chartData.reduce((s, d) => s + d.previous, 0), currency)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{comparisonData.labels.current}</p>
                      <p className="text-lg font-mono font-semibold">
                        {formatCompactCurrency(comparisonData.chartData.reduce((s, d) => s + d.current, 0), currency)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Change</p>
                      {(() => {
                        const prev = comparisonData.chartData.reduce((s, d) => s + d.previous, 0);
                        const curr = comparisonData.chartData.reduce((s, d) => s + d.current, 0);
                        const change = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
                        return (
                          <Badge
                            variant={change > 0 ? "destructive" : "secondary"}
                            className={cn("text-sm", change < 0 && "bg-emerald-500/10 text-emerald-500")}
                          >
                            {change > 0 ? <MdTrendingUp className="h-3 w-3 mr-1" /> : <MdTrendingDown className="h-3 w-3 mr-1" />}
                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* Gap #16: Cross-Tenant Service Comparison */}
            {comparisonMode === 'tenants' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Service Cost Across Tenants</CardTitle>
                  <p className="text-xs text-muted-foreground">Top services compared across all tenants</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={crossTenantData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="service"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend />
                        {mockTenants.map((tenant, i) => (
                          <Bar
                            key={tenant.id}
                            dataKey={tenant.name}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={24}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Table view */}
                  <div className="mt-4 pt-4 border-t border-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Service</th>
                          {mockTenants.map((t, i) => (
                            <th key={t.id} className="text-right py-2 px-2 text-xs font-medium" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                              {t.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {crossTenantData.map((row) => (
                          <tr key={row.service} className="border-b border-border/50">
                            <td className="py-2 px-2 font-mono text-xs">{row.service}</td>
                            {mockTenants.map((t) => (
                              <td key={t.id} className="text-right py-2 px-2 font-mono text-xs">
                                {formatCompactCurrency(row[t.name] || 0, currency)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* Gap #16: Cross-Region Service Comparison */}
            {comparisonMode === 'regions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Service Cost Across Regions</CardTitle>
                  <p className="text-xs text-muted-foreground">Top services compared across top regions</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={crossRegionServiceData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="service"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend />
                        {filteredRegionBreakdown.slice(0, 4).map((region, i) => (
                          <Bar
                            key={region.region}
                            dataKey={regionNames[region.region] || region.region}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={24}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Table view */}
                  <div className="mt-4 pt-4 border-t border-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Service</th>
                          {filteredRegionBreakdown.slice(0, 4).map((r, i) => (
                            <th key={r.region} className="text-right py-2 px-2 text-xs font-medium" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                              {regionNames[r.region]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {crossRegionServiceData.map((row) => (
                          <tr key={row.service} className="border-b border-border/50">
                            <td className="py-2 px-2 font-mono text-xs">{row.service}</td>
                            {filteredRegionBreakdown.slice(0, 4).map((r) => {
                              const regionLabel = regionNames[r.region] || r.region;
                              return (
                                <td key={r.region} className="text-right py-2 px-2 font-mono text-xs">
                                  {formatCompactCurrency(row[regionLabel] || 0, currency)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Feature #4: Drilldown Dialog */}
        <Dialog open={!!drilldownService} onOpenChange={(open) => { if (!open) setDrilldownService(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {drilldownData && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: drilldownData.color }} />
                    <span>{drilldownData.serviceName} ({drilldownData.service})</span>
                    <Badge variant="outline" className="ml-2 text-xs">{drilldownData.category}</Badge>
                  </DialogTitle>
                </DialogHeader>

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-mono font-bold">{formatCompactCurrency(drilldownData.totalCost, currency)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Share of Spend</p>
                    <p className="text-lg font-mono font-bold">{drilldownData.percentage}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Resources</p>
                    <p className="text-lg font-mono font-bold">{drilldownData.resourceCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Avg Cost / Resource</p>
                    <p className="text-lg font-mono font-bold">{formatCompactCurrency(drilldownData.avgCostPerResource, currency)}</p>
                  </div>
                </div>

                {/* Trend chart */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Daily Trend (Last 14 Days)</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={drilldownData.dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="drilldownGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={drilldownData.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={drilldownData.color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={60}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          name="Daily Cost"
                          stroke={drilldownData.color}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#drilldownGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Region breakdown for this service */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Cost by Region</h3>
                  <div className="space-y-2">
                    {drilldownData.regionDetail.slice(0, 6).map((r, index) => {
                      const maxCost = drilldownData.regionDetail[0]?.cost || 1;
                      const barWidth = (r.cost / maxCost) * 100;
                      return (
                        <div key={r.region} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{r.regionName}</span>
                            <span className="font-mono font-semibold">{formatCurrency(r.cost, currency)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: drilldownData.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trend badge */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Period trend:</span>
                  <Badge
                    variant={drilldownData.trend > 0 ? "destructive" : "secondary"}
                    className={cn("text-xs", drilldownData.trend < 0 && "bg-emerald-500/10 text-emerald-500")}
                  >
                    {drilldownData.trend > 0 ? <MdTrendingUp className="h-3 w-3 mr-1" /> : <MdTrendingDown className="h-3 w-3 mr-1" />}
                    {drilldownData.trend > 0 ? '+' : ''}{drilldownData.trend.toFixed(1)}% vs previous period
                  </Badge>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </ScrollArea>
  );
}
