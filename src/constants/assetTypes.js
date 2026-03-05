import {
  Activity,
  Building2,
  TrendingUp,
  Wallet,
  Globe
} from 'lucide-react';

export const ASSET_TYPES = {
  STOCK: { label: 'Stocks', icon: Activity, color: 'indigo' },
  MF: { label: 'Mutual Funds', icon: Building2, color: 'emerald' },
  ETF: { label: 'ETFs', icon: TrendingUp, color: 'amber' },
  US_STOCK: { label: 'US Stocks', icon: Globe, color: 'blue' }
};
