import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardData } from "../types";
import { fetchBalance, fetchUsage, fetchBilling } from "../services/deepseekApi";
import { invalidateAll } from "../services/cache";
import { snapshot, getSnapshots, getMonthlySpent } from "../services/balanceTracker";

const KEY_STORAGE = "deepseek_api_key";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function getStoredKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? "";
}

export function storeKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key);
}

export function clearKey(): void {
  localStorage.removeItem(KEY_STORAGE);
}

const EMPTY: DashboardData = {
  balance: null,
  usage: null,
  loading: false,
  error: null,
  lastRefreshed: null,
  monthlySpent: null,
  balanceSnapshots: [],
};

export function useDeepSeekData(apiKey: string): DashboardData & { refresh: () => void } {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestKeyRef = useRef(apiKey);
  latestKeyRef.current = apiKey;

  const load = useCallback(async (bypassCache = false) => {
    const key = latestKeyRef.current;
    if (!key) {
      setData(EMPTY);
      return;
    }
    if (bypassCache) invalidateAll();

    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [balance, usage, billing] = await Promise.allSettled([
        fetchBalance(key),
        fetchUsage(key),
        fetchBilling(key),
      ]);

      if (key !== latestKeyRef.current) return;

      // snapshot balance for local trend tracking
      const balanceData = balance.status === "fulfilled" ? balance.value : null;
      if (balanceData) {
        snapshot(parseFloat(balanceData.totalBalance));
      }

      let mergedUsage = usage.status === "fulfilled" ? usage.value : null;
      if (
        mergedUsage &&
        mergedUsage.totalCost == null &&
        billing.status === "fulfilled" &&
        billing.value?.totalCost != null
      ) {
        mergedUsage = { ...mergedUsage, totalCost: billing.value.totalCost };
      }

      if (key !== latestKeyRef.current) return;

      setData({
        balance: balanceData,
        usage: mergedUsage,
        loading: false,
        error:
          balance.status === "rejected"
            ? balance.reason?.message ?? "余额查询失败"
            : usage.status === "rejected"
              ? usage.reason?.message ?? "用量查询失败"
              : null,
        lastRefreshed: new Date(),
        monthlySpent: getMonthlySpent(),
        balanceSnapshots: getSnapshots(),
      });
    } catch {
      if (key !== latestKeyRef.current) return;
      setData(prev => ({ ...prev, loading: false, error: "未知错误" }));
    }
  }, []);

  useEffect(() => {
    load(false);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (apiKey) {
      intervalRef.current = setInterval(() => load(false), REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [apiKey, load]);

  const refresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    load(true);
    if (apiKey) {
      intervalRef.current = setInterval(() => load(false), REFRESH_INTERVAL);
    }
  }, [apiKey, load]);

  return { ...data, refresh };
}