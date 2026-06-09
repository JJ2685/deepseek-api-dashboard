import { BalanceData, UsageData } from '../types';

interface Props {
  balance: BalanceData | null;
  usage: UsageData | null;
  error: string | null;
  loading: boolean;
}

export default function FinanceCard({ balance, usage, error, loading }: Props) {
  if (loading) {
    return (
      <div className="finance-card">
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="finance-card">
        <div className="finance-card__amounts">
          <div className="finance-card__item">
            <span className="finance-card__label">状态</span>
            <span className="finance-card__value" style={{ fontSize: 15, color: '#c62828', fontWeight: 500 }}>
              {error}
            </span>
          </div>
        </div>
        <div className="finance-card__status finance-card__status--error">
          <span className="finance-card__dot finance-card__dot--red" />
          连接失败
        </div>
      </div>
    );
  }

  const balanceNum = balance ? parseFloat(balance.totalBalance).toFixed(2) : '—';
  const currency = balance?.currency === 'CNY' ? '¥' : '$';
  const available = balance?.isAvailable ?? false;

  const monthlySpend = (() => {
    if (usage && usage.totalTokens > 0) {
      const cost = usage.totalTokens * 0.000002;
      return cost.toFixed(2);
    }
    return '—';
  })();

  return (
    <div className="finance-card">
      <div className="finance-card__amounts">
        <div className="finance-card__item">
          <span className="finance-card__label">账户余额</span>
          <span className="finance-card__value finance-card__value--blue">
            {balance ? `${currency}${balanceNum}` : '—'}
          </span>
        </div>
        <div className="finance-card__item">
          <span className="finance-card__label">本月消费</span>
          <span className="finance-card__value finance-card__value--orange">
            {monthlySpend === '—' ? '—' : `${currency}${monthlySpend}`}
          </span>
        </div>
      </div>
      <div className="finance-card__status">
        <span className={`finance-card__dot ${available ? 'finance-card__dot--green' : 'finance-card__dot--red'}`} />
        {available ? '账户可用' : '账户不可用'}
      </div>
    </div>
  );
}
