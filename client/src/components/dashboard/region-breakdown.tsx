import { MdPublic } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateRegionBreakdown, getDaysFromPreset } from '@/lib/mock-data';
import { regionNames } from '@shared/schema';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

const REGION_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60',
];

export function RegionBreakdownChart() {
  const { currency, selectedTenantId, selectedRegion, dateRange } = useFinOpsStore();

  const daysInPeriod = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);
  const breakdown = useMemo(() => generateRegionBreakdown(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);
  
  const chartData = breakdown.map((item, index) => ({
    region: item.region,
    name: regionNames[item.region],
    cost: item.cost,
    percentage: item.percentage,
    resourceCount: item.resourceCount,
    color: REGION_COLORS[index % REGION_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium mb-1">{data.name}</p>
          <p className="text-lg font-mono font-bold">{formatCompactCurrency(data.cost, currency)}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{data.percentage}% of total</span>
            <span>{data.resourceCount} resources</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdPublic className="h-5 w-5 text-primary" />
              Regional Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Cost by Huawei Cloud region</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]" data-testid="chart-region-distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={false} 
                  stroke="hsl(var(--border))" 
                />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => formatCompactCurrency(value, currency)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                <Bar 
                  dataKey="cost" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Top Region</p>
                <p className="text-sm font-medium">{regionNames[breakdown[0]?.region]}</p>
                <p className="text-lg font-mono font-bold text-primary">
                  {formatCompactCurrency(breakdown[0]?.cost || 0, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Africa (Johannesburg)</p>
                <p className="text-sm font-medium">Primary Region</p>
                <p className="text-lg font-mono font-bold">
                  {breakdown.find(b => b.region === 'af-south-1')?.percentage || 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
