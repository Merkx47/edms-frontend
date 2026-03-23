import { MdApartment, MdCalendarToday, MdCheckCircle, MdDarkMode, MdInfoOutline, MdLightMode, MdLogout, MdNotifications, MdPerson, MdPublic, MdSettings, MdWarning } from 'react-icons/md';
import { useFinOpsStore, formatCompactCurrency } from '@/lib/finops-store';
import { mockTenants, generateKPIs, getDaysFromPreset, getRegionScale } from '@/lib/mock-data';
import { LanguageSelector } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Currency, DateRangePreset, HuaweiRegion } from '@shared/schema';
import { regionNames } from '@shared/schema';
import huaweiLogo from '@assets/image_1764758201045.png';
import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDataStore } from '@/lib/data-store';

// Mock notifications data
const notifications = [
  {
    id: '1',
    type: 'warning',
    title: 'Budget Alert',
    message: 'TechCorp Global is at 85% of monthly budget',
    time: '5 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New Recommendation',
    message: '3 new cost optimization opportunities found',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Savings Applied',
    message: 'Reserved instance purchase saved $2,400/month',
    time: '3 hours ago',
    read: true,
  },
];

const currencyOptions: { value: Currency; label: string; flag: string }[] = [
  { value: 'CNY', label: 'CNY', flag: '🇨🇳' },
  { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
  { value: 'JPY', label: 'JPY', flag: '🇯🇵' },
  { value: 'NGN', label: 'NGN', flag: '🇳🇬' },
  { value: 'USD', label: 'USD', flag: '🇺🇸' },
];

const regionOptions: { value: HuaweiRegion | 'all'; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  ...(Object.entries(regionNames) as [HuaweiRegion, string][])
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label })),
];

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

export function Header() {
  const [, setLocation] = useLocation();
  const logout = useDataStore((s) => s.logout);
  const {
    currency,
    setCurrency,
    selectedTenantId,
    setSelectedTenantId,
    selectedRegion,
    setSelectedRegion,
    dateRange,
    setDateRange,
  } = useFinOpsStore();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const selectedTenant = useMemo(() => {
    if (selectedTenantId === 'all') return null;
    return mockTenants.find(t => t.id === selectedTenantId);
  }, [selectedTenantId]);

  const daysInPeriod = useMemo(() => getDaysFromPreset(dateRange.preset), [dateRange.preset]);

  const kpis = useMemo(() => generateKPIs(selectedTenantId, daysInPeriod, selectedRegion), [selectedTenantId, daysInPeriod, selectedRegion]);

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (preset) {
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateRange({
          preset,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0],
        });
        return;
    }
    
    setDateRange({
      preset,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  return (
    <header className="h-16 border-b border-border bg-sidebar sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src={huaweiLogo} 
              alt="Huawei Cloud" 
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
              data-testid="img-huawei-logo"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-foreground">FinOps</span>
              <span className="text-xs text-muted-foreground ml-2">Dashboard</span>
            </div>
          </div>
          
          
          <Select 
            value={selectedTenantId} 
            onValueChange={setSelectedTenantId}
          >
            <SelectTrigger
              className="w-[280px] bg-background/50"
              data-testid="select-tenant"
              data-tour="tenant-selector"
            >
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <MdApartment className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="Select Tenant" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-tenant-all">
                <div className="flex items-center gap-2">
                  <span className="font-medium">All Tenants</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedRegion === 'all' ? mockTenants.length : mockTenants.filter(t => getRegionScale(t.id, selectedRegion) > 0).length}
                  </Badge>
                </div>
              </SelectItem>
              {(selectedRegion === 'all' ? mockTenants : mockTenants.filter(t => getRegionScale(t.id, selectedRegion) > 0)).map((tenant) => (
                <SelectItem
                  key={tenant.id}
                  value={tenant.id}
                  data-testid={`select-tenant-${tenant.id}`}
                >
                  <div className="flex items-center justify-between gap-3 w-full whitespace-nowrap">
                    <span className="truncate">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{tenant.country}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedRegion}
            onValueChange={(value) => setSelectedRegion(value as HuaweiRegion | 'all')}
          >
            <SelectTrigger className="w-[160px] bg-background/50 border-border">
              <MdPublic className="h-4 w-4 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <span className="text-xs text-muted-foreground">{daysInPeriod}D Spend:</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              {formatCompactCurrency(kpis.totalSpend, currency)}
            </span>
            <Badge 
              variant={kpis.spendGrowthRate > 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {kpis.spendGrowthRate > 0 ? '+' : ''}{kpis.spendGrowthRate}%
            </Badge>
          </div>

          <Select
            value={dateRange.preset}
            onValueChange={(value) => handleDateRangeChange(value as DateRangePreset)}
          >
            <SelectTrigger
              className="w-[160px] bg-background/50"
              data-testid="select-date-range"
              data-tour="date-range"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <MdCalendarToday className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  data-testid={`select-date-${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={currency} 
            onValueChange={(value) => setCurrency(value as Currency)}
          >
            <SelectTrigger 
              className="w-[100px] bg-background/50"
              data-testid="select-currency"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  data-testid={`select-currency-${option.value}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <LanguageSelector />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            data-testid="button-theme-toggle"
            data-tour="theme-toggle"
          >
            {isDark ? (
              <MdLightMode className="h-4 w-4" />
            ) : (
              <MdDarkMode className="h-4 w-4" />
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
                data-tour="notifications"
              >
                <MdNotifications className="h-4 w-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  <Badge variant="secondary" className="text-xs">
                    {notifications.filter(n => !n.read).length} new
                  </Badge>
                </div>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const IconComponent = notification.type === 'warning' ? MdWarning
                      : notification.type === 'success' ? MdCheckCircle
                      : MdInfoOutline;
                    const iconColor = notification.type === 'warning' ? 'text-amber-500'
                      : notification.type === 'success' ? 'text-emerald-500'
                      : 'text-blue-500';

                    return (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${iconColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="px-4 py-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setLocation('/notifications')}>
                  View All Notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-user-menu"
              >
                <MdPerson className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@huawei.com</p>
              </div>
              <DropdownMenuItem
                data-testid="menu-item-profile"
                onClick={() => setLocation('/settings')}
              >
                <MdPerson className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="menu-item-settings"
                onClick={() => setLocation('/settings')}
              >
                <MdSettings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                data-testid="menu-item-logout"
                onClick={() => { logout(); setLocation('/login'); }}
              >
                <MdLogout className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
