import { BalanceData, UsageData, BalanceSnapshot } from '../types';
import FinanceCard from '../components/FinanceCard';
import TrendChart from '../components/TrendChart';

export interface ModuleProps {
  balance: BalanceData | null;
  usage: UsageData | null;
  error: string | null;
  loading: boolean;
  monthlySpent: number | null;
  balanceSnapshots: BalanceSnapshot[];
}

export interface ModuleDef {
  id: string;
  name: string;
  component: React.ComponentType<ModuleProps>;
  required?: boolean;
}

export const MODULES: ModuleDef[] = [
  { id: 'finance', name: '账户财务', component: FinanceCard, required: true },
  { id: 'trend',   name: '余额趋势', component: TrendChart },
];

const STORAGE_KEY = 'dashboard_modules';

function optionalModuleIds(): string[] {
  return MODULES.filter(m => !m.required).map(m => m.id);
}

export function getEnabledModules(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      const valid = optionalModuleIds();
      return arr.filter(id => valid.includes(id));
    }
  } catch { /* corrupt data, fall through */ }
  return optionalModuleIds();
}

export function setEnabledModules(ids: string[]): void {
  const valid = optionalModuleIds();
  const filtered = ids.filter(id => valid.includes(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}