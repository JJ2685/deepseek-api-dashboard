import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { UsageData } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  usage: UsageData | null;
  loading: boolean;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, '#6c5ce7');
  g.addColorStop(1, '#3b6df0');
  return g;
}

export default function TrendChart({ usage, loading }: Props) {
  if (loading) {
    return (
      <div className="trend-card">
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </div>
    );
  }

  const daily = usage?.daily ?? [];
  const labels = daily.map(d => d.date.slice(5));
  const values = daily.map(d => d.tokens);
  const total = usage?.totalTokens ?? 0;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
          return createGradient(ctx.chart.ctx);
        },
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
    ],
  };

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
          label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y.toLocaleString()} tokens`,
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
          callback: (v: number | string) => formatTokens(Number(v)),
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="trend-card">
      <div className="trend-card__header">
        <span className="trend-card__title">消耗趋势</span>
        <span className="trend-card__total">合计 <strong>{formatTokens(total)}</strong> tokens</span>
      </div>
      <div className="trend-card__chart">
        {daily.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 14 }}>
            暂无消耗数据
          </div>
        )}
      </div>
    </div>
  );
}
