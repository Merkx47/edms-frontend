import { MdAccessTime, MdAccountTree, MdArrowForward, MdCheckCircle, MdDns, MdLightbulb, MdSpeed, MdStorage, MdTrendingDown, MdWarning } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateRecommendations } from '@/lib/mock-data';
import { serviceInfo, type RecommendationType, type RecommendationImpact } from '@shared/schema';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

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
  storage_optimization: 'Storage',
  network_optimization: 'Network',
  database_tuning: 'Database',
};

const impactColors: Record<RecommendationImpact, string> = {
  high: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const statusIcons = {
  new: MdWarning,
  in_progress: MdAccessTime,
  implemented: MdCheckCircle,
  dismissed: null,
};

export function RecommendationsPanel() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  const recommendations = useMemo(() => generateRecommendations(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);
  const topRecommendations = recommendations.filter(r => r.status === 'new').slice(0, 4);
  
  const totalSavings = recommendations
    .filter(r => r.status === 'new')
    .reduce((sum, r) => sum + r.projectedSavings, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdLightbulb className="h-5 w-5 text-amber-500" />
              Cost Optimization Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered insights to reduce your cloud spend
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Potential Savings</p>
              <p className="text-lg font-mono font-bold text-emerald-500">
                {formatCurrency(totalSavings, currency)}
              </p>
            </div>
            <Link href="/recommendations">
              <Button variant="outline" size="sm" data-testid="button-view-all-recommendations">
                View All
                <MdArrowForward className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="recommendations-grid">
            {topRecommendations.map((rec, index) => {
              const Icon = typeIcons[rec.type];
              const StatusIcon = statusIcons[rec.status];
              
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div 
                    className="p-4 rounded-lg border border-border bg-background/50 hover-elevate cursor-pointer"
                    data-testid={`recommendation-card-${rec.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${serviceInfo[rec.service]?.color}20` }}
                      >
                        <Icon 
                          className="h-4 w-4" 
                          style={{ color: serviceInfo[rec.service]?.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium line-clamp-1">{rec.title}</h4>
                          {StatusIcon && (
                            <StatusIcon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              rec.status === 'new' ? "text-amber-500" : "text-blue-500"
                            )} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {rec.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[rec.type]}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={cn("text-xs border", impactColors[rec.impact])}
                            >
                              {rec.impact.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-500">
                            <MdTrendingDown className="h-3 w-3" />
                            <span className="text-sm font-mono font-semibold">
                              {formatCompactCurrency(rec.projectedSavings, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {topRecommendations.length === 0 && (
            <div className="text-center py-8">
              <MdCheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No new recommendations. Your cloud is optimized!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RecommendationsSummary() {
  const { currency, selectedTenantId, selectedRegion } = useFinOpsStore();

  const recommendations = useMemo(() => generateRecommendations(selectedTenantId, selectedRegion), [selectedTenantId, selectedRegion]);
  
  const byType = recommendations.reduce((acc, rec) => {
    if (!acc[rec.type]) acc[rec.type] = { count: 0, savings: 0 };
    acc[rec.type].count++;
    acc[rec.type].savings += rec.projectedSavings;
    return acc;
  }, {} as Record<RecommendationType, { count: number; savings: number }>);

  const byImpact = recommendations.reduce((acc, rec) => {
    if (!acc[rec.impact]) acc[rec.impact] = 0;
    acc[rec.impact]++;
    return acc;
  }, {} as Record<RecommendationImpact, number>);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-card-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recommendations Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">By Impact</span>
          </div>
          <div className="flex items-center gap-2">
            {(['high', 'medium', 'low'] as const).map((impact) => (
              <div 
                key={impact}
                className={cn(
                  "flex-1 text-center py-2 rounded-md border",
                  impactColors[impact]
                )}
              >
                <p className="text-lg font-bold">{byImpact[impact] || 0}</p>
                <p className="text-xs capitalize">{impact}</p>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Opportunities</span>
              <span className="font-mono font-semibold">{recommendations.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
