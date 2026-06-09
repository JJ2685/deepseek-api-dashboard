import { useState } from 'react';
import { RotateCw, Settings, X, Minus, Pin, PinOff } from 'lucide-react';

interface Props {
  onRefresh: () => void;
  onSettings: () => void;
  loading: boolean;
}

declare global {
  interface Window {
    electronAPI?: {
      closeWindow: () => void;
      minimizeWindow: () => void;
      toggleAlwaysOnTop: () => Promise<boolean>;
    };
  }
}

export default function TitleBar({ onRefresh, onSettings, loading }: Props) {
  const isElectron = !!window.electronAPI;
  const [pinned, setPinned] = useState(false);

  const handleClose = () => {
    if (isElectron) {
      window.electronAPI!.closeWindow();
    }
  };

  const handleMinimize = () => {
    if (isElectron) {
      window.electronAPI!.minimizeWindow();
    }
  };

  const handleTogglePin = async () => {
    if (isElectron) {
      const result = await window.electronAPI!.toggleAlwaysOnTop();
      setPinned(result);
    }
  };

  return (
    <div className="titlebar" style={isElectron ? { WebkitAppRegion: 'drag' } as React.CSSProperties : undefined}>
      <span className="titlebar__title">API 用量监控</span>
      <div className="titlebar__actions" style={isElectron ? { WebkitAppRegion: 'no-drag' } as React.CSSProperties : undefined}>
        <button
          className={`titlebar__btn ${loading ? 'titlebar__btn--spinning' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="刷新数据"
        >
          <RotateCw size={15} />
        </button>
        {isElectron && (
          <button
            className={`titlebar__btn ${pinned ? 'titlebar__btn--active' : ''}`}
            onClick={handleTogglePin}
            title={pinned ? '取消置顶' : '窗口置顶'}
          >
            {pinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
        )}
        <button className="titlebar__btn" onClick={onSettings} title="设置 API Key">
          <Settings size={15} />
        </button>
        {isElectron && (
          <button className="titlebar__btn" onClick={handleMinimize} title="最小化">
            <Minus size={15} />
          </button>
        )}
        <button className="titlebar__btn titlebar__btn--close" onClick={handleClose} title={isElectron ? '关闭' : '隐藏'}>
          <X size={15} />
        </button>
      </div>
    </div>
  );
}