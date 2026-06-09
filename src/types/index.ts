export interface BalanceData {
  isAvailable: boolean;
  totalBalance: string;
  toppedUpBalance: string;
  grantedBalance: string;
  currency: string;
}

export interface DailyUsage {
  date: string;
  tokens: number;
}

export interface UsageData {
  totalTokens: number;
  daily: DailyUsage[];
}

export interface DashboardData {
  balance: BalanceData | null;
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
}
