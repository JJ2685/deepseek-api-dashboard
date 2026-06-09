export interface BalanceData {
  isAvailable: boolean;
  totalBalance: string;
  toppedUpBalance: string;
  grantedBalance: string;
  currency: string;
}

export interface BalanceSnapshot {
  date: string;
  balance: number;
  timestamp: number;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface UsageData {
  totalTokens: number;
  totalCost?: number;
  daily: DailyUsage[];
}

export interface DashboardData {
  balance: BalanceData | null;
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  monthlySpent: number | null;
  balanceSnapshots: BalanceSnapshot[];
}