import { MdAdd, MdArrowForward, MdBarChart, MdApartment, MdDelete, MdEdit, MdEmail, MdFlashOn, MdLightbulb, MdPeople, MdPublic, MdSearch, MdTrackChanges, MdTrendingUp } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { useDataStore } from '@/lib/data-store';
import { generateTenantSummaries, getRegionScale } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';

const industries = ['Manufacturing', 'Telecommunications', 'Fintech', 'Banking', 'Technology', 'E-commerce', 'Healthcare', 'Education'];
const countries = ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Egypt', 'Morocco', 'Tanzania', 'Uganda'];

export default function Tenants() {
  const { currency, setSelectedTenantId, selectedRegion } = useFinOpsStore();
  const { tenants, addTenant, updateTenant, deleteTenant } = useDataStore();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<typeof tenants[0] | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    contactName: '',
    contactEmail: '',
    budget: '',
  });

  const summaries = useMemo(() => {
    // Filter tenants by region — only show tenants with allocation in selected region
    const regionFiltered = selectedRegion === 'all'
      ? tenants
      : tenants.filter(t => getRegionScale(t.id, selectedRegion) > 0);

    return regionFiltered.map(tenant => {
      const regionScale = getRegionScale(tenant.id, selectedRegion);
      const baseSpend = tenant.budget * (0.4 + Math.random() * 0.5) * regionScale;
      return {
        tenant,
        totalSpend: baseSpend,
        budgetUsage: (baseSpend / (tenant.budget * regionScale || 1)) * 100,
        efficiencyScore: tenant.efficiencyScore,
        topService: ['ECS', 'RDS', 'OBS', 'CCE'][Math.floor(Math.random() * 4)] as any,
        recommendationCount: Math.floor(Math.random() * 10) + 1,
      };
    });
  }, [tenants, selectedRegion]);

  const filteredTenants = useMemo(() => {
    return summaries.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tenant.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tenant.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesIndustry = industryFilter === 'all' ||
        s.tenant.industry === industryFilter;

      const matchesCountry = countryFilter === 'all' ||
        s.tenant.country === countryFilter;

      const matchesStatus = statusFilter === 'all' ||
        s.tenant.status === statusFilter;

      return matchesSearch && matchesIndustry && matchesCountry && matchesStatus;
    });
  }, [summaries, searchQuery, industryFilter, countryFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalSpend = summaries.reduce((sum, s) => sum + s.totalSpend, 0);
    const avgEfficiency = summaries.reduce((sum, s) => sum + s.efficiencyScore, 0) / summaries.length;
    const totalRecommendations = summaries.reduce((sum, s) => sum + s.recommendationCount, 0);
    return { totalSpend, avgEfficiency, totalRecommendations };
  }, [summaries]);

  const maxSpend = Math.max(...summaries.map(s => s.totalSpend));

  const viewTenantDashboard = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setLocation(`/tenant/${tenantId}`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      country: '',
      contactName: '',
      contactEmail: '',
      budget: '',
    });
  };

  const handleAddTenant = () => {
    if (!formData.name || !formData.industry || !formData.country) return;

    addTenant({
      name: formData.name,
      industry: formData.industry,
      country: formData.country,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      budget: parseFloat(formData.budget) || 100000,
      efficiencyScore: Math.floor(70 + Math.random() * 25),
      status: 'active',
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditTenant = () => {
    if (!editingTenant || !formData.name) return;

    updateTenant(editingTenant.id, {
      name: formData.name,
      industry: formData.industry,
      country: formData.country,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      budget: parseFloat(formData.budget) || editingTenant.budget,
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingTenant(null);
  };

  const openEditDialog = (tenant: typeof tenants[0]) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      industry: tenant.industry,
      country: tenant.country,
      contactName: tenant.contactName,
      contactEmail: tenant.contactEmail,
      budget: tenant.budget.toString(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="tenants-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdApartment className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tenant Management</h1>
              <p className="text-sm text-muted-foreground">Monitor and manage tenants, their resources, budgets, and cost performance</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <MdAdd className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Create a new tenant for multi-tenant cost management.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g., John Doe"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g., john@acme.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">Monthly Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddTenant} disabled={!formData.name || !formData.industry || !formData.country}>
                  Add Tenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>
                Update tenant information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Company Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactName">Contact Name</Label>
                <Input
                  id="edit-contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-budget">Monthly Budget (USD)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingTenant(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditTenant}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tenants', value: tenants.length, icon: MdApartment, color: 'text-primary' },
            { label: 'Combined Spend', value: formatCurrency(stats.totalSpend, currency), icon: MdBarChart, color: 'text-emerald-500', isValue: true },
            { label: 'Avg Efficiency', value: `${stats.avgEfficiency.toFixed(0)}%`, icon: MdFlashOn, color: 'text-amber-500' },
            { label: 'Pending Actions', value: stats.totalRecommendations, icon: MdLightbulb, color: 'text-blue-500' },
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
                        stat.isValue ? "text-xl" : "text-2xl"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' :
                      stat.color === 'text-amber-500' ? 'bg-amber-500/10' :
                      stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                    )}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MdApartment className="h-5 w-5 text-primary" />
                  All Tenants
                  <Badge variant="secondary" className="ml-2">{filteredTenants.length}</Badge>
                </CardTitle>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                    data-testid="input-search-tenants"
                  />
                </div>
              </div>
              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="Fintech">Fintech</SelectItem>
                    <SelectItem value="Banking">Banking</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                {(industryFilter !== 'all' || countryFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => { setIndustryFilter('all'); setCountryFilter('all'); setStatusFilter('all'); }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="tenants-grid">
                {filteredTenants.map((summary, index) => (
                  <motion.div
                    key={summary.tenant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div
                      className="p-4 rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                      data-testid={`tenant-card-${summary.tenant.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3" role="button" tabIndex={0} onClick={() => viewTenantDashboard(summary.tenant.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewTenantDashboard(summary.tenant.id); } }}>
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <MdApartment className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{summary.tenant.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{summary.tenant.industry}</span>
                              <span>-</span>
                              <span className="flex items-center gap-1">
                                <MdPublic className="h-3 w-3" />
                                {summary.tenant.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(summary.tenant); }}
                          >
                            <MdEdit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MdDelete className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {summary.tenant.name}? This action cannot be undone and will remove all associated budgets and data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteTenant(summary.tenant.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4" role="button" tabIndex={0} onClick={() => viewTenantDashboard(summary.tenant.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewTenantDashboard(summary.tenant.id); } }}>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Monthly Spend</span>
                            <span className="font-mono font-medium">{formatCompactCurrency(summary.totalSpend, currency)}</span>
                          </div>
                          <Progress
                            value={(summary.totalSpend / maxSpend) * 100}
                            className="h-1.5"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Budget Utilization</span>
                            <span className={cn(
                              "font-mono font-medium",
                              summary.budgetUsage > 90 ? "text-destructive" :
                              summary.budgetUsage > 70 ? "text-amber-500" : "text-emerald-500"
                            )}>{summary.budgetUsage.toFixed(0)}%</span>
                          </div>
                          <Progress
                            value={Math.min(summary.budgetUsage, 100)}
                            className={cn(
                              "h-1.5",
                              summary.budgetUsage > 90 && "[&>div]:bg-destructive",
                              summary.budgetUsage > 70 && summary.budgetUsage <= 90 && "[&>div]:bg-amber-500"
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4" role="button" tabIndex={0} onClick={() => viewTenantDashboard(summary.tenant.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewTenantDashboard(summary.tenant.id); } }}>
                          <div className="flex items-center gap-1">
                            <MdFlashOn className={cn(
                              "h-4 w-4",
                              summary.efficiencyScore >= 80 ? "text-emerald-500" :
                              summary.efficiencyScore >= 60 ? "text-amber-500" : "text-destructive"
                            )} />
                            <span className="text-sm font-mono">{summary.efficiencyScore}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MdLightbulb className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-mono">{summary.recommendationCount}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${serviceInfo[summary.topService]?.color}20`,
                              color: serviceInfo[summary.topService]?.color,
                            }}
                          >
                            {summary.topService}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => viewTenantDashboard(summary.tenant.id)}
                        >
                          View Dashboard
                          <MdArrowForward className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MdEmail className="h-3 w-3" />
                          <span>{summary.tenant.contactEmail}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTenants.length === 0 && (
                <div className="text-center py-12">
                  <MdPeople className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tenants Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query or add a new tenant.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
