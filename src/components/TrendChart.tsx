import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import type { TooltipItem, ScriptableContext } from 'chart.js';
import { UsageData, BalanceSnapshot } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  usage: UsageData | null;
  balanceSnapshots: BalanceSnapshot[];
  loading: boolean;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatBalance(n: number): string {
  return '¥' + n.toFixed(2);
}

function createGradient(ctx: CanvasRenderingContext2D, height: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#6c5ce7');
  g.addColorStop(1, '#3b6df0');
  return g;
}

export default function TrendChart({ usage, balanceSnapshots, loading }: Props) {
  if (loading) {
    return (
      <div className="trend-card">
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </div>
    );
  }

  // Prefer actual API usage data when available (backward compat)
  const daily = usage?.daily ?? [];
  const hasUsageData = daily.length > 0;

  // Build balance trend data from snapshots
  const snapLabels = balanceSnapshots.map(s => s.date.slice(5));
  const snapValues = balanceSnapshots.map(s => s.balance);

  // Decide which dataset to render
  const labels = hasUsageData ? daily.map(d => d.date.slice(5)) : snapLabels;
  const values = hasUsageData ? daily.map(d => d.tokens) : snapValues;
  const hasData = hasUsageData || snapValues.length >= 2;

  const totalTokens = usage?.totalTokens ?? 0;
  const currentBalance = snapValues.length > 0 ? snapValues[snapValues.length - 1] : 0;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: (ctx: ScriptableContext<'bar'>) => {
          const h = ctx.chart.chartArea?.bottom ?? 180;
          return createGradient(ctx.chart.ctx, h);
        },
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
    ],
  };

  const yCallback = hasUsageData
    ? (v: number | string) => formatTokens(Number(v))
    : (v: number | string) => formatBalance(Number(v));

  const tooltipLabel = hasUsageData
    ? (ctx: TooltipItem<'bar'>) => `${Number(ctx.parsed.y ?? 0).toLocaleString()} tokens`
    : (ctx: TooltipItem<'bar'>) => formatBalance(Number(ctx.parsed.y ?? 0));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 50, 0.85)',
        titleFont: { size: 13 },
        bodyFont: { size: 14, weight: 'bold' as const },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: tooltipLabel,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#999', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#aaa',
          font: { size: 11 },
          callback: yCallback,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  const title = hasUsageData ? '消耗趋势' : '余额趋势';
  const summary = hasUsageData
    ? `合计 ${formatTokens(totalTokens)}`
    : `当前余额 ${formatBalance(currentBalance)}`;

  return (
    <div className="trend-card">
      <div className="trend-card__header">
        <span className="trend-card__title">{title}</span>
        <span className="trend-card__total">{summary}</span>
      </div>
      <div className="trend-card__chart">
        {hasData ? (
          <Bar data={data} options={options} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 14 }}>
            数据收集中，请等待下次刷新
          </div>
        )}
      </div>
    </div>
  );
}