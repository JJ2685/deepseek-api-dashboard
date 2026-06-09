import { BalanceData, UsageData } from "../types";
import { estimateCost } from "../services/deepseekApi";

interface Props {
  balance: BalanceData | null;
  usage: UsageData | null;
  monthlySpent: number | null;
  error: string | null;
  loading: boolean;
}

function fmtBalance(balance: BalanceData | null): string {
  if (!balance) return "--";
  const n = parseFloat(balance.totalBalance);
  if (isNaN(n)) return "--";
  return n.toFixed(2);
}

export default function FinanceCard({ balance, usage, monthlySpent, error, loading }: Props) {
  if (loading && !balance && !usage) {
    return (
      <div className="finance-card">
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error && !balance && !usage) {
    return (
      <div className="finance-card">
        <div className="finance-card__amounts">
          <div className="finance-card__item">
            <span className="finance-card__label">状态</span>
            <span className="finance-card__value" style={{ fontSize: 15, color: "#c62828", fontWeight: 500 }}>
              {error}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const balanceNum = fmtBalance(balance);
  const currency = balance?.currency === "CNY" ? "¥" : "$";

  // Priority: balance snapshots > API totalCost > token estimate > "--"
  const spendDisplay = (() => {
    if (monthlySpent != null) return monthlySpent.toFixed(2);
    if (usage?.totalCost != null) return usage.totalCost.toFixed(2);
    if (usage && usage.totalTokens > 0) return estimateCost(usage.totalTokens).toFixed(2);
    if (balance) return "--";
    return "--";
  })();

  return (
    <div className="finance-card">
      <div className="finance-card__amounts">
        <div className="finance-card__item">
          <span className="finance-card__label">账户余额</span>
          <span className="finance-card__value finance-card__value--blue">
            {balanceNum === "--" ? "--" : `${currency}${balanceNum}`}
          </span>
        </div>
        <div className="finance-card__item">
          <span className="finance-card__label">本月消耗</span>
          <span className="finance-card__value finance-card__value--orange">
            {spendDisplay === "--" ? "--" : `${currency}${spendDisplay}`}
          </span>
        </div>
      </div>
    </div>
  );
}