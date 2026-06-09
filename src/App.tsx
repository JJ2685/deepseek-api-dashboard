import { useState, useCallback, useMemo } from 'react';
import { useDeepSeekData } from './hooks/useDeepSeekData';
import TitleBar from './components/TitleBar';
import SettingsDialog from './components/SettingsDialog';
import EmptyState from './components/EmptyState';
import { MODULES, getEnabledModules } from './modules/registry';
import './App.css';

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('deepseek_api_key') ?? '';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);

  const data = useDeepSeekData(apiKey);
  const hasKey = apiKey.length > 0;

  const handleSaved = useCallback(() => {
    const key = localStorage.getItem('deepseek_api_key') ?? '';
    setApiKey(key);
    setSaveVersion(v => v + 1);
  }, []);

  const enabledIds = useMemo(() => {
    if (!hasKey) return [];
    return getEnabledModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey, saveVersion]);

  const moduleProps = useMemo(() => ({
    balance: data.balance,
    usage: data.usage,
    error: data.error,
    loading: data.loading,
    monthlySpent: data.monthlySpent,
    balanceSnapshots: data.balanceSnapshots,
  }), [data.balance, data.usage, data.error, data.loading, data.monthlySpent, data.balanceSnapshots]);

  const visibleModules = useMemo(() => {
    if (!hasKey) return [];
    return MODULES.filter(m => m.required || enabledIds.includes(m.id));
  }, [hasKey, enabledIds]);

  return (
    <div className="app-shell">
      <div className="glass-window">
        <TitleBar
          onRefresh={data.refresh}
          onSettings={() => setSettingsOpen(true)}
          loading={data.loading}
        />
        <div className="glass-window__body">
          {!hasKey ? (
            <EmptyState onOpenSettings={() => setSettingsOpen(true)} />
          ) : (
            visibleModules.map(mod => {
              const M = mod.component;
              return <M key={mod.id} {...moduleProps} />;
            })
          )}
        </div>
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSaved}
        hasApiKey={hasKey}
      />
    </div>
  );
}