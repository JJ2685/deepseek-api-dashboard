import { KeyRound } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
}

export default function EmptyState({ onOpenSettings }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <KeyRound size={26} />
      </div>
      <p className="empty-state__text">请配置 API Key 以查看用量数据</p>
      <button className="empty-state__btn" onClick={onOpenSettings}>
        设置 API Key
      </button>
    </div>
  );
}
