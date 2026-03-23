import { create } from 'zustand';
import type { Currency, FilterState, DateRange, HuaweiService, HuaweiRegion } from '@shared/schema';
import { useDataStore } from './data-store';

interface FinOpsStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;

  selectedTenantId: string | 'all';
  setSelectedTenantId: (tenantId: string | 'all') => void;

  selectedRegion: HuaweiRegion | 'all';
  setSelectedRegion: (region: HuaweiRegion | 'all') => void;

  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;

  selectedServices: HuaweiService[];
  setSelectedServices: (services: HuaweiService[]) => void;

  selectedRegions: HuaweiRegion[];
  setSelectedRegions: (regions: HuaweiRegion[]) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

export const useFinOpsStore = create<FinOpsStore>((set) => ({
  currency: 'NGN',
  setCurrency: (currency) => set({ currency }),

  selectedTenantId: 'all',
  setSelectedTenantId: (selectedTenantId) => set({ selectedTenantId }),

  selectedRegion: 'all',
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),

  dateRange: {
    preset: 'last30days',
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  },
  setDateRange: (dateRange) => set({ dateRange }),

  selectedServices: [],
  setSelectedServices: (selectedServices) => set({ selectedServices }),

  selectedRegions: [],
  setSelectedRegions: (selectedRegions) => set({ selectedRegions }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));

// Currency conversion: all amounts are in NGN, convert using admin-set rates
export function convertCurrency(amount: number, toCurrency: Currency): number {
  if (toCurrency === 'NGN') return amount;
  const rates = useDataStore.getState().settings.exchangeRates;
  const rate = rates[toCurrency] ?? 1;
  return amount * rate;
}

const symbols: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
};

export function formatCurrency(amount: number, currency: Currency): string {
  const converted = convertCurrency(amount, currency);

  if (currency === 'JPY' || currency === 'NGN') {
    return `${symbols[currency]}${Math.round(converted).toLocaleString()}`;
  }

  return `${symbols[currency]}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatCompactCurrency(amount: number, currency: Currency): string {
  const converted = convertCurrency(amount, currency);

  if (converted >= 1000000) {
    return `${symbols[currency]}${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${symbols[currency]}${(converted / 1000).toFixed(1)}K`;
  }

  if (currency === 'JPY' || currency === 'NGN') {
    return `${symbols[currency]}${Math.round(converted).toLocaleString()}`;
  }

  return `${symbols[currency]}${converted.toFixed(2)}`;
}
