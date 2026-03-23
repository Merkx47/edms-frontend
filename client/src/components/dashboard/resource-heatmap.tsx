import { MdAccountTree, MdArrowForward, MdDns, MdMemory, MdShowChart } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { generateResources } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

const getUtilizationColor = (value: number) => {
  if (value < 20) return 'bg-red-500';
  if (value < 40) return 'bg-orange-500';
  if (value < 60) return 'bg-amber-500';
  if (value < 80) return 'bg-emerald-400';
  return 'bg-emerald-500';
};

const getUtilizationStatus = (value: number) => {
  if (value < 20) return 'Underutilized';
  if (value < 40) return 'Low';
  if (value < 60) return 'Moderate';
  if (value < 80) return 'Good';
  return 'Optimal';
};

export function ResourceHeatmap() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  const resources = useMemo(() => generateResources(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);
  const displayedResources = resources.filter(r => r.status === 'running').slice(0, 24);
  
  const avgCpu = resources.reduce((sum, r) => sum + r.cpuUtilization, 0) / resources.length;
  const avgMemory = resources.reduce((sum, r) => sum + r.memoryUtilization, 0) / resources.length;
  // Count underutilized as CPU < 30% (consistent with KPI calculation)
  const underutilized = resources.filter(r => r.cpuUtilization < 30).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdShowChart className="h-5 w-5 text-primary" />
              Resource Utilization
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              CPU utilization heatmap (click for details)
            </p>
          </div>
          <Link href="/resources">
            <Button variant="outline" size="sm" data-testid="button-view-all-resources">
              View All
              <MdArrowForward className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Low</span>
              <div className="flex gap-0.5">
                <div className="h-3 w-4 bg-red-500 rounded-sm" />
                <div className="h-3 w-4 bg-orange-500 rounded-sm" />
                <div className="h-3 w-4 bg-amber-500 rounded-sm" />
                <div className="h-3 w-4 bg-emerald-400 rounded-sm" />
                <div className="h-3 w-4 bg-emerald-500 rounded-sm" />
              </div>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {underutilized} underutilized
            </Badge>
          </div>
          
          <div 
            className="grid grid-cols-6 md:grid-cols-8 gap-1"
            data-testid="resource-heatmap-grid"
          >
            {displayedResources.map((resource, index) => (
              <Tooltip key={resource.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.02 * index }}
                    className={cn(
                      "aspect-square rounded-md cursor-pointer transition-transform hover:scale-110 hover:z-10",
                      getUtilizationColor(resource.cpuUtilization)
                    )}
                    data-testid={`heatmap-cell-${resource.id}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">{resource.name}</span>
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <MdMemory className="h-3 w-3" />
                        <span>CPU: {resource.cpuUtilization}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdMemory className="h-3 w-3" />
                        <span>Mem: {resource.memoryUtilization}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdAccountTree className="h-3 w-3" />
                        <span>Net: {resource.networkUtilization}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdDns className="h-3 w-3" />
                        <span>Disk: {resource.diskUtilization}%</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Monthly cost</span>
                      <span className="font-mono font-medium">{formatCurrency(resource.monthlyCost, currency)}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MdMemory className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold font-mono">{avgCpu.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg CPU</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MdMemory className="h-4 w-4 text-purple-500" />
                <span className="text-lg font-bold font-mono">{avgMemory.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg Memory</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MdShowChart className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-bold font-mono">{resources.filter(r => r.status === 'running').length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Running</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MdShowChart className="h-4 w-4 text-destructive" />
                <span className="text-lg font-bold font-mono">{underutilized}</span>
              </div>
              <p className="text-xs text-muted-foreground">Underutilized</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
