import { BalanceData, UsageData } from '../types';

const BALANCE_URL = 'https://api.deepseek.com/user/balance';

export async function fetchBalance(apiKey: string): Promise<BalanceData> {
  const res = await fetch(BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('API Key 无效，请检查后重试');
    throw new Error(`请求失败 (${res.status})`);
  }
  const json = await res.json();
  const info = json.balance_infos?.[0] ?? {};
  return {
    isAvailable: json.is_available ?? false,
    totalBalance: info.total_balance ?? '0.00',
    toppedUpBalance: info.topped_up_balance ?? '0.00',
    grantedBalance: info.granted_balance ?? '0.00',
    currency: info.currency ?? 'CNY',
  };
}

export async function fetchUsage(apiKey: string): Promise<UsageData> {
  const res = await fetch('https://api.deepseek.com/dashboard/billing/usage', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error('用量数据暂不可用');
  }
  const json = await res.json();
  const daily: UsageData['daily'] = (json.data?.daily ?? []).map((d: { date: string; tokens: number }) => ({
    date: d.date,
    tokens: d.tokens,
  }));
  return {
    totalTokens: daily.reduce((sum: number, d: { tokens: number }) => sum + d.tokens, 0),
    daily,
  };
}
