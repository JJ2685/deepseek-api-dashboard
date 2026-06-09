import { useState } from 'react';
import { getStoredKey, storeKey } from '../hooks/useDeepSeekData';
import { MODULES, getEnabledModules, setEnabledModules } from '../modules/registry';
import { Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  hasApiKey: boolean;
}

export default function SettingsDialog({ open, onClose, onSaved, hasApiKey }: Props) {
  const [keyValue, setKeyValue] = useState(getStoredKey);
  const [enabledIds, setEnabledIds] = useState<string[]>(getEnabledModules);

  if (!open) return null;

  const handleSave = () => {
    storeKey(keyValue.trim());
    setEnabledModules(enabledIds);
    onSaved();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const toggleModule = (id: string) => {
    setEnabledIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__title">设置</div>

        <div>
          <label className="dialog__label">DeepSeek API Key</label>
          <input
            className="dialog__input"
            type="password"
            value={keyValue}
            onChange={e => setKeyValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            autoFocus
          />
        </div>

        {hasApiKey && (
          <div className="settings-modules">
            <div className="settings-section-title">模块管理</div>
            {MODULES.map(mod => (
              <label key={mod.id} className="settings-module-row">
                <span className="settings-module-label">
                  <input
                    type="checkbox"
                    className="settings-module-checkbox"
                    checked={mod.required || enabledIds.includes(mod.id)}
                    disabled={mod.required}
                    onChange={() => toggleModule(mod.id)}
                  />
                  {mod.name}
                </span>
                {mod.required && <Lock size={12} className="settings-module-locked" />}
              </label>
            ))}
          </div>
        )}

        <div className="dialog__actions">
          <button className="dialog__btn dialog__btn--cancel" onClick={onClose}>取消</button>
          <button className="dialog__btn dialog__btn--save" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
