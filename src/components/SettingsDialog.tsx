import { useState } from 'react';
import { getStoredKey, storeKey } from '../hooks/useDeepSeekData';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsDialog({ open, onClose, onSaved }: Props) {
  const [value, setValue] = useState(getStoredKey);

  if (!open) return null;

  const handleSave = () => {
    storeKey(value.trim());
    onSaved();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__title">API Key 设置</div>
        <div>
          <label className="dialog__label">DeepSeek API Key</label>
          <input
            className="dialog__input"
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            autoFocus
          />
        </div>
        <div className="dialog__actions">
          <button className="dialog__btn dialog__btn--cancel" onClick={onClose}>取消</button>
          <button className="dialog__btn dialog__btn--save" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
