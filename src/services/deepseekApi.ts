import { BalanceData, UsageData } from "../types";
import { getCached, setCache, cacheKey } from "./cache";

const BALANCE_URL = "https://api.deepseek.com/user/balance";
const USAGE_URL = "https://api.deepseek.com/dashboard/billing/usage";
const BILLING_URL = "https://api.deepseek.com/dashboard/billing/cost";

// DeepSeek public pricing (CNY per 1M tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  "deepseek-chat":     { input: 1, output: 2 },
  "deepseek-reasoner": { input: 4, output: 16 },
};
const DEFAULT_MODEL = "deepseek-chat";

export function estimateCost(totalTokens: number, model = DEFAULT_MODEL): number {
  const rate = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  const avgRate = (rate.input + rate.output) / 2;
  return (totalTokens / 1_000_000) * avgRate;
}

export async function fetchBalance(apiKey: string): Promise<BalanceData> {
  const ck = cacheKey(apiKey, "balance");
  const cached = getCached<BalanceData>(ck);
  if (cached) return cached;

  const res = await fetch(BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("API Key 无效，请检查后重试");
    throw new Error(`请求失败 (${res.status})`);
  }
  const json = await res.json();
  const info = json.balance_infos?.[0] ?? {};
  const data: BalanceData = {
    isAvailable: json.is_available ?? false,
    totalBalance: info.total_balance ?? "0.00",
    toppedUpBalance: info.topped_up_balance ?? "0.00",
    grantedBalance: info.granted_balance ?? "0.00",
    currency: info.currency ?? "CNY",
  };
  setCache(ck, data);
  return data;
}

export async function fetchUsage(apiKey: string): Promise<UsageData> {
  const ck = cacheKey(apiKey, "usage");
  const cached = getCached<UsageData>(ck);
  if (cached) return cached;

  const res = await fetch(USAGE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("API Key 无效，请检查后重试");
    throw new Error("用量数据暂不可用");
  }
  const json = await res.json();

  const dailyRaw: Array<Record<string, unknown>> = json.data?.daily ?? [];
  const daily = dailyRaw.map((d) => ({
    date: String(d.date ?? ""),
    tokens: Number(d.tokens ?? 0),
    cost: d.cost != null ? Number(d.cost) : undefined,
    inputTokens: d.input_tokens != null ? Number(d.input_tokens) : undefined,
    outputTokens: d.output_tokens != null ? Number(d.output_tokens) : undefined,
  }));

  const totalTokens = daily.reduce((sum, d) => sum + d.tokens, 0);

  // prefer server-provided total_cost; fall back to summing daily costs
  let totalCost: number | undefined;
  if (json.data?.total_cost != null) {
    totalCost = Number(json.data.total_cost);
  } else {
    const dailySum = daily.reduce((sum, d) => sum + (d.cost ?? 0), 0);
    totalCost = daily.some(d => d.cost != null) ? dailySum : undefined;
  }

  const data: UsageData = { totalTokens, daily };
  if (totalCost != null) data.totalCost = totalCost;
  setCache(ck, data);
  return data;
}

/** Optional billing cost endpoint — merges cost data if available. */
export async function fetchBilling(apiKey: string): Promise<{ totalCost?: number } | null> {
  const ck = cacheKey(apiKey, "billing");
  const cached = getCached<{ totalCost?: number }>(ck);
  if (cached) return cached;

  try {
    const res = await fetch(BILLING_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const json = await res.json();

    let totalCost: number | undefined;
    if (json.data?.total_cost != null) {
      totalCost = Number(json.data.total_cost);
    } else if (json.total_cost != null) {
      totalCost = Number(json.total_cost);
    } else if (json.cost != null) {
      totalCost = Number(json.cost);
    }

    if (totalCost != null) {
      const data = { totalCost };
      setCache(ck, data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
