import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../types';
import { fetchBalance, fetchUsage } from '../services/deepseekApi';

const KEY_STORAGE = 'deepseek_api_key';

export function getStoredKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}

export function storeKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key);
}

export function clearKey(): void {
  localStorage.removeItem(KEY_STORAGE);
}

export function useDeepSeekData(apiKey: string): DashboardData & { refresh: () => void } {
  const [data, setData] = useState<DashboardData>({
    balance: null,
    usage: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!apiKey) {
      setData({ balance: null, usage: null, loading: false, error: null });
      return;
    }
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [balance, usage] = await Promise.allSettled([
        fetchBalance(apiKey),
        fetchUsage(apiKey),
      ]);
      setData({
        balance: balance.status === 'fulfilled' ? balance.value : null,
        usage: usage.status === 'fulfilled' ? usage.value : null,
        loading: false,
        error:
          balance.status === 'rejected'
            ? balance.reason.message
            : usage.status === 'rejected'
              ? usage.reason.message
              : null,
      });
    } catch {
      setData(prev => ({ ...prev, loading: false, error: '未知错误' }));
    }
  }, [apiKey]);

  useEffect(() => { load(); }, [load]);

  return { ...data, refresh: load };
}
