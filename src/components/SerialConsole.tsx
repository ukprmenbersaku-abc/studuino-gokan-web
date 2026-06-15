import React from 'react';
import serialManager from '../utils/serialManager';
import { Terminal, Shield, Copy, RefreshCw, XCircle, Play, Check, Bluetooth, AlertTriangle } from 'lucide-react';

interface SerialConsoleProps {
  logs: { text: string; type: 'info' | 'error' | 'success' | 'repl'; timestamp: string }[];
  onClearLogs: () => void;
  isConnected: boolean;
  isSimulating: boolean;
  onConnectToggle: () => void;
}

export const SerialConsole: React.FC<SerialConsoleProps> = ({
  logs,
  onClearLogs,
  isConnected,
  isSimulating,
  onConnectToggle,
}) => {
  const [copiedLogs, setCopiedLogs] = React.useState(false);
  const consoleEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of console logs
  React.useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = () => {
    const formattedLogs = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(formattedLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col h-full font-mono text-xs overflow-hidden shadow-xs" id="tutorial-serial">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-300 font-bold">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>システムコンソール & シリアル接続</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'ボード接続中' : '仮想シミュレータ'}</span>
          </div>

          <button
            onClick={onConnectToggle}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              isConnected
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                : 'bg-emerald-500 text-black hover:bg-emerald-400'
            }`}
          >
            {isConnected ? 'ポート切断' : 'ボード接続 (USB)'}
          </button>
        </div>
      </div>

      {/* Frame permission alerts */}
      {!isConnected && (
        <div className="bg-amber-950/20 border-b border-amber-900/30 px-4 py-2.5 flex items-start gap-2 text-amber-300 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="font-sans">
            <strong>Web Serial 制限の補足:</strong> iframe内ではUSB接続がブロックされる場合があります。
            エラーが出る際は右上の<strong>新しいタブで開くアイコン</strong>をクリックし、フル画面でUSB接続をお試しください。
            接続なしでも<strong>仮想シミュレータ</strong>が瞬時に連動し、動作確認できます。
          </p>
        </div>
      )}

      {/* Terminal Log Output Window */}
      <div className="flex-1 p-4 overflow-y-auto h-[220px] lg:h-[280px] space-y-1.5 scrollbar-thin text-zinc-300">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-1 select-none py-10 font-sans">
            <Terminal className="w-8 h-8 stroke-1 text-zinc-700" />
            <p className="text-xs">ログメッセージはまだありません</p>
            <p className="text-[10px] opacity-75">ボード接続やデータ転送などのログがここに出力されます</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            let textColor = 'text-zinc-300';
            let prefix = '>>>';

            if (log.type === 'error') {
              textColor = 'text-rose-400 font-semibold';
              prefix = '[ERROR]';
            } else if (log.type === 'success') {
              textColor = 'text-emerald-400 font-semibold';
              prefix = '[OK]';
            } else if (log.type === 'repl') {
              textColor = 'text-zinc-200 font-medium';
              prefix = '[REPL]';
            } else {
              textColor = 'text-indigo-300';
              prefix = '[INFO]';
            }

            return (
              <div key={idx} className={`leading-relaxed break-all ${textColor}`}>
                <span className="text-zinc-600 mr-2 selection:bg-zinc-800">[{log.timestamp}]</span>
                <span className="opacity-80 mr-1.5">{prefix}</span>
                <span>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Console Controls bar */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-4 font-sans">
        <span className="text-[10px] text-zinc-500 font-mono">
          Serial speed: 115200 bps | UTF-8 mode
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
          >
            クリア
          </button>
          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            {copiedLogs ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>ログコピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>ログをコピーする</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
