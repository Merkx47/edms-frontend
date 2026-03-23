import { MdAccountBalanceWallet, MdExpandLess, MdExpandMore, MdLayers, MdPeople } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateServiceBreakdown, generateTenantSummaries } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useMemo, useState } from 'react';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

const COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

export default function Allocation() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === 'dark' ? 'white' : 'black';
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllTenants, setShowAllTenants] = useState(false);

  const serviceBreakdown = useMemo(() => generateServiceBreakdown(selectedTenantId, 30, selectedRegion), [selectedTenantId, selectedRegion]);
  const tenantSummaries = useMemo(() => generateTenantSummaries(selectedRegion), [selectedRegion]);

  const serviceTreemapData = serviceBreakdown.slice(0, 12).map((s, i) => ({
    name: s.service,
    size: s.cost,
    fill: serviceInfo[s.service]?.color || COLORS[i % COLORS.length],
  }));

  const tenantTreemapData = tenantSummaries.map((t, i) => ({
    name: t.tenant.name,
    size: t.totalSpend,
    fill: COLORS[i % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium mb-1">{data.name}</p>
          <p className="text-lg font-mono font-bold">{formatCurrency(data.size, currency)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="allocation-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdAccountBalanceWallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cost Allocation</h1>
              <p className="text-sm text-muted-foreground">Visualize cost distribution across services and tenants</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MdLayers className="h-5 w-5 text-primary" />
                  Allocation by Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={serviceTreemapData}
                      dataKey="size"
                      aspectRatio={4/3}
                      stroke="hsl(var(--background))"
                      fill="#8884d8"
                      content={({ x, y, width, height, name, fill }: any) => {
                        const showText = name && width >= 50 && height >= 30;
                        return (
                          <g>
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={fill}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                              rx={4}
                            />
                            {showText && (
                              <text
                                x={x + width / 2}
                                y={y + height / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={textColor}
                                stroke="none"
                                fontSize={12}
                                fontWeight={500}
                                fontFamily="system-ui, -apple-system, sans-serif"
                              >
                                {name}
                              </text>
                            )}
                          </g>
                        );
                      }}
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {(showAllServices ? serviceBreakdown : serviceBreakdown.slice(0, 6)).map((s) => (
                      <Badge
                        key={s.service}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${serviceInfo[s.service]?.color}20`,
                          color: serviceInfo[s.service]?.color,
                        }}
                      >
                        {s.service}: {formatCompactCurrency(s.cost, currency)}
                      </Badge>
                    ))}
                  </div>
                  {serviceBreakdown.length > 6 && (
                    <button
                      onClick={() => setShowAllServices(!showAllServices)}
                      className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAllServices ? <MdExpandLess className="h-3 w-3" /> : <MdExpandMore className="h-3 w-3" />}
                      {showAllServices ? 'Show less' : `Show all (${serviceBreakdown.length})`}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MdPeople className="h-5 w-5 text-primary" />
                  Allocation by Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={tenantTreemapData}
                      dataKey="size"
                      aspectRatio={4/3}
                      stroke="hsl(var(--background))"
                      fill="#8884d8"
                      content={({ x, y, width, height, name, fill }: any) => {
                        const showText = name && width >= 60 && height >= 35;
                        const displayName = name && name.length > 12 ? name.slice(0, 10) + '...' : name;
                        return (
                          <g>
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={fill}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                              rx={4}
                            />
                            {showText && (
                              <text
                                x={x + width / 2}
                                y={y + height / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={textColor}
                                stroke="none"
                                fontSize={12}
                                fontWeight={500}
                                fontFamily="system-ui, -apple-system, sans-serif"
                              >
                                {displayName}
                              </text>
                            )}
                          </g>
                        );
                      }}
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {(showAllTenants ? tenantSummaries : tenantSummaries.slice(0, 4)).map((t) => (
                      <Badge
                        key={t.tenant.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {t.tenant.name}: {formatCompactCurrency(t.totalSpend, currency)}
                      </Badge>
                    ))}
                  </div>
                  {tenantSummaries.length > 4 && (
                    <button
                      onClick={() => setShowAllTenants(!showAllTenants)}
                      className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAllTenants ? <MdExpandLess className="h-3 w-3" /> : <MdExpandMore className="h-3 w-3" />}
                      {showAllTenants ? 'Show less' : `Show all (${tenantSummaries.length})`}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ScrollArea>
  );
}
