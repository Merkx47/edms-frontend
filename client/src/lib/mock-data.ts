import type {
  Tenant,
  CostRecord,
  Resource,
  Recommendation,
  DashboardKPIs,
  CostTrendPoint,
  ServiceBreakdown,
  RegionBreakdown,
  TenantSummary,
  HuaweiService,
  HuaweiRegion,
  RecommendationType,
  RecommendationImpact,
  VDCNode,
} from '@shared/schema';

// =====================================================
// CONSISTENT DATA MODEL
// All numbers are deterministic and add up correctly
// =====================================================

// Nigerian/African context tenant names with FIXED spending data
// Monthly spend is ~75% of budget on average to show healthy usage
export const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Dangote Industries',
    industry: 'Manufacturing',
    country: 'Nigeria',
    contactName: 'Chidi Okonkwo',
    contactEmail: 'chidi.okonkwo@dangote.com',
    budget: 25000000,        // Monthly budget
    efficiencyScore: 78,
    status: 'active',
  },
  {
    id: 'tenant-2',
    name: 'MTN Nigeria',
    industry: 'Telecommunications',
    country: 'Nigeria',
    contactName: 'Amaka Eze',
    contactEmail: 'amaka.eze@mtn.ng',
    budget: 50000000,
    efficiencyScore: 85,
    status: 'active',
  },
  {
    id: 'tenant-3',
    name: 'Flutterwave',
    industry: 'Fintech',
    country: 'Nigeria',
    contactName: 'Oluwaseun Adeyemi',
    contactEmail: 'oluwaseun@flutterwave.com',
    budget: 18000000,
    efficiencyScore: 92,
    status: 'active',
  },
  {
    id: 'tenant-4',
    name: 'Safaricom Kenya',
    industry: 'Telecommunications',
    country: 'Kenya',
    contactName: 'Wanjiku Kamau',
    contactEmail: 'wanjiku.kamau@safaricom.co.ke',
    budget: 32000000,
    efficiencyScore: 81,
    status: 'active',
  },
  {
    id: 'tenant-5',
    name: 'Standard Bank SA',
    industry: 'Banking',
    country: 'South Africa',
    contactName: 'Thabo Molefe',
    contactEmail: 'thabo.molefe@standardbank.co.za',
    budget: 42000000,
    efficiencyScore: 75,
    status: 'active',
  },
  {
    id: 'tenant-6',
    name: 'Andela',
    industry: 'Technology',
    country: 'Nigeria',
    contactName: 'Ngozi Obi',
    contactEmail: 'ngozi.obi@andela.com',
    budget: 15000000,
    efficiencyScore: 88,
    status: 'active',
  },
  {
    id: 'tenant-7',
    name: 'Jumia Group',
    industry: 'E-commerce',
    country: 'Nigeria',
    contactName: 'Emmanuel Nwosu',
    contactEmail: 'emmanuel.nwosu@jumia.com',
    budget: 28000000,
    efficiencyScore: 72,
    status: 'active',
  },
  {
    id: 'tenant-8',
    name: 'Interswitch',
    industry: 'Fintech',
    country: 'Nigeria',
    contactName: 'Chioma Ikenna',
    contactEmail: 'chioma.ikenna@interswitch.com',
    budget: 20000000,
    efficiencyScore: 84,
    status: 'active',
  },
];

// FIXED monthly spend per tenant (deterministic, ~75% of budget average)
// These are the actual current monthly totals
const tenantMonthlySpend: Record<string, number> = {
  'tenant-1': 18750000,   // Dangote: 75% of 25M budget
  'tenant-2': 38500000,   // MTN: 77% of 50M budget
  'tenant-3': 13500000,   // Flutterwave: 75% of 18M budget
  'tenant-4': 24320000,   // Safaricom: 76% of 32M budget
  'tenant-5': 33600000,   // Standard Bank: 80% of 42M budget
  'tenant-6': 11250000,   // Andela: 75% of 15M budget
  'tenant-7': 22400000,   // Jumia: 80% of 28M budget
  'tenant-8': 15400000,   // Interswitch: 77% of 20M budget
};

// Total spend across all tenants
const TOTAL_ALL_SPEND = Object.values(tenantMonthlySpend).reduce((a, b) => a + b, 0); // = 1,777,200

// Previous month spend (6% lower to show growth)
const tenantPreviousSpend: Record<string, number> = {
  'tenant-1': 17662500,   // 94% of current
  'tenant-2': 36230000,   // 94% of current
  'tenant-3': 12825000,   // 95% of current
  'tenant-4': 23104000,   // 95% of current
  'tenant-5': 31920000,   // 95% of current
  'tenant-6': 10575000,   // 94% of current
  'tenant-7': 21504000,   // 96% of current
  'tenant-8': 14476000,   // 94% of current
};

// FIXED service breakdown per tenant (percentages of their total spend)
// These percentages are based on typical cloud usage patterns per industry
const tenantServiceAllocation: Record<string, Record<HuaweiService, number>> = {
  // Dangote (Manufacturing) - Heavy on ECS, CCE for production systems
  'tenant-1': {
    ECS: 0.28, RDS: 0.18, OBS: 0.08, EVS: 0.10, ELB: 0.06,
    VPC: 0.03, CDN: 0.02, NAT: 0.02, WAF: 0.03, DCS: 0.04,
    DDS: 0.02, GaussDB: 0.05, FunctionGraph: 0.01, APIG: 0.02,
    SMN: 0.01, CTS: 0.01, CCE: 0.04, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // MTN (Telecom) - Heavy on network, CDN, storage
  'tenant-2': {
    ECS: 0.22, RDS: 0.15, OBS: 0.12, EVS: 0.06, ELB: 0.08,
    VPC: 0.05, CDN: 0.10, NAT: 0.03, WAF: 0.04, DCS: 0.05,
    DDS: 0.02, GaussDB: 0.03, FunctionGraph: 0.01, APIG: 0.02,
    SMN: 0.01, CTS: 0.01, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Flutterwave (Fintech) - Heavy on security, database, serverless
  'tenant-3': {
    ECS: 0.20, RDS: 0.22, OBS: 0.05, EVS: 0.05, ELB: 0.06,
    VPC: 0.04, CDN: 0.03, NAT: 0.02, WAF: 0.08, DCS: 0.07,
    DDS: 0.03, GaussDB: 0.06, FunctionGraph: 0.04, APIG: 0.03,
    SMN: 0.01, CTS: 0.01, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Safaricom (Telecom) - Similar to MTN
  'tenant-4': {
    ECS: 0.24, RDS: 0.16, OBS: 0.10, EVS: 0.07, ELB: 0.07,
    VPC: 0.04, CDN: 0.09, NAT: 0.03, WAF: 0.04, DCS: 0.05,
    DDS: 0.02, GaussDB: 0.04, FunctionGraph: 0.01, APIG: 0.02,
    SMN: 0.01, CTS: 0.01, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Standard Bank (Banking) - Heavy on security, databases, compliance
  'tenant-5': {
    ECS: 0.18, RDS: 0.20, OBS: 0.08, EVS: 0.08, ELB: 0.05,
    VPC: 0.04, CDN: 0.02, NAT: 0.02, WAF: 0.10, DCS: 0.06,
    DDS: 0.03, GaussDB: 0.08, FunctionGraph: 0.01, APIG: 0.02,
    SMN: 0.01, CTS: 0.02, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Andela (Technology) - Dev-heavy, serverless, containers
  'tenant-6': {
    ECS: 0.22, RDS: 0.12, OBS: 0.06, EVS: 0.05, ELB: 0.05,
    VPC: 0.03, CDN: 0.04, NAT: 0.02, WAF: 0.03, DCS: 0.05,
    DDS: 0.02, GaussDB: 0.03, FunctionGraph: 0.08, APIG: 0.05,
    SMN: 0.02, CTS: 0.01, CCE: 0.10, SWR: 0.02, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Jumia (E-commerce) - CDN, storage, search heavy
  'tenant-7': {
    ECS: 0.25, RDS: 0.14, OBS: 0.12, EVS: 0.06, ELB: 0.07,
    VPC: 0.03, CDN: 0.12, NAT: 0.02, WAF: 0.04, DCS: 0.06,
    DDS: 0.02, GaussDB: 0.02, FunctionGraph: 0.01, APIG: 0.02,
    SMN: 0.01, CTS: 0.01, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
  // Interswitch (Fintech) - Similar to Flutterwave
  'tenant-8': {
    ECS: 0.21, RDS: 0.20, OBS: 0.05, EVS: 0.06, ELB: 0.06,
    VPC: 0.04, CDN: 0.03, NAT: 0.02, WAF: 0.09, DCS: 0.07,
    DDS: 0.03, GaussDB: 0.05, FunctionGraph: 0.03, APIG: 0.04,
    SMN: 0.01, CTS: 0.01, CCE: 0, SWR: 0, ModelArts: 0, DWS: 0, CSS: 0, MRS: 0, DLI: 0,
  },
};

// FIXED region distribution per tenant (based on their geography)
const tenantRegionAllocation: Record<string, Record<HuaweiRegion, number>> = {
  'tenant-1': { 'lagos-mtn-1': 0.35, 'af-south-1': 0.35, 'eu-west-0': 0.15, 'ap-southeast-1': 0.10, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0 },
  'tenant-2': { 'lagos-mtn-1': 0.40, 'af-south-1': 0.35, 'eu-west-0': 0.10, 'ap-southeast-1': 0.10, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0 },
  'tenant-3': { 'lagos-mtn-1': 0.30, 'af-south-1': 0.30, 'eu-west-0': 0.20, 'ap-southeast-1': 0.10, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0.05, 'na-mexico-1': 0 },
  'tenant-4': { 'lagos-mtn-1': 0.45, 'af-south-1': 0.35, 'eu-west-0': 0.10, 'ap-southeast-1': 0.05, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0 },
  'tenant-5': { 'lagos-mtn-1': 0.45, 'af-south-1': 0.40, 'eu-west-0': 0.10, 'ap-southeast-1': 0.05, 'ap-southeast-2': 0, 'ap-southeast-3': 0, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0 },
  'tenant-6': { 'lagos-mtn-1': 0.25, 'af-south-1': 0.25, 'eu-west-0': 0.25, 'ap-southeast-1': 0.15, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0.05 },
  'tenant-7': { 'lagos-mtn-1': 0.35, 'af-south-1': 0.30, 'eu-west-0': 0.15, 'ap-southeast-1': 0.10, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0.05, 'na-mexico-1': 0 },
  'tenant-8': { 'lagos-mtn-1': 0.35, 'af-south-1': 0.30, 'eu-west-0': 0.20, 'ap-southeast-1': 0.10, 'ap-southeast-2': 0, 'ap-southeast-3': 0.05, 'cn-north-4': 0, 'cn-east-3': 0, 'la-south-2': 0, 'me-east-1': 0, 'na-mexico-1': 0 },
};

// Resource counts per tenant (deterministic)
const tenantResourceCounts: Record<string, number> = {
  'tenant-1': 95,
  'tenant-2': 180,
  'tenant-3': 72,
  'tenant-4': 125,
  'tenant-5': 165,
  'tenant-6': 58,
  'tenant-7': 98,
  'tenant-8': 84,
};

// Total resources across all tenants
const TOTAL_RESOURCES = Object.values(tenantResourceCounts).reduce((a, b) => a + b, 0); // = 877

// =====================================================
// DATA GENERATION FUNCTIONS
// All use the fixed data above for consistency
// =====================================================

// Seeded random number generator for deterministic "randomness"
// This creates natural-looking variation that's consistent across renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Helper to get days from date range preset
export function getDaysFromPreset(preset: string): number {
  switch (preset) {
    case 'last7days': return 7;
    case 'last30days': return 30;
    case 'last90days': return 90;
    case 'thisMonth': {
      const today = new Date();
      return today.getDate(); // Days elapsed this month
    }
    case 'lastMonth': {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return lastMonth.getDate(); // Days in last month
    }
    default: return 30;
  }
}

// Helper: get the region's share of spend for scaling when a specific region is selected
export function getRegionScale(tenantId: string | 'all', region: HuaweiRegion | 'all'): number {
  if (region === 'all') return 1;
  if (tenantId === 'all') {
    // Average across all tenants for this region
    const allocations = Object.values(tenantRegionAllocation);
    const total = allocations.reduce((sum, alloc) => sum + (alloc[region] || 0), 0);
    return total / allocations.length;
  }
  return tenantRegionAllocation[tenantId]?.[region] || 0;
}

// Generate cost trend data (configurable days + 7 days forecast)
export function generateCostTrend(tenantId: string | 'all', daysToShow: number = 30, region: HuaweiRegion | 'all' = 'all'): CostTrendPoint[] {
  const data: CostTrendPoint[] = [];
  const today = new Date();

  // Get the monthly total and calculate daily average
  const monthlyTotal = tenantId === 'all'
    ? TOTAL_ALL_SPEND
    : tenantMonthlySpend[tenantId] || 15000000;

  const regionScale = getRegionScale(tenantId, region);
  const dailyAverage = (monthlyTotal / 30) * regionScale;
  const previousMonthlyTotal = tenantId === 'all'
    ? Object.values(tenantPreviousSpend).reduce((a, b) => a + b, 0)
    : tenantPreviousSpend[tenantId] || 14000000;
  const previousDailyAverage = (previousMonthlyTotal / 30) * regionScale;

  // Tenant-based seed for consistent but varied data per tenant
  const tenantSeed = tenantId === 'all' ? 42 : parseInt(tenantId.replace('tenant-', ''), 10) * 17;

  // Generate days with realistic patterns (use daysToShow instead of hardcoded 30)
  // Use actual date as seed to ensure same calendar day = same value across different ranges
  let previousAmount = previousDailyAverage;

  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const monthOfYear = date.getMonth();

    // Use date-based seed for consistency: same calendar day = same random factors
    const dateSeed = tenantSeed + dayOfMonth * 31 + monthOfYear * 367 + date.getFullYear();

    // Weekend factor: reduced spending on weekends (varying by day)
    let weekendFactor = 1;
    if (dayOfWeek === 0) weekendFactor = 0.72 + seededRandom(dateSeed * 3) * 0.1; // Sunday: 72-82%
    else if (dayOfWeek === 6) weekendFactor = 0.78 + seededRandom(dateSeed * 5) * 0.1; // Saturday: 78-88%

    // Day-of-week patterns (busier mid-week)
    const weekdayFactors = [0.75, 0.95, 1.05, 1.12, 1.08, 0.98, 0.82]; // Sun-Sat
    const weekdayFactor = weekdayFactors[dayOfWeek];

    // Use daily average directly - no artificial trend progression
    const trendBase = dailyAverage;

    // Natural variation using seeded random based on actual date (±8-15%)
    const randomVariation = (seededRandom(dateSeed * 7) - 0.5) * 0.18;

    // Occasional spikes (batch jobs, deployments) - about 1 in 8 days
    let spikeFactor = 1;
    if (seededRandom(dateSeed * 11) > 0.875) {
      spikeFactor = 1.15 + seededRandom(dateSeed * 13) * 0.2; // 15-35% spike
    }

    // Occasional dips (maintenance windows, outages) - about 1 in 12 days
    if (seededRandom(dateSeed * 17) > 0.917) {
      spikeFactor = 0.7 + seededRandom(dateSeed * 19) * 0.15; // 70-85% of normal
    }

    // Month-end processing bump (last 3 days)
    const monthEndFactor = dayOfMonth >= 28 ? 1.08 + seededRandom(dateSeed) * 0.07 : 1;

    // Start of month dip (first 2 days - less batch processing)
    const monthStartFactor = dayOfMonth <= 2 ? 0.88 + seededRandom(dateSeed * 23) * 0.08 : 1;

    // Combine all factors
    let amount = trendBase * (1 + randomVariation) * weekdayFactor * spikeFactor * monthEndFactor * monthStartFactor;

    // Apply weekend factor last
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      amount = amount * weekendFactor;
    }

    // Smooth out extreme values - don't let it deviate more than 25% from previous day
    const maxChange = previousAmount * 0.25;
    if (Math.abs(amount - previousAmount) > maxChange && i < daysToShow - 1) {
      amount = previousAmount + Math.sign(amount - previousAmount) * maxChange * (0.6 + seededRandom(dateSeed * 29) * 0.4);
    }

    previousAmount = amount;

    data.push({
      date: date.toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
    });
  }

  // Add forecast for next 7 days with similar realistic patterns
  const avgRecentAmount = data.slice(-7).reduce((sum, d) => sum + d.amount, 0) / 7;

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const monthOfYear = date.getMonth();

    // Use date-based seed for forecast consistency
    const dateSeed = tenantSeed + dayOfMonth * 31 + monthOfYear * 367 + date.getFullYear() + 1000;

    // Weekend reduction
    let weekendFactor = 1;
    if (dayOfWeek === 0) weekendFactor = 0.75;
    else if (dayOfWeek === 6) weekendFactor = 0.82;

    // Slight upward trend in forecast
    const trendFactor = 1 + (i * 0.003); // ~0.3% daily growth

    // Natural variation using date-based seed
    const randomVariation = (seededRandom(dateSeed * 31) - 0.5) * 0.12;

    let forecast = avgRecentAmount * trendFactor * (1 + randomVariation);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      forecast = forecast * weekendFactor;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      forecast: Math.round(forecast * 100) / 100,
    });
  }

  return data;
}

// Service breakdown data - sums to total spend for the period
// daysInPeriod scales the costs proportionally (default 30 = monthly)
export function generateServiceBreakdown(tenantId: string | 'all', daysInPeriod: number = 30, region: HuaweiRegion | 'all' = 'all'): ServiceBreakdown[] {
  const services: HuaweiService[] = [
    'ECS', 'RDS', 'OBS', 'EVS', 'ELB', 'VPC', 'CDN', 'NAT', 'WAF', 'DCS',
    'DDS', 'GaussDB', 'FunctionGraph', 'APIG', 'SMN', 'CTS', 'CCE', 'SWR',
  ];

  // Scale factor based on days (monthly data is base)
  const scaleFactor = daysInPeriod / 30;
  const regionScale = getRegionScale(tenantId, region);

  let breakdown: ServiceBreakdown[];

  if (tenantId === 'all') {
    // Aggregate across all tenants
    const serviceTotals: Record<HuaweiService, number> = {} as Record<HuaweiService, number>;
    const serviceResources: Record<HuaweiService, number> = {} as Record<HuaweiService, number>;

    services.forEach(s => {
      serviceTotals[s] = 0;
      serviceResources[s] = 0;
    });

    mockTenants.forEach(tenant => {
      const tRegionScale = getRegionScale(tenant.id, region);
      const spend = tenantMonthlySpend[tenant.id] * scaleFactor * tRegionScale;
      const allocation = tenantServiceAllocation[tenant.id];
      const resourceCount = tenantResourceCounts[tenant.id];

      services.forEach(service => {
        const pct = allocation[service] || 0;
        serviceTotals[service] += spend * pct;
        serviceResources[service] += Math.round(resourceCount * pct);
      });
    });

    const totalCost = Object.values(serviceTotals).reduce((a, b) => a + b, 0);

    breakdown = services.map(service => {
      const cost = serviceTotals[service];
      const previousCost = cost * 0.94; // 6% growth
      const trend = ((cost - previousCost) / previousCost) * 100;

      return {
        service,
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round((cost / totalCost) * 1000) / 10,
        trend: Math.round(trend * 10) / 10,
        resourceCount: serviceResources[service],
      };
    });
  } else {
    // Single tenant
    const spend = (tenantMonthlySpend[tenantId] || 15000000) * scaleFactor * regionScale;
    const allocation = tenantServiceAllocation[tenantId] || tenantServiceAllocation['tenant-1'];
    const resourceCount = tenantResourceCounts[tenantId] || 80;

    breakdown = services.map(service => {
      const pct = allocation[service] || 0;
      const cost = spend * pct;
      const previousCost = cost * 0.94;
      const trend = cost > 0 ? ((cost - previousCost) / previousCost) * 100 : 0;

      return {
        service,
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round(pct * 1000) / 10,
        trend: Math.round(trend * 10) / 10,
        resourceCount: Math.round(resourceCount * pct),
      };
    });
  }

  // Filter out zero-cost services and sort by cost descending
  return breakdown.filter(b => b.cost > 0).sort((a, b) => b.cost - a.cost);
}

// Region breakdown data - sums to total spend for the period
// daysInPeriod scales the costs proportionally (default 30 = monthly)
export function generateRegionBreakdown(tenantId: string | 'all', daysInPeriod: number = 30, region: HuaweiRegion | 'all' = 'all'): RegionBreakdown[] {
  const allRegions: HuaweiRegion[] = [
    'af-south-1', 'eu-west-0', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3',
    'cn-north-4', 'cn-east-3', 'la-south-2', 'me-east-1', 'na-mexico-1',
  ];

  // When a specific region is selected, only show that region
  const regions = region === 'all' ? allRegions : allRegions.filter(r => r === region);

  // Scale factor based on days (monthly data is base)
  const scaleFactor = daysInPeriod / 30;

  let breakdown: RegionBreakdown[];

  if (tenantId === 'all') {
    const regionTotals: Record<HuaweiRegion, number> = {} as Record<HuaweiRegion, number>;
    const regionResources: Record<HuaweiRegion, number> = {} as Record<HuaweiRegion, number>;

    regions.forEach(r => {
      regionTotals[r] = 0;
      regionResources[r] = 0;
    });

    mockTenants.forEach(tenant => {
      const spend = tenantMonthlySpend[tenant.id] * scaleFactor;
      const allocation = tenantRegionAllocation[tenant.id];
      const resourceCount = tenantResourceCounts[tenant.id];

      regions.forEach(region => {
        const pct = allocation[region] || 0;
        regionTotals[region] += spend * pct;
        regionResources[region] += Math.round(resourceCount * pct);
      });
    });

    const totalCost = Object.values(regionTotals).reduce((a, b) => a + b, 0);

    breakdown = regions.map(region => ({
      region,
      cost: Math.round(regionTotals[region] * 100) / 100,
      percentage: Math.round((regionTotals[region] / totalCost) * 1000) / 10,
      resourceCount: regionResources[region],
    }));
  } else {
    const spend = (tenantMonthlySpend[tenantId] || 15000000) * scaleFactor;
    const allocation = tenantRegionAllocation[tenantId] || tenantRegionAllocation['tenant-1'];
    const resourceCount = tenantResourceCounts[tenantId] || 80;

    breakdown = regions.map(region => {
      const pct = allocation[region] || 0;
      return {
        region,
        cost: Math.round(spend * pct * 100) / 100,
        percentage: Math.round(pct * 1000) / 10,
        resourceCount: Math.round(resourceCount * pct),
      };
    });
  }

  return breakdown.filter(b => b.cost > 0).sort((a, b) => b.cost - a.cost);
}

// Generate KPIs - all numbers are consistent and verifiable
// Utilization stats are calculated from actual resource data
// daysInPeriod scales the spend proportionally (default 30 = monthly)
export function generateKPIs(tenantId: string | 'all', daysInPeriod: number = 30, region: HuaweiRegion | 'all' = 'all'): DashboardKPIs {
  const isAll = tenantId === 'all';

  // Scale factor based on days (monthly data is base)
  const scaleFactor = daysInPeriod / 30;
  const regionScale = getRegionScale(tenantId, region);

  const monthlySpend = isAll
    ? TOTAL_ALL_SPEND
    : tenantMonthlySpend[tenantId] || 15000000;

  // Scale spend based on date range and region
  const totalSpend = monthlySpend * scaleFactor * regionScale;

  const monthlyPreviousSpend = isAll
    ? Object.values(tenantPreviousSpend).reduce((a, b) => a + b, 0)
    : tenantPreviousSpend[tenantId] || 14000000;

  const previousSpend = monthlyPreviousSpend * scaleFactor * regionScale;

  const spendGrowthRate = ((totalSpend - previousSpend) / previousSpend) * 100;

  const totalBudget = isAll
    ? mockTenants.reduce((sum, t) => sum + t.budget, 0)
    : mockTenants.find(t => t.id === tenantId)?.budget || 20000000;

  // Budget usage is based on monthly budget, but scaled spend
  const budgetUsed = (totalSpend / (totalBudget * scaleFactor)) * 100;

  const activeResources = isAll
    ? TOTAL_RESOURCES
    : tenantResourceCounts[tenantId] || 80;

  // Calculate actual utilization stats from resource patterns
  // Using the same pattern logic as generateResources for consistency
  const utilizationPatterns = [
    { cpu: 15 }, { cpu: 12 }, { cpu: 25 }, { cpu: 28 }, { cpu: 38 },
    { cpu: 45 }, { cpu: 55 }, { cpu: 62 }, { cpu: 68 }, { cpu: 75 },
    { cpu: 82 }, { cpu: 88 }, { cpu: 92 }, { cpu: 95 }, { cpu: 8 },
    { cpu: 42 }, { cpu: 72 }, { cpu: 35 }, { cpu: 58 }, { cpu: 85 },
  ];

  // Calculate average CPU and count underutilized (< 30% CPU)
  let totalCpu = 0;
  let underutilizedCount = 0;
  const tenantsToProcess = isAll ? mockTenants : mockTenants.filter(t => t.id === tenantId);
  let resourceIndex = 0;

  tenantsToProcess.forEach((tenant, tIdx) => {
    const resourceCount = tenantResourceCounts[tenant.id];
    const tenantIndex = mockTenants.findIndex(t => t.id === tenant.id);

    for (let i = 0; i < resourceCount; i++) {
      const patternIndex = (i * 7 + tenantIndex * 3) % utilizationPatterns.length;
      const cpu = utilizationPatterns[patternIndex].cpu;
      totalCpu += cpu;
      if (cpu < 30) underutilizedCount++;
      resourceIndex++;
    }
  });

  const avgCpu = resourceIndex > 0 ? totalCpu / resourceIndex : 50;
  const avgMemory = avgCpu - 5; // Memory typically slightly lower than CPU

  // Optimization opportunities based on underutilized resources
  const optimizationOpportunities = underutilizedCount;

  // Potential savings: estimate based on underutilized resources
  // Underutilized resources could save ~40% of their cost through rightsizing
  const potentialSavings = totalSpend * (underutilizedCount / activeResources) * 0.4;

  // Efficiency score based on average utilization (higher util = more efficient use of resources)
  const averageEfficiency = Math.min(95, Math.max(50, avgCpu + 10));

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    previousSpend: Math.round(previousSpend * 100) / 100,
    spendGrowthRate: Math.round(spendGrowthRate * 10) / 10,
    budgetUsed: Math.round(budgetUsed * 10) / 10,
    totalBudget,
    activeResources,
    optimizationOpportunities,
    potentialSavings: Math.round(potentialSavings * 100) / 100,
    averageEfficiency: Math.round(averageEfficiency * 10) / 10,
    costPerResource: Math.round((totalSpend / activeResources) * 100) / 100,
    // Additional stats for dashboard
    avgCpuUtilization: Math.round(avgCpu),
    avgMemoryUtilization: Math.round(avgMemory),
    underutilizedResources: underutilizedCount,
  };
}

// Generate recommendations - fixed data that makes sense
export function generateRecommendations(tenantId: string | 'all', region: HuaweiRegion | 'all' = 'all'): Recommendation[] {
  const recommendations: Recommendation[] = [
    {
      id: 'rec-1',
      tenantId: 'tenant-1',
      type: 'rightsizing',
      title: 'Downsize ECS Instance ecs-prod-web-01',
      description: 'This instance has averaged 12% CPU utilization over the past 30 days. Consider downsizing from s6.xlarge.4 to s6.large.2 to save costs.',
      resourceId: 'ecs-prod-web-01',
      resourceName: 'ecs-prod-web-01',
      service: 'ECS',
      currentCost: 45850.00,
      projectedSavings: 18340.00,
      impact: 'high',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-2',
      tenantId: 'tenant-2',
      type: 'idle_resource',
      title: 'Terminate Idle RDS Instance rds-staging-db',
      description: 'This RDS instance has had zero connections for 21 days. Consider terminating or snapshotting and removing.',
      resourceId: 'rds-staging-db',
      resourceName: 'rds-staging-db',
      service: 'RDS',
      currentCost: 32400.00,
      projectedSavings: 32400.00,
      impact: 'high',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-3',
      tenantId: 'tenant-3',
      type: 'reserved_instance',
      title: 'Purchase Reserved Instance for ECS Cluster',
      description: 'Your ECS cluster has stable usage patterns. Purchasing 1-year reserved instances could save 35% on compute costs.',
      resourceId: 'ecs-cluster-prod',
      resourceName: 'Production ECS Cluster',
      service: 'ECS',
      currentCost: 284000.00,
      projectedSavings: 99400.00,
      impact: 'high',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-4',
      tenantId: 'tenant-4',
      type: 'storage_optimization',
      title: 'Move Cold Data to OBS Standard-IA',
      description: 'Analysis shows 2.4TB of data in OBS Standard that hasn\'t been accessed in 90+ days. Moving to Standard-IA could reduce costs by 40%.',
      resourceId: 'obs-bucket-archive',
      resourceName: 'obs-bucket-archive',
      service: 'OBS',
      currentCost: 15600.00,
      projectedSavings: 6240.00,
      impact: 'medium',
      effort: 'easy',
      status: 'in_progress',
    },
    {
      id: 'rec-5',
      tenantId: 'tenant-5',
      type: 'network_optimization',
      title: 'Optimize CDN Cache Rules',
      description: 'Your CDN has a 45% cache hit ratio. Optimizing cache rules could improve this to 85% and reduce origin traffic costs.',
      resourceId: 'cdn-domain-main',
      resourceName: 'cdn-domain-main',
      service: 'CDN',
      currentCost: 89000.00,
      projectedSavings: 35600.00,
      impact: 'medium',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-6',
      tenantId: 'tenant-6',
      type: 'database_tuning',
      title: 'Enable RDS Read Replicas',
      description: 'High read workload detected on primary RDS. Adding read replicas would improve performance and enable smaller primary instance.',
      resourceId: 'rds-prod-primary',
      resourceName: 'rds-prod-primary',
      service: 'RDS',
      currentCost: 124000.00,
      projectedSavings: 37200.00,
      impact: 'high',
      effort: 'complex',
      status: 'new',
    },
    {
      id: 'rec-7',
      tenantId: 'tenant-7',
      type: 'idle_resource',
      title: 'Delete Unattached EVS Volumes',
      description: '8 EVS volumes totaling 1.6TB are not attached to any instance. Delete or snapshot these to eliminate waste.',
      resourceId: 'evs-unattached-group',
      resourceName: 'Unattached EVS Volumes',
      service: 'EVS',
      currentCost: 12800.00,
      projectedSavings: 12800.00,
      impact: 'medium',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-8',
      tenantId: 'tenant-8',
      type: 'rightsizing',
      title: 'Scale Down DCS Instance',
      description: 'Redis cache memory utilization averages 18%. Consider scaling from 16GB to 8GB instance.',
      resourceId: 'dcs-redis-prod',
      resourceName: 'dcs-redis-prod',
      service: 'DCS',
      currentCost: 38500.00,
      projectedSavings: 19250.00,
      impact: 'medium',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-9',
      tenantId: 'tenant-1',
      type: 'reserved_instance',
      title: 'GaussDB Reserved Capacity',
      description: 'Your GaussDB usage has been consistent. Reserved capacity purchase could yield 25% savings.',
      resourceId: 'gaussdb-cluster',
      resourceName: 'gaussdb-cluster',
      service: 'GaussDB',
      currentCost: 210000.00,
      projectedSavings: 52500.00,
      impact: 'high',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-10',
      tenantId: 'tenant-2',
      type: 'network_optimization',
      title: 'Consolidate NAT Gateways',
      description: 'Multiple NAT gateways detected in same VPC. Consolidating to single gateway could reduce costs.',
      resourceId: 'nat-gateway-group',
      resourceName: 'VPC NAT Gateways',
      service: 'NAT',
      currentCost: 24500.00,
      projectedSavings: 12250.00,
      impact: 'low',
      effort: 'moderate',
      status: 'new',
    },
  ];

  let filtered = tenantId !== 'all'
    ? recommendations.filter(r => r.tenantId === tenantId)
    : recommendations;

  // When a specific region is selected, only include recommendations for tenants
  // that have allocation in that region
  if (region !== 'all') {
    filtered = filtered.filter(r => {
      const alloc = tenantRegionAllocation[r.tenantId];
      return alloc && (alloc[region] || 0) > 0;
    });
  }

  return filtered;
}

// =====================================================
// VDC HIERARCHY GENERATION
// Deterministic VDC tree for each tenant
// =====================================================

// Per-tenant VDC naming to make each tenant's hierarchy unique
const tenantVDCNames: Record<string, { l1: string; l2: string[]; l3: Record<string, string[]>; l4: Record<string, string[]> }> = {
  'tenant-1': {
    l1: 'Dangote Enterprise VDC',
    l2: ['Manufacturing IT', 'Supply Chain Ops', 'Corporate Finance'],
    l3: { 'Manufacturing IT': ['Plant Systems', 'ERP Platform'], 'Supply Chain Ops': ['Logistics Hub'] },
    l4: { 'Plant Systems': ['SCADA Team', 'IoT Sensors'] },
  },
  'tenant-2': {
    l1: 'MTN Digital VDC',
    l2: ['Network Engineering', 'Digital Services', 'Business Systems'],
    l3: { 'Network Engineering': ['Core Network', '5G Platform'], 'Digital Services': ['MoMo Platform'] },
    l4: { 'Core Network': ['NOC Team', 'RAN Ops'] },
  },
  'tenant-3': {
    l1: 'Flutterwave Platform VDC',
    l2: ['Payment Processing', 'Risk & Compliance', 'Developer Platform'],
    l3: { 'Payment Processing': ['Gateway Core', 'Settlement Engine'], 'Risk & Compliance': ['Fraud Detection'] },
    l4: { 'Gateway Core': ['API Team', 'Routing Engine'] },
  },
  'tenant-4': {
    l1: 'Safaricom Cloud VDC',
    l2: ['M-PESA Infrastructure', 'Enterprise Solutions', 'Consumer Digital'],
    l3: { 'M-PESA Infrastructure': ['Transaction Engine', 'Agent Network'], 'Enterprise Solutions': ['B2B Platform'] },
    l4: { 'Transaction Engine': ['Core Processing', 'Reconciliation'] },
  },
  'tenant-5': {
    l1: 'Standard Bank VDC',
    l2: ['Core Banking', 'Digital Channels', 'Risk Management'],
    l3: { 'Core Banking': ['Lending Platform', 'Deposits System'], 'Digital Channels': ['Mobile Banking'] },
    l4: { 'Lending Platform': ['Credit Scoring', 'Loan Origination'] },
  },
  'tenant-6': {
    l1: 'Andela Engineering VDC',
    l2: ['Learning Platform', 'Talent Ops', 'Engineering Tools'],
    l3: { 'Learning Platform': ['Course Engine', 'Assessment Hub'], 'Talent Ops': ['Matching Service'] },
    l4: { 'Course Engine': ['Content Delivery', 'Lab Environments'] },
  },
  'tenant-7': {
    l1: 'Jumia Commerce VDC',
    l2: ['Marketplace Platform', 'Logistics Tech', 'Seller Tools'],
    l3: { 'Marketplace Platform': ['Product Catalog', 'Order Management'], 'Logistics Tech': ['Delivery Tracking'] },
    l4: { 'Product Catalog': ['Search Engine', 'Recommendation AI'] },
  },
  'tenant-8': {
    l1: 'Interswitch Gateway VDC',
    l2: ['Switch Infrastructure', 'Card Processing', 'Value Added Services'],
    l3: { 'Switch Infrastructure': ['Transaction Switch', 'Settlement Core'], 'Card Processing': ['Issuing Platform'] },
    l4: { 'Transaction Switch': ['Real-time Engine', 'Batch Processing'] },
  },
};

const defaultVDCNames = {
  l1: 'Enterprise VDC',
  l2: ['IT Division', 'Operations', 'Finance'],
  l3: { 'IT Division': ['Infrastructure', 'Development'], 'Operations': ['Production'] } as Record<string, string[]>,
  l4: { 'Infrastructure': ['Network Team', 'Storage Team'] } as Record<string, string[]>,
};

// Generate a deterministic VDC hierarchy for a tenant
// Uses seeded random for consistency across renders
export function generateVDCHierarchy(tenantId: string, tenantBudget: number): VDCNode {
  const tenantIndex = mockTenants.findIndex(t => t.id === tenantId);
  const seed = (tenantIndex + 1) * 137;
  const names = tenantVDCNames[tenantId] || defaultVDCNames;

  const l1Budget = tenantBudget;
  const l1SpendRatio = 0.7 + seededRandom(seed) * 0.2;
  const l1Spend = l1Budget * l1SpendRatio;
  const resourceCount = tenantResourceCounts[tenantId] || 80;

  // L2 divisions - deterministic split
  const itDivisionPct = 0.45;
  const operationsPct = 0.35;
  const financePct = 0.20;

  const itSpend = l1Spend * itDivisionPct;
  const itResources = Math.floor(resourceCount * itDivisionPct);
  const opsSpend = l1Spend * operationsPct;
  const opsResources = Math.floor(resourceCount * operationsPct);
  const finSpend = l1Spend * financePct;
  const finResources = resourceCount - itResources - opsResources;

  // L3 under IT Division
  const infraPct = 0.55;
  const devPct = 0.45;
  const infraSpend = itSpend * infraPct;
  const infraResources = Math.floor(itResources * infraPct);
  const devSpend = itSpend * devPct;
  const devResources = itResources - infraResources;

  // L4 under Infrastructure
  const networkPct = 0.55;
  const storagePct = 0.45;
  const networkSpend = infraSpend * networkPct;
  const networkResources = Math.floor(infraResources * networkPct);
  const storageSpend = infraSpend * storagePct;
  const storageResources = infraResources - networkResources;

  // L3 under Operations - Production is the only child
  const prodSpend = opsSpend;
  const prodResources = opsResources;

  // Deterministic trends using seeded random
  const trend = (s: number) => {
    const v = seededRandom(s);
    return v > 0.5 ? seededRandom(s + 1) * 15 : -seededRandom(s + 2) * 10;
  };

  const l2Names = names.l2;
  const l3Map = names.l3;
  const l4Map = names.l4;

  // Build L3 children for first L2
  const firstL2L3Names = l3Map[l2Names[0]] || ['Sub-dept A', 'Sub-dept B'];
  const firstL3Name = firstL2L3Names[0];
  const l4Names = l4Map[firstL3Name] || ['Team Alpha', 'Team Beta'];

  // Build L3 children for second L2
  const secondL2L3Names = l3Map[l2Names[1]] || ['Operations Core'];

  return {
    id: `${tenantId}-vdc1`,
    name: names.l1,
    tenantId,
    level: 'vdc1',
    spend: l1Spend,
    budget: l1Budget,
    resources: resourceCount,
    trend: Math.round(trend(seed + 10) * 10) / 10,
    children: [
      {
        id: `${tenantId}-vdc2-1`,
        name: l2Names[0],
        tenantId,
        level: 'vdc2',
        spend: itSpend,
        budget: l1Budget * itDivisionPct,
        resources: itResources,
        trend: Math.round(trend(seed + 20) * 10) / 10,
        children: [
          {
            id: `${tenantId}-vdc3-1`,
            name: firstL2L3Names[0],
            tenantId,
            level: 'vdc3',
            spend: infraSpend,
            budget: l1Budget * itDivisionPct * infraPct,
            resources: infraResources,
            trend: Math.round(trend(seed + 30) * 10) / 10,
            children: [
              {
                id: `${tenantId}-vdc4-1`,
                name: l4Names[0],
                tenantId,
                level: 'vdc4',
                spend: networkSpend,
                budget: l1Budget * itDivisionPct * infraPct * networkPct,
                resources: networkResources,
                trend: Math.round(trend(seed + 40) * 10) / 10,
              },
              {
                id: `${tenantId}-vdc4-2`,
                name: l4Names[1] || 'Team B',
                tenantId,
                level: 'vdc4',
                spend: storageSpend,
                budget: l1Budget * itDivisionPct * infraPct * storagePct,
                resources: storageResources,
                trend: Math.round(trend(seed + 50) * 10) / 10,
              },
            ],
          },
          {
            id: `${tenantId}-vdc3-2`,
            name: firstL2L3Names[1] || 'Development',
            tenantId,
            level: 'vdc3',
            spend: devSpend,
            budget: l1Budget * itDivisionPct * devPct,
            resources: devResources,
            trend: Math.round(trend(seed + 60) * 10) / 10,
          },
        ],
      },
      {
        id: `${tenantId}-vdc2-2`,
        name: l2Names[1],
        tenantId,
        level: 'vdc2',
        spend: opsSpend,
        budget: l1Budget * operationsPct,
        resources: opsResources,
        trend: Math.round(trend(seed + 70) * 10) / 10,
        children: [
          {
            id: `${tenantId}-vdc3-3`,
            name: secondL2L3Names[0] || 'Production',
            tenantId,
            level: 'vdc3',
            spend: prodSpend,
            budget: l1Budget * operationsPct,
            resources: prodResources,
            trend: Math.round(trend(seed + 80) * 10) / 10,
          },
        ],
      },
      {
        id: `${tenantId}-vdc2-3`,
        name: l2Names[2],
        tenantId,
        level: 'vdc2',
        spend: finSpend,
        budget: l1Budget * financePct,
        resources: finResources,
        trend: Math.round(trend(seed + 90) * 10) / 10,
      },
    ],
  };
}

// Flatten VDC tree into a list
export function flattenVDCTree(node: VDCNode, result: VDCNode[] = []): VDCNode[] {
  result.push(node);
  if (node.children) {
    node.children.forEach(child => flattenVDCTree(child, result));
  }
  return result;
}

// Get all leaf VDC IDs for a given VDC (including itself if it's a leaf)
export function getLeafVDCIds(node: VDCNode): string[] {
  if (!node.children || node.children.length === 0) {
    return [node.id];
  }
  return node.children.flatMap(child => getLeafVDCIds(child));
}

// Get all VDC IDs under a node (including itself)
export function getAllVDCIds(node: VDCNode): string[] {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(...getAllVDCIds(child));
    });
  }
  return ids;
}

// Generate all VDC hierarchies for given tenants
export function generateAllVDCHierarchies(tenantId: string | 'all'): VDCNode[] {
  const tenantsToProcess = tenantId === 'all'
    ? mockTenants
    : mockTenants.filter(t => t.id === tenantId);

  return tenantsToProcess.map(t => generateVDCHierarchy(t.id, t.budget));
}

// =====================================================
// RESOURCE GENERATION
// =====================================================

// Available tags for resources
const allTags = ['production', 'staging', 'critical', 'auto-scaled', 'backup', 'monitoring', 'compliance', 'dev', 'test'];

// Generate resources with VARIED utilization data
// Creates a realistic distribution: some underutilized, some optimal, some high
export function generateResources(tenantId: string | 'all', selectedRegion: HuaweiRegion | 'all' = 'all'): Resource[] {
  const resources: Resource[] = [];

  const tenantsToProcess = tenantId === 'all'
    ? mockTenants
    : mockTenants.filter(t => t.id === tenantId);

  // Predefined utilization patterns for variety
  const utilizationPatterns = [
    { cpu: 15, mem: 22, net: 8, disk: 45, label: 'underutilized' },
    { cpu: 12, mem: 18, net: 5, disk: 35, label: 'underutilized' },
    { cpu: 25, mem: 30, net: 15, disk: 50, label: 'low' },
    { cpu: 28, mem: 35, net: 20, disk: 55, label: 'low' },
    { cpu: 38, mem: 45, net: 30, disk: 60, label: 'moderate' },
    { cpu: 45, mem: 52, net: 35, disk: 65, label: 'moderate' },
    { cpu: 55, mem: 58, net: 42, disk: 70, label: 'healthy' },
    { cpu: 62, mem: 65, net: 48, disk: 72, label: 'healthy' },
    { cpu: 68, mem: 72, net: 55, disk: 75, label: 'optimal' },
    { cpu: 75, mem: 78, net: 60, disk: 78, label: 'optimal' },
    { cpu: 82, mem: 85, net: 65, disk: 82, label: 'high' },
    { cpu: 88, mem: 90, net: 72, disk: 85, label: 'high' },
    { cpu: 92, mem: 88, net: 78, disk: 88, label: 'critical' },
    { cpu: 95, mem: 92, net: 82, disk: 90, label: 'critical' },
    { cpu: 8, mem: 12, net: 3, disk: 25, label: 'idle' },
    { cpu: 42, mem: 48, net: 28, disk: 58, label: 'moderate' },
    { cpu: 72, mem: 68, net: 52, disk: 76, label: 'healthy' },
    { cpu: 35, mem: 40, net: 25, disk: 55, label: 'low-moderate' },
    { cpu: 58, mem: 62, net: 45, disk: 68, label: 'healthy' },
    { cpu: 85, mem: 82, net: 68, disk: 80, label: 'high' },
  ];

  tenantsToProcess.forEach(tenant => {
    const resourceCount = tenantResourceCounts[tenant.id];
    const serviceAllocation = tenantServiceAllocation[tenant.id];
    const regionAllocation = tenantRegionAllocation[tenant.id];
    const monthlySpend = tenantMonthlySpend[tenant.id];

    // Services with resources (non-zero allocation)
    const activeServices = (Object.keys(serviceAllocation) as HuaweiService[])
      .filter(s => serviceAllocation[s] > 0);
    const activeRegions = (Object.keys(regionAllocation) as HuaweiRegion[])
      .filter(r => regionAllocation[r] > 0);

    // Tenant index affects pattern distribution
    const tenantIndex = mockTenants.findIndex(t => t.id === tenant.id);

    // Get leaf VDC IDs for this tenant's hierarchy
    const hierarchy = generateVDCHierarchy(tenant.id, tenant.budget);
    const leafVDCs = flattenVDCTree(hierarchy).filter(v => !v.children || v.children.length === 0);
    const leafVDCIds = leafVDCs.map(v => v.id);

    for (let i = 0; i < resourceCount; i++) {
      // Deterministic service/region selection based on index
      const serviceIndex = i % activeServices.length;
      const regionIndex = Math.floor(i / activeServices.length) % activeRegions.length;

      const service = activeServices[serviceIndex];
      const region = activeRegions[regionIndex];

      // Select utilization pattern based on resource index and tenant
      const patternIndex = (i * 7 + tenantIndex * 3) % utilizationPatterns.length;
      const basePattern = utilizationPatterns[patternIndex];

      // Add small deterministic variation based on service type
      const serviceVariation = (activeServices.indexOf(service) * 5) % 15 - 7;

      const cpuUtil = Math.min(98, Math.max(5, basePattern.cpu + serviceVariation));
      const memUtil = Math.min(98, Math.max(8, basePattern.mem + serviceVariation - 2));
      const netUtil = Math.min(95, Math.max(3, basePattern.net + serviceVariation));
      const diskUtil = Math.min(95, Math.max(15, basePattern.disk + (serviceVariation / 2)));

      // Cost per resource based on service allocation
      const servicePct = serviceAllocation[service];
      const avgCostPerResource = (monthlySpend * servicePct) / Math.max(1, Math.round(resourceCount * servicePct));

      // Environment type based on index
      const envTypes = ['prod', 'staging', 'dev', 'test', 'qa'];
      const envIndex = (i + tenantIndex) % 5;

      // Assign VDC deterministically - distribute resources across leaf VDCs
      const vdcIndex = i % leafVDCIds.length;
      const vdcId = leafVDCIds[vdcIndex];

      // Generate 1-3 tags deterministically
      const tagSeed = (i * 13 + tenantIndex * 7);
      const tagCount = 1 + (tagSeed % 3); // 1-3 tags
      const tags: string[] = [];
      for (let t = 0; t < tagCount; t++) {
        const tagIdx = (tagSeed + t * 5) % allTags.length;
        if (!tags.includes(allTags[tagIdx])) {
          tags.push(allTags[tagIdx]);
        }
      }

      // Status: ~3% error, rest split between running and stopped based on utilization
      let status: 'running' | 'stopped' | 'error';
      const statusSeed = seededRandom((i + 1) * 31 + tenantIndex * 97);
      if (statusSeed < 0.03) {
        status = 'error';
      } else if (cpuUtil < 10 && i % 8 === 7) {
        status = 'stopped';
      } else {
        status = 'running';
      }

      resources.push({
        id: `${tenant.id}-resource-${i + 1}`,
        tenantId: tenant.id,
        vdcId,
        name: `${service.toLowerCase()}-${envTypes[envIndex]}-${String(i + 1).padStart(2, '0')}`,
        service,
        region,
        type: service === 'ECS' ? 's6.xlarge.4' : service === 'RDS' ? 'mysql.x1.large.4' : 'standard',
        status,
        tags,
        cpuUtilization: Math.round(cpuUtil),
        memoryUtilization: Math.round(memUtil),
        networkUtilization: Math.round(netUtil),
        diskUtilization: Math.round(diskUtil),
        monthlyCost: Math.round(avgCostPerResource * 100) / 100,
        createdAt: new Date(Date.now() - (i * 2 + 30) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  // Filter by region if a specific region is selected
  if (selectedRegion !== 'all') {
    return resources.filter(r => r.region === selectedRegion);
  }

  return resources;
}

// Tenant summaries for comparison view - uses consistent KPI data
export function generateTenantSummaries(region: HuaweiRegion | 'all' = 'all'): TenantSummary[] {
  return mockTenants.map(tenant => {
    const kpis = generateKPIs(tenant.id, 30, region);
    const services = generateServiceBreakdown(tenant.id, 30, region);
    const recommendations = generateRecommendations(tenant.id, region);

    return {
      tenant,
      totalSpend: kpis.totalSpend,
      budgetUsage: kpis.budgetUsed,
      efficiencyScore: tenant.efficiencyScore,
      topService: services[0]?.service || 'ECS',
      recommendationCount: recommendations.length,
    };
  });
}
