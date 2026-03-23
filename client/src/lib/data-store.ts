import { create } from 'zustand';
import type { Tenant, Recommendation, Currency } from '@shared/schema';
import { currencyInfo } from '@shared/schema';
import { mockTenants as initialTenants, generateRecommendations } from './mock-data';
import { toast } from '@/hooks/use-toast';

// Entity types for HCS hierarchy
export type EntityType = 'zone' | 'tenant' | 'vdc1' | 'vdc2' | 'vdc3' | 'vdc4' | 'vdc5';

// Budget type
export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThreshold: number;
  createdAt: string;
  // New fields for HCS hierarchy support
  entityType: EntityType;
  entityId: string;
  entityPath: string; // e.g., "Region - Lagos MTN-1 > Dangote Industries > IT Division"
}

// Settings types
export interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
}

export interface NotificationSettings {
  budgetAlerts: boolean;
  costAnomalies: boolean;
  newRecommendations: boolean;
  reportReady: boolean;
}

export interface ApiCredentials {
  accessKey: string;
  secretKey: string;
  projectId: string;
  isConnected: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

export type Language = 'en' | 'fr' | 'ar' | 'zh' | 'pt';

// Tag Governance types
export type ValueType = 'string' | 'int' | 'float' | 'bool' | 'date' | 'json' | 'list' | 'enum';
export type TagGroupScope = 'all' | 'vdc' | 'resource';

export interface TagKey {
  id: string;
  key: string;
  valueType: ValueType;
  required: boolean;
  allowedValues: string;
  description: string;
}

export interface TagGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  tags: TagKey[];
  scope: TagGroupScope;
  scopeTargets: string[];
  appliedTo: number;
  createdAt: string;
}

export type ExchangeRates = Record<Currency, number>;

export const defaultExchangeRates: ExchangeRates = Object.fromEntries(
  Object.entries(currencyInfo).map(([key, info]) => [key, info.rate])
) as ExchangeRates;

export interface Settings {
  profile: ProfileSettings;
  timezone: string;
  language: Language;
  notifications: NotificationSettings;
  apiCredentials: ApiCredentials;
  security: SecuritySettings;
  exchangeRates: ExchangeRates;
}

// Report type
export type ReportType =
  | 'Cost Summary'
  | 'Tenant Cost'
  | 'Service Cost'
  | 'Resource Cost'
  | 'Budget Utilization'
  | 'Budget Breach'
  | 'Savings Opportunities'
  | 'Idle Resource'
  | 'Custom';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

export interface ReportFilters {
  tenants?: string[];
  services?: string[];
  dateRange?: string;
  metrics?: string[];
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  schedule: 'Daily' | 'Weekly' | 'Monthly' | 'On-demand';
  lastRun: string;
  status: 'ready' | 'running' | 'failed';
  exportFormat: ExportFormat;
  sharedWith: string[];
  description: string;
  filters: ReportFilters;
}

// Initial mock data
const initialBudgets: Budget[] = [
  { id: 'budget-1', tenantId: 'tenant-1', name: 'Dangote Monthly Budget', amount: 25000000, period: 'monthly', alertThreshold: 80, createdAt: '2024-01-01', entityType: 'tenant', entityId: 'tenant-1', entityPath: 'Region - Lagos MTN-1 > Dangote Industries' },
  { id: 'budget-2', tenantId: 'tenant-2', name: 'MTN Monthly Budget', amount: 50000000, period: 'monthly', alertThreshold: 85, createdAt: '2024-01-01', entityType: 'tenant', entityId: 'tenant-2', entityPath: 'Region - Lagos MTN-1 > MTN Nigeria' },
  { id: 'budget-3', tenantId: 'tenant-3', name: 'Flutterwave Monthly Budget', amount: 18000000, period: 'monthly', alertThreshold: 75, createdAt: '2024-01-01', entityType: 'tenant', entityId: 'tenant-3', entityPath: 'Region - AF South > Flutterwave' },
  { id: 'budget-4', tenantId: 'tenant-1', name: 'IT Division Budget', amount: 11250000, period: 'monthly', alertThreshold: 80, createdAt: '2024-01-15', entityType: 'vdc1', entityId: 'vdc-it-division', entityPath: 'Region - Lagos MTN-1 > Dangote Industries > IT Division' },
  { id: 'budget-5', tenantId: 'tenant-2', name: 'MTN Development Team', amount: 15000000, period: 'monthly', alertThreshold: 90, createdAt: '2024-01-20', entityType: 'vdc2', entityId: 'vdc-dev-team', entityPath: 'Region - Lagos MTN-1 > MTN Nigeria > IT Division > Development Team' },
];

const initialReports: Report[] = [
  { id: 'report-1', name: 'Monthly Cost Summary', type: 'Cost Summary', schedule: 'Monthly', lastRun: '2024-01-01', status: 'ready', exportFormat: 'csv', sharedWith: [], description: 'Overall monthly cost summary across all tenants and services.', filters: {} },
  { id: 'report-2', name: 'Tenant Cost Breakdown', type: 'Tenant Cost', schedule: 'Weekly', lastRun: '2024-01-03', status: 'ready', exportFormat: 'pdf', sharedWith: ['amaka.eze@mtn.ng'], description: 'Cost breakdown by tenant with trend analysis.', filters: {} },
  { id: 'report-3', name: 'Service Cost Analysis', type: 'Service Cost', schedule: 'Monthly', lastRun: '2024-01-02', status: 'ready', exportFormat: 'excel', sharedWith: [], description: 'Detailed cost analysis per Huawei Cloud service.', filters: {} },
  { id: 'report-4', name: 'Resource Cost Detail', type: 'Resource Cost', schedule: 'Weekly', lastRun: '2024-01-05', status: 'ready', exportFormat: 'csv', sharedWith: [], description: 'Granular resource-level cost attribution.', filters: {} },
  { id: 'report-5', name: 'Budget Utilization Report', type: 'Budget Utilization', schedule: 'Monthly', lastRun: '2024-01-01', status: 'ready', exportFormat: 'pdf', sharedWith: ['chidi.okonkwo@dangote.com'], description: 'Budget consumption percentage across all entities.', filters: {} },
  { id: 'report-6', name: 'Budget Breach Alerts', type: 'Budget Breach', schedule: 'Daily', lastRun: '2024-01-05', status: 'ready', exportFormat: 'csv', sharedWith: [], description: 'Entities that have breached or are near breaching budget thresholds.', filters: {} },
  { id: 'report-7', name: 'Savings Opportunities', type: 'Savings Opportunities', schedule: 'Weekly', lastRun: '2024-01-04', status: 'ready', exportFormat: 'pdf', sharedWith: [], description: 'Identified cost optimization and savings opportunities.', filters: {} },
  { id: 'report-8', name: 'Idle Resource Report', type: 'Idle Resource', schedule: 'Daily', lastRun: '2024-01-05', status: 'ready', exportFormat: 'excel', sharedWith: ['oluwaseun@flutterwave.com'], description: 'Unused or underutilized resources that can be reclaimed.', filters: {} },
];

const initialSettings: Settings = {
  profile: {
    firstName: 'Chidi',
    lastName: 'Okonkwo',
    email: 'chidi@company.com',
  },
  timezone: 'africa-lagos',
  language: 'en',
  notifications: {
    budgetAlerts: true,
    costAnomalies: true,
    newRecommendations: true,
    reportReady: true,
  },
  apiCredentials: {
    accessKey: '',
    secretKey: '',
    projectId: '',
    isConnected: false,
  },
  security: {
    twoFactorEnabled: false,
  },
  exchangeRates: { ...defaultExchangeRates },
};

// Notification types
export type NotificationCategory = 'budget' | 'cost' | 'optimization' | 'savings';
export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  isRead: boolean;
  timestamp: string;
}

// Initial mock notifications (deterministic, spanning last 7 days)
const initialNotifications: Notification[] = [
  // Budget alerts (6)
  { id: 'notif-1', title: 'MTN Nigeria approaching 85% budget threshold', message: 'MTN Nigeria monthly budget has reached ₦42,500,000 of ₦50,000,000 allocation. Consider reviewing resource usage or adjusting the budget limit.', category: 'budget', severity: 'critical', isRead: false, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-2', title: 'Dangote Industries budget at 72% utilization', message: 'Dangote Industries has consumed ₦18,000,000 of ₦25,000,000 monthly budget. On track to exceed by end of month at current spend rate.', category: 'budget', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-3', title: 'Flutterwave Q1 budget exceeded', message: 'Flutterwave has exceeded their Q1 budget allocation by 12%. Total spend: ₦20,160,000 against ₦18,000,000 budget.', category: 'budget', severity: 'critical', isRead: false, timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-4', title: 'IT Division sub-budget nearing limit', message: 'Dangote Industries IT Division budget is at 78% (₦8,775,000 of ₦11,250,000). Projected to reach threshold in 5 days.', category: 'budget', severity: 'warning', isRead: true, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-5', title: 'MTN Development Team budget alert cleared', message: 'MTN Development Team spend has stabilized below the 90% alert threshold after resource cleanup.', category: 'budget', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-6', title: 'New budget created for Access Bank', message: 'A monthly budget of ₦32,000,000 has been created for Access Bank with an 80% alert threshold.', category: 'budget', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  // Cost anomaly alerts (6)
  { id: 'notif-7', title: 'Unusual spike in ECS costs for Dangote Industries', message: 'ECS compute costs increased by 340% in the last 24 hours for Dangote Industries. 12 new large instances were provisioned outside normal patterns.', category: 'cost', severity: 'critical', isRead: false, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-8', title: 'OBS storage costs rising unexpectedly', message: 'Object Storage Service costs for MTN Nigeria have increased 85% week-over-week. Data transfer out has tripled.', category: 'cost', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-9', title: 'RDS costs anomaly detected for Flutterwave', message: 'Database service costs for Flutterwave spiked 150% due to unoptimized queries causing high I/O operations.', category: 'cost', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-10', title: 'Network egress costs doubled for Lagos MTN-1', message: 'Cross-region data transfer costs in Lagos MTN-1 have doubled compared to the 30-day average. Investigate potential misconfigured services.', category: 'cost', severity: 'warning', isRead: true, timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-11', title: 'CCE cluster costs normalized', message: 'Container engine costs for MTN Nigeria have returned to expected levels after auto-scaling adjustment.', category: 'cost', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-12', title: 'Bandwidth cost trend increasing across all tenants', message: 'Overall bandwidth costs have increased 25% over the past 2 weeks. This may indicate growing user traffic or inefficient data routing.', category: 'cost', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  // Optimization recommendations (6)
  { id: 'notif-13', title: '3 new rightsizing opportunities identified', message: 'Analysis found 3 ECS instances running at less than 15% CPU utilization. Rightsizing could save ₦124,000/month.', category: 'optimization', severity: 'info', isRead: false, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-14', title: '5 idle resources detected in Dangote Industries', message: '3 unattached EVS volumes and 2 idle ECS instances found. Terminating these resources would save approximately ₦89,000/month.', category: 'optimization', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-15', title: 'Storage class optimization available', message: '2.4 TB of OBS data in Standard class has not been accessed in 90+ days. Moving to Infrequent Access could save ₦32,000/month.', category: 'optimization', severity: 'info', isRead: false, timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-16', title: 'Database tuning recommendations ready', message: 'GaussDB instance rds-prod-05 can be optimized by adjusting buffer pool size and connection pooling. Estimated 30% performance improvement.', category: 'optimization', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-17', title: 'Auto-scaling recommendation for MTN web tier', message: 'MTN Nigeria web tier ECS group would benefit from auto-scaling policy. Current fixed capacity leads to 40% over-provisioning during off-peak hours.', category: 'optimization', severity: 'warning', isRead: true, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-18', title: 'Network optimization opportunity', message: 'Consolidating NAT Gateways across 3 VPCs in AF South region could reduce networking costs by ₦45,000/month.', category: 'optimization', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  // Savings plan notifications (4)
  { id: 'notif-19', title: 'Reserved Instance utilization dropped to 62%', message: 'RI utilization for ECS reserved instances has fallen to 62%, well below the recommended 80% threshold. Consider modifying or exchanging underused RIs.', category: 'savings', severity: 'critical', isRead: false, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-20', title: 'Savings plan renewal due in 30 days', message: 'The 1-year compute savings plan for Dangote Industries expires on April 15. Current savings rate: ₦420,000/month. Review and renew to maintain discounts.', category: 'savings', severity: 'warning', isRead: false, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-21', title: 'New savings plan recommendation', message: 'Based on usage patterns, a 1-year All Upfront reserved instance plan for MTN Nigeria could save ₦1,850,000 annually compared to on-demand pricing.', category: 'savings', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'notif-22', title: 'Savings plan coverage report available', message: 'Monthly savings plan coverage report is ready. Overall coverage: 71% of eligible spend. Potential additional savings: ₦680,000/month with increased commitment.', category: 'savings', severity: 'info', isRead: true, timestamp: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000).toISOString() },
];

// Recommendation history entry
export interface RecommendationHistoryEntry {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  action: 'implemented' | 'dismissed' | 'moved_to_in_progress' | 'created';
  user: string;
  savings?: number;
  timestamp: string;
}

// Generate initial mock history entries
const initialRecommendationHistory: RecommendationHistoryEntry[] = [
  { id: 'hist-1', recommendationId: 'rec-4', recommendationTitle: 'Rightsize ECS instance ecs-prod-08', action: 'moved_to_in_progress', user: 'admin@company.com', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-2', recommendationId: 'rec-1', recommendationTitle: 'Terminate idle ECS instance ecs-dev-03', action: 'implemented', user: 'chidi@company.com', savings: 183.40, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-3', recommendationId: 'rec-7', recommendationTitle: 'Optimize OBS storage class for bucket logs-archive', action: 'dismissed', user: 'ops-team@company.com', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-4', recommendationId: 'rec-2', recommendationTitle: 'Purchase reserved instance for ecs-prod-01', action: 'implemented', user: 'admin@company.com', savings: 412.50, timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-5', recommendationId: 'rec-9', recommendationTitle: 'Downgrade RDS instance rds-staging-02', action: 'moved_to_in_progress', user: 'dba-team@company.com', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-6', recommendationId: 'rec-5', recommendationTitle: 'Delete unattached EVS volume vol-orphan-11', action: 'implemented', user: 'chidi@company.com', savings: 67.20, timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-7', recommendationId: 'rec-11', recommendationTitle: 'Optimize NAT Gateway bandwidth allocation', action: 'dismissed', user: 'network-team@company.com', timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-8', recommendationId: 'rec-3', recommendationTitle: 'Enable auto-scaling for ECS group ecs-web-pool', action: 'implemented', user: 'admin@company.com', savings: 295.80, timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-9', recommendationId: 'rec-8', recommendationTitle: 'Consolidate underutilized DCS instances', action: 'moved_to_in_progress', user: 'ops-team@company.com', timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-10', recommendationId: 'rec-6', recommendationTitle: 'Switch to lifecycle policy on OBS bucket media-assets', action: 'implemented', user: 'storage-admin@company.com', savings: 154.60, timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-11', recommendationId: 'rec-12', recommendationTitle: 'Resize oversized CCE node pool', action: 'dismissed', user: 'k8s-admin@company.com', timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-12', recommendationId: 'rec-10', recommendationTitle: 'Remove idle ELB listener on lb-staging', action: 'implemented', user: 'chidi@company.com', savings: 42.00, timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'hist-13', recommendationId: 'rec-15', recommendationTitle: 'Optimize GaussDB read replica configuration', action: 'moved_to_in_progress', user: 'dba-team@company.com', timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
];

interface DataStore {
  // Auth
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => void;
  logout: () => void;

  // Tenants
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Reports
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'lastRun' | 'status'>) => Report;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  runReport: (id: string) => Promise<void>;
  downloadReport: (id: string, format?: ExportFormat) => void;
  shareReport: (id: string, emails: string[]) => void;

  // Recommendations
  recommendations: Recommendation[];
  recommendationHistory: RecommendationHistoryEntry[];
  implementRecommendation: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  implementEasyWins: () => number;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Settings
  settings: Settings;
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  updateTimezone: (timezone: string) => void;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  connectApi: (credentials: Omit<ApiCredentials, 'isConnected'>) => Promise<void>;
  disconnectApi: () => void;
  updateSecurity: (security: Partial<SecuritySettings>) => void;
  changePassword: (newPassword: string) => Promise<void>;
  updateLanguage: (language: Language) => void;
  updateExchangeRates: (rates: ExchangeRates) => void;
  resetExchangeRates: () => void;

  // Tag Groups
  tagGroups: TagGroup[];
  addTagGroup: (group: Omit<TagGroup, 'id' | 'createdAt' | 'appliedTo'>) => TagGroup;
  updateTagGroup: (id: string, updates: Partial<TagGroup>) => void;
  deleteTagGroup: (id: string) => void;
  duplicateTagGroup: (id: string) => void;
  getTagGroup: (id: string) => TagGroup | undefined;
}

export const useDataStore = create<DataStore>((set, get) => ({
  // Auth — hydrate from localStorage so page reloads (e.g. language switch) don't log out
  isAuthenticated: localStorage.getItem('hcs-auth') === 'true',
  userEmail: localStorage.getItem('hcs-auth-email'),

  login: (email: string, _password: string) => {
    localStorage.setItem('hcs-auth', 'true');
    localStorage.setItem('hcs-auth-email', email);
    set({ isAuthenticated: true, userEmail: email });
    // Update profile email to match logged-in user
    set((state) => ({
      settings: {
        ...state.settings,
        profile: { ...state.settings.profile, email },
      },
    }));
  },

  logout: () => {
    localStorage.removeItem('hcs-auth');
    localStorage.removeItem('hcs-auth-email');
    set({ isAuthenticated: false, userEmail: null });
  },

  // Tenants
  tenants: [...initialTenants],

  addTenant: (tenantData) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `tenant-${Date.now()}`,
    };
    set((state) => ({ tenants: [...state.tenants, newTenant] }));
    toast({ title: 'Tenant Added', description: `${newTenant.name} has been added successfully.` });
    return newTenant;
  },

  updateTenant: (id, updates) => {
    set((state) => ({
      tenants: state.tenants.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    toast({ title: 'Tenant Updated', description: 'Tenant details have been updated.' });
  },

  deleteTenant: (id) => {
    const tenant = get().tenants.find((t) => t.id === id);
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
      budgets: state.budgets.filter((b) => b.tenantId !== id),
    }));
    toast({ title: 'Tenant Deleted', description: `${tenant?.name} has been removed.` });
  },

  // Budgets
  budgets: [...initialBudgets],

  addBudget: (budgetData) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `budget-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ budgets: [...state.budgets, newBudget] }));
    toast({ title: 'Budget Created', description: `${newBudget.name} budget has been created.` });
    return newBudget;
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    toast({ title: 'Budget Updated', description: 'Budget has been updated.' });
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    toast({ title: 'Budget Deleted', description: 'Budget has been removed.' });
  },

  // Reports
  reports: [...initialReports],

  addReport: (reportData) => {
    const newReport: Report = {
      ...reportData,
      id: `report-${Date.now()}`,
      lastRun: 'Never',
      status: 'ready',
    };
    set((state) => ({ reports: [...state.reports, newReport] }));
    toast({ title: 'Report Created', description: `${newReport.name} has been created.` });
    return newReport;
  },

  updateReport: (id, updates) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }));
    toast({ title: 'Report Deleted', description: 'Report has been removed.' });
  },

  runReport: async (id) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? { ...r, status: 'running' as const } : r)),
    }));
    toast({ title: 'Report Running', description: 'Generating report...' });

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, status: 'ready' as const, lastRun: new Date().toISOString().split('T')[0] } : r
      ),
    }));
    toast({ title: 'Report Ready', description: 'Your report has been generated.' });
  },

  downloadReport: (id, format) => {
    const report = get().reports.find((r) => r.id === id);
    if (report) {
      const exportFmt = format || report.exportFormat || 'csv';
      let blob: Blob;
      let extension: string;

      const csvContent = `Report: ${report.name}\nType: ${report.type}\nGenerated: ${new Date().toISOString()}\n\n"Category","Amount","Percentage"\n"ECS","$45,000","25%"\n"RDS","$28,000","15%"\n"OBS","$15,000","8%"\n"Other","$97,000","52%"`;

      // Note: Real PDF/Excel generation would use libraries like jsPDF or xlsx.
      // For this mock app, all formats download as CSV content.
      switch (exportFmt) {
        case 'pdf':
        case 'excel':
        case 'csv':
        default:
          blob = new Blob([csvContent], { type: 'text/csv' });
          extension = 'csv';
          break;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Download Started', description: `${report.name} is being downloaded as ${extension.toUpperCase()}.` });
    }
  },

  shareReport: (id, emails) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id
          ? { ...r, sharedWith: Array.from(new Set([...r.sharedWith, ...emails])) }
          : r
      ),
    }));
    const report = get().reports.find((r) => r.id === id);
    toast({ title: 'Report Shared', description: `${report?.name} shared with ${emails.length} recipient(s).` });
  },

  // Recommendations
  recommendations: generateRecommendations('all'),
  recommendationHistory: [...initialRecommendationHistory],

  implementRecommendation: (id) => {
    const rec = get().recommendations.find((r) => r.id === id);
    const historyEntry: RecommendationHistoryEntry = {
      id: `hist-${Date.now()}`,
      recommendationId: id,
      recommendationTitle: rec?.title || id,
      action: 'implemented',
      user: get().settings.profile.email,
      savings: rec?.projectedSavings,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'implemented' as const } : r
      ),
      recommendationHistory: [historyEntry, ...state.recommendationHistory],
    }));
    toast({
      title: 'Recommendation Implemented',
      description: `Saved $${rec?.projectedSavings.toFixed(2)} per month.`,
    });
  },

  dismissRecommendation: (id) => {
    const rec = get().recommendations.find((r) => r.id === id);
    const historyEntry: RecommendationHistoryEntry = {
      id: `hist-${Date.now()}`,
      recommendationId: id,
      recommendationTitle: rec?.title || id,
      action: 'dismissed',
      user: get().settings.profile.email,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' as const } : r
      ),
      recommendationHistory: [historyEntry, ...state.recommendationHistory],
    }));
    toast({ title: 'Recommendation Dismissed' });
  },

  implementEasyWins: () => {
    const easyWins = get().recommendations.filter(
      (r) => r.effort === 'easy' && r.status === 'new'
    );
    const totalSavings = easyWins.reduce((sum, r) => sum + r.projectedSavings, 0);
    const userEmail = get().settings.profile.email;

    const historyEntries: RecommendationHistoryEntry[] = easyWins.map((r, i) => ({
      id: `hist-${Date.now()}-${i}`,
      recommendationId: r.id,
      recommendationTitle: r.title,
      action: 'implemented' as const,
      user: userEmail,
      savings: r.projectedSavings,
      timestamp: new Date().toISOString(),
    }));

    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.effort === 'easy' && r.status === 'new' ? { ...r, status: 'implemented' as const } : r
      ),
      recommendationHistory: [...historyEntries, ...state.recommendationHistory],
    }));

    toast({
      title: 'Easy Wins Implemented',
      description: `${easyWins.length} recommendations implemented. Saving $${totalSavings.toFixed(2)}/month.`,
    });

    return easyWins.length;
  },

  // Notifications
  notifications: [...initialNotifications],

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    toast({ title: 'All Read', description: 'All notifications have been marked as read.' });
  },

  // Settings
  settings: { ...initialSettings },

  updateProfile: (profile) => {
    set((state) => ({
      settings: {
        ...state.settings,
        profile: { ...state.settings.profile, ...profile },
      },
    }));
    toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
  },

  updateTimezone: (timezone) => {
    set((state) => ({
      settings: { ...state.settings, timezone },
    }));
    toast({ title: 'Timezone Updated', description: 'Your timezone preference has been saved.' });
  },

  updateNotifications: (notifications) => {
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: { ...state.settings.notifications, ...notifications },
      },
    }));
    toast({ title: 'Notifications Updated', description: 'Your notification preferences have been saved.' });
  },

  connectApi: async (credentials) => {
    toast({ title: 'Connecting...', description: 'Verifying API credentials...' });

    // Simulate API connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    set((state) => ({
      settings: {
        ...state.settings,
        apiCredentials: { ...credentials, isConnected: true },
      },
    }));
    toast({ title: 'Connected', description: 'Successfully connected to Huawei Cloud.' });
  },

  disconnectApi: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        apiCredentials: { accessKey: '', secretKey: '', projectId: '', isConnected: false },
      },
    }));
    toast({ title: 'Disconnected', description: 'Disconnected from Huawei Cloud.' });
  },

  updateSecurity: (security) => {
    set((state) => ({
      settings: {
        ...state.settings,
        security: { ...state.settings.security, ...security },
      },
    }));
    const message = security.twoFactorEnabled
      ? 'Two-factor authentication has been enabled.'
      : 'Two-factor authentication has been disabled.';
    toast({ title: 'Security Updated', description: message });
  },

  changePassword: async (newPassword) => {
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Updating...', description: 'Changing your password...' });

    // Simulate password change
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
  },

  updateLanguage: (language) => {
    set((state) => ({
      settings: { ...state.settings, language },
    }));
    toast({ title: 'Language Updated', description: 'Your display language preference has been saved.' });
  },

  updateExchangeRates: (rates) => {
    set((state) => ({
      settings: { ...state.settings, exchangeRates: { ...rates } },
    }));
    toast({ title: 'Exchange Rates Saved', description: 'Custom exchange rates have been saved.' });
  },

  resetExchangeRates: () => {
    set((state) => ({
      settings: { ...state.settings, exchangeRates: { ...defaultExchangeRates } },
    }));
    toast({ title: 'Exchange Rates Reset', description: 'Exchange rates have been reset to defaults.' });
  },

  // Tag Groups
  tagGroups: [
    {
      id: 'grp-1', name: 'Environment Classification', description: 'Classify resources by deployment environment stage', color: '#1E88E5',
      tags: [
        { id: 'tk-1', key: 'environment', valueType: 'enum', required: true, allowedValues: 'production,staging,development,testing,sandbox', description: 'Deployment stage' },
        { id: 'tk-2', key: 'tier', valueType: 'enum', required: false, allowedValues: 'frontend,backend,data,infra', description: 'Application tier' },
        { id: 'tk-3', key: 'criticality', valueType: 'enum', required: false, allowedValues: 'critical,high,medium,low', description: 'Business criticality level' },
      ],
      scope: 'all', scopeTargets: [], appliedTo: 312, createdAt: '2025-08-14',
    },
    {
      id: 'grp-2', name: 'Cost Attribution', description: 'Track cost allocation across business units and budgets', color: '#43A047',
      tags: [
        { id: 'tk-4', key: 'cost_center', valueType: 'string', required: true, allowedValues: '', description: 'Finance cost center code' },
        { id: 'tk-5', key: 'budget_code', valueType: 'string', required: false, allowedValues: '', description: 'Annual budget allocation code' },
        { id: 'tk-6', key: 'chargeback_entity', valueType: 'string', required: false, allowedValues: '', description: 'Entity for internal chargeback' },
      ],
      scope: 'all', scopeTargets: [], appliedTo: 287, createdAt: '2025-07-22',
    },
    {
      id: 'grp-3', name: 'Ownership & Access', description: 'Define resource ownership and access responsibility', color: '#FB8C00',
      tags: [
        { id: 'tk-7', key: 'owner', valueType: 'string', required: true, allowedValues: '', description: 'Primary resource owner email' },
        { id: 'tk-8', key: 'team', valueType: 'string', required: false, allowedValues: '', description: 'Responsible team name' },
        { id: 'tk-9', key: 'contact_channel', valueType: 'string', required: false, allowedValues: '', description: 'Slack channel or DL for alerts' },
      ],
      scope: 'vdc', scopeTargets: ['VDC-Production', 'VDC-Staging'], appliedTo: 254, createdAt: '2025-09-03',
    },
    {
      id: 'grp-4', name: 'Project Tracking', description: 'Associate resources with projects and initiatives', color: '#8E24AA',
      tags: [
        { id: 'tk-10', key: 'project', valueType: 'string', required: true, allowedValues: '', description: 'Project name or code' },
        { id: 'tk-11', key: 'sprint', valueType: 'string', required: false, allowedValues: '', description: 'Current sprint or iteration' },
      ],
      scope: 'all', scopeTargets: [], appliedTo: 198, createdAt: '2025-10-11',
    },
    {
      id: 'grp-5', name: 'Compliance & Security', description: 'Tags for regulatory compliance and security classification', color: '#E53935',
      tags: [
        { id: 'tk-12', key: 'data_classification', valueType: 'enum', required: false, allowedValues: 'public,internal,confidential,restricted', description: 'Data sensitivity level' },
        { id: 'tk-13', key: 'compliance_framework', valueType: 'list', required: false, allowedValues: 'ISO27001,SOC2,PCI-DSS,GDPR,NDPR', description: 'Applicable compliance frameworks' },
        { id: 'tk-14', key: 'department', valueType: 'string', required: true, allowedValues: '', description: 'Business department responsible' },
        { id: 'tk-15', key: 'audit_trail', valueType: 'bool', required: false, allowedValues: '', description: 'Whether audit logging is enabled' },
      ],
      scope: 'resource', scopeTargets: ['ecs-prod-web-01', 'rds-main-cluster'], appliedTo: 341, createdAt: '2025-06-18',
    },
    {
      id: 'grp-6', name: 'Lifecycle Management', description: 'Track resource lifecycle and expiration policies', color: '#00ACC1',
      tags: [
        { id: 'tk-16', key: 'created_date', valueType: 'date', required: false, allowedValues: '', description: 'Resource creation date' },
        { id: 'tk-17', key: 'expiry_date', valueType: 'date', required: false, allowedValues: '', description: 'Expected resource decommission date' },
        { id: 'tk-18', key: 'auto_shutdown', valueType: 'bool', required: false, allowedValues: '', description: 'Whether auto-shutdown is enabled' },
      ],
      scope: 'all', scopeTargets: [], appliedTo: 176, createdAt: '2025-11-05',
    },
  ] as TagGroup[],

  addTagGroup: (groupData) => {
    const newGroup: TagGroup = {
      ...groupData,
      id: `grp-${Date.now()}`,
      appliedTo: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ tagGroups: [...state.tagGroups, newGroup] }));
    toast({ title: 'Tag group created', description: `"${newGroup.name}" has been added.` });
    return newGroup;
  },

  updateTagGroup: (id, updates) => {
    set((state) => ({
      tagGroups: state.tagGroups.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
    toast({ title: 'Tag group updated', description: 'Changes have been saved.' });
  },

  deleteTagGroup: (id) => {
    const group = get().tagGroups.find(g => g.id === id);
    set((state) => ({ tagGroups: state.tagGroups.filter(g => g.id !== id) }));
    if (group) toast({ title: 'Tag group deleted', description: `"${group.name}" has been removed.` });
  },

  duplicateTagGroup: (id) => {
    const group = get().tagGroups.find(g => g.id === id);
    if (!group) return;
    const dup: TagGroup = {
      ...group,
      id: `grp-${Date.now()}`,
      name: `${group.name} (Copy)`,
      tags: group.tags.map(t => ({ ...t, id: `tk-${Date.now()}-${t.id}` })),
      appliedTo: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ tagGroups: [...state.tagGroups, dup] }));
    toast({ title: 'Tag group duplicated', description: `"${dup.name}" has been created.` });
  },

  getTagGroup: (id) => {
    return get().tagGroups.find(g => g.id === id);
  },
}));
