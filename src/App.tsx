import { useState, useCallback } from 'react';
import { useDeepSeekData } from './hooks/useDeepSeekData';
import TitleBar from './components/TitleBar';
import SettingsDialog from './components/SettingsDialog';
import FinanceCard from './components/FinanceCard';
import TrendChart from './components/TrendChart';
import EmptyState from './components/EmptyState';
import './App.css';

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('deepseek_api_key') ?? '';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const data = useDeepSeekData(apiKey);

  const handleSaved = useCallback(() => {
    const key = localStorage.getItem('deepseek_api_key') ?? '';
    setApiKey(key);
  }, []);

  const hasKey = apiKey.length > 0;

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
            <>
              <FinanceCard
                balance={data.balance}
                usage={data.usage}
                error={data.error}
                loading={data.loading}
              />
              <TrendChart usage={data.usage} loading={data.loading} />
            </>
          )}
        </div>
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}