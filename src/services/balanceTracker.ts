import { BalanceSnapshot } from "../types";

const STORAGE_KEY = "balance_snapshots";
const MAX_DAYS = 90;

function loadSnapshots(): BalanceSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr: BalanceSnapshot[] = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: BalanceSnapshot[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Save a balance snapshot. One per day — replaces if same day. Prunes data older than 90 days. */
export function snapshot(totalBalance: number): void {
  if (isNaN(totalBalance)) return;

  const snapshots = loadSnapshots();
  const key = todayKey();
  const now = Date.now();

  const idx = snapshots.findIndex((s) => s.date === key);
  if (idx >= 0) {
    snapshots[idx] = { date: key, balance: totalBalance, timestamp: now };
  } else {
    snapshots.push({ date: key, balance: totalBalance, timestamp: now });
  }

  // prune older than MAX_DAYS
  const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000;
  const pruned = snapshots.filter((s) => s.timestamp >= cutoff);

  // keep max 90 entries; sort ascending
  pruned.sort((a, b) => a.timestamp - b.timestamp);
  saveSnapshots(pruned.slice(-MAX_DAYS));
}

/** Return snapshots sorted ascending by date. */
export function getSnapshots(): BalanceSnapshot[] {
  const snapshots = loadSnapshots();
  snapshots.sort((a, b) => a.timestamp - b.timestamp);
  return snapshots;
}

/**
 * Estimate monthly spend from balance snapshots.
 * = earliest snapshot in current month - latest snapshot.
 * Returns null if not enough data (fewer than 2 snapshots, or none in current month).
 * Clamps negative values (top-up) to 0.
 */
export function getMonthlySpent(): number | null {
  const snapshots = getSnapshots();
  if (snapshots.length < 2) return null;

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthSnapshots = snapshots.filter((s) => s.date.startsWith(monthPrefix));

  if (monthSnapshots.length < 2) return null;

  const first = monthSnapshots[0].balance;
  const last = monthSnapshots[monthSnapshots.length - 1].balance;
  const spent = first - last;
  return Math.max(0, spent);
}