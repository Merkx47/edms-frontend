import { MdCheckCircle, MdTrackChanges, MdWarning } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateKPIs } from '@/lib/mock-data';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BudgetGauge() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  const kpis = useMemo(() => generateKPIs(selectedTenantId, 30, selectedRegion), [selectedTenantId, selectedRegion]);
  
  const percentage = Math.min(kpis.budgetUsed, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage >= 90) return { stroke: '#ef4444', bg: 'bg-red-500/10' };
    if (percentage >= 70) return { stroke: '#f59e0b', bg: 'bg-amber-500/10' };
    return { stroke: '#22c55e', bg: 'bg-emerald-500/10' };
  };
  
  const { stroke, bg } = getColor();
  
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const expectedPercentage = (currentDay / daysInMonth) * 100;
  const burnRate = kpis.totalSpend / currentDay;
  const projectedSpend = burnRate * daysInMonth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MdTrackChanges className="h-5 w-5 text-primary" />
            Budget Status
          </CardTitle>
          {percentage >= 90 ? (
            <MdWarning className="h-5 w-5 text-destructive" />
          ) : percentage >= 70 ? (
            <MdWarning className="h-5 w-5 text-amber-500" />
          ) : (
            <MdCheckCircle className="h-5 w-5 text-emerald-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center" data-testid="budget-gauge">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={stroke}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="hsl(var(--border))"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(expectedPercentage / 100) * circumference} ${circumference}`}
                  strokeOpacity="0.3"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono">{percentage.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">of budget</span>
              </div>
            </div>
            
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-mono font-medium">{formatCurrency(kpis.totalSpend, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-mono font-medium">{formatCurrency(kpis.totalBudget, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className={cn(
                  "font-mono font-medium",
                  kpis.totalBudget - kpis.totalSpend < 0 ? "text-destructive" : "text-emerald-500"
                )}>
                  {formatCurrency(Math.max(0, kpis.totalBudget - kpis.totalSpend), currency)}
                </span>
              </div>
              
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Burn Rate</span>
                  <span className="font-mono font-medium">{formatCurrency(burnRate, currency)}/day</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Projected EOM</span>
                  <span className={cn(
                    "font-mono font-medium",
                    projectedSpend > kpis.totalBudget ? "text-destructive" : "text-emerald-500"
                  )}>
                    {formatCompactCurrency(projectedSpend, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
