import { MdDownload, MdTrendingUp } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinOpsStore, formatCompactCurrency } from '@/lib/finops-store';
import { generateCostTrend, getDaysFromPreset } from '@/lib/mock-data';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';

export function CostTrendChart() {
  const { currency, selectedTenantId, selectedRegion, dateRange } = useFinOpsStore();

  const daysToShow = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);

  const costTrend = useMemo(() => generateCostTrend(selectedTenantId, daysToShow, selectedRegion), [selectedTenantId, daysToShow, selectedRegion]);

  const today = new Date().toISOString().split('T')[0];
  const totalActual = costTrend
    .filter(d => d.amount > 0)
    .reduce((sum, d) => sum + d.amount, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isForecast = data.forecast && data.forecast > 0;
      
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{formatDate(label)}</p>
          {isForecast ? (
            <p className="text-sm font-mono font-semibold text-amber-500">
              Forecast: {formatCompactCurrency(data.forecast, currency)}
            </p>
          ) : (
            <p className="text-sm font-mono font-semibold text-primary">
              Actual: {formatCompactCurrency(data.amount, currency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdTrendingUp className="h-5 w-5 text-primary" />
              Cost Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Last {daysToShow} days with 7-day forecast
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Forecast</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" data-testid="button-export-trend">
              <MdDownload className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" data-testid="chart-cost-trend">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={costTrend}
                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--border))" 
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value, currency)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  x={today}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Today',
                    position: 'top',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">{daysToShow}-Day Total</p>
              <p className="text-xl font-bold font-mono">{formatCompactCurrency(totalActual, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Daily Average</p>
              <p className="text-xl font-bold font-mono">{formatCompactCurrency(totalActual / daysToShow, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
