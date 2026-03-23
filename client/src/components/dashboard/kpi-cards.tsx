import { MdAccountBalanceWallet, MdDns, MdFlashOn, MdLightbulb, MdSavings, MdTrackChanges, MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateKPIs, getDaysFromPreset } from '@/lib/mock-data';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: typeof MdTrendingUp;
  iconColor?: string;
  delay?: number;
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendLabel,
  icon: Icon,
  iconColor = 'text-primary',
  delay = 0,
}: KPICardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="hover-elevate h-full bg-card/50 backdrop-blur-sm border-card-border">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {title}
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight text-foreground truncate" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value}
              </p>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={isPositiveTrend ? "destructive" : isNegativeTrend ? "secondary" : "secondary"}
                    className={cn(
                      "text-xs font-medium",
                      isNegativeTrend && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    )}
                  >
                    {isPositiveTrend ? (
                      <MdTrendingUp className="h-3 w-3 mr-1" />
                    ) : isNegativeTrend ? (
                      <MdTrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {trend > 0 ? '+' : ''}{trend}%
                  </Badge>
                  {trendLabel && (
                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl bg-muted/50", iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KPICards() {
  const { currency, selectedTenantId, selectedRegion, dateRange } = useFinOpsStore();

  const daysInPeriod = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);

  const kpis = useMemo(() => generateKPIs(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);

  // Get a label for the time period
  const periodLabel = useMemo(() => {
    switch (dateRange.preset) {
      case 'last7days': return 'Last 7 Days';
      case 'last30days': return 'Last 30 Days';
      case 'last90days': return 'Last 90 Days';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      default: return 'Selected Period';
    }
  }, [dateRange.preset]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="kpi-cards-grid">
      <KPICard
        title={`Total Spend (${periodLabel})`}
        value={formatCurrency(kpis.totalSpend, currency)}
        trend={kpis.spendGrowthRate}
        trendLabel="vs previous period"
        icon={MdAccountBalanceWallet}
        iconColor="text-primary"
        delay={0}
      />
      <KPICard
        title="Budget Utilization"
        value={`${kpis.budgetUsed}%`}
        subtitle={`${formatCompactCurrency(kpis.totalSpend, currency)} of ${formatCompactCurrency(kpis.totalBudget, currency)}`}
        icon={MdTrackChanges}
        iconColor={kpis.budgetUsed > 90 ? "text-destructive" : kpis.budgetUsed > 70 ? "text-amber-500" : "text-emerald-500"}
        delay={0.1}
      />
      <KPICard
        title="Active Resources"
        value={kpis.activeResources.toLocaleString()}
        subtitle={`${formatCurrency(kpis.costPerResource, currency)} avg/resource`}
        icon={MdDns}
        iconColor="text-blue-500"
        delay={0.2}
      />
      <KPICard
        title="Potential Savings"
        value={formatCurrency(kpis.potentialSavings, currency)}
        subtitle={`${kpis.optimizationOpportunities} opportunities`}
        icon={MdSavings}
        iconColor="text-emerald-500"
        delay={0.3}
      />
    </div>
  );
}

export function SecondaryKPIs() {
  const { currency, selectedTenantId, selectedRegion, dateRange } = useFinOpsStore();

  const daysInPeriod = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);

  const kpis = useMemo(() => generateKPIs(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Efficiency Score</p>
              <p className="text-2xl font-bold font-mono">{kpis.averageEfficiency}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
              <MdFlashOn className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Optimization Opportunities</p>
              <p className="text-2xl font-bold font-mono">{kpis.optimizationOpportunities}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
              <MdLightbulb className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cost per Resource</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(kpis.costPerResource, currency)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
              <MdDns className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
