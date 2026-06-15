/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BlockData, SensorData } from './types/studuino';
import { BlockEditor, generatePythonFromBlocks } from './components/BlockEditor';
import { CodeEditor } from './components/CodeEditor';
import { MonitorPanel } from './components/MonitorPanel';
import { SerialConsole } from './components/SerialConsole';
import { TutorialModal } from './components/TutorialModal';
import serialManager from './utils/serialManager';
import { scanPythonCode } from './utils/safetyScanner';
import {
  Moon,
  Sun,
  Layout,
  Code2,
  Terminal,
  Activity,
  Download,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCode,
  Share2,
  Grid
} from 'lucide-react';

export default function App() {
  const [pythonCode, setPythonCode] = React.useState<string>(`from pystubit.board import *
import time

print("Studuino:bit system online!")

# 以下のブロック変更または直接コーディングでボードを制御できます
while True:
    display.show(Image.HAPPY)
    time.sleep_ms(1000)
    display.show(Image.SMILE)
    time.sleep_ms(1000)
`);
  const [blocks, setBlocks] = React.useState<BlockData[]>([
    { id: 'b-setup', type: 'start', params: {} },
    { id: 'b-loop', type: 'loop_forever', params: {} },
  ]);
  const [projectName, setProjectName] = React.useState('マイ・スタディーノ');
  const [activeTab, setActiveTab] = React.useState<'blocks' | 'python'>('blocks');
  
  // Log entries
  const [logs, setLogs] = React.useState<{ text: string; type: 'info' | 'error' | 'success' | 'repl'; timestamp: string }[]>([]);
  
  // Real or simulated states
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSimulating, setIsSimulating] = React.useState(true);
  const [sensors, setSensors] = React.useState<SensorData>({
    temperature: 24.5,
    light: 1850,
    buttonA: false,
    buttonB: false,
    accelX: 0.1,
    accelY: -0.1,
    accelZ: 9.8,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    compassHeading: 180,
  });

  // Saving state
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  // Tutorial state
  const [showTutorial, setShowTutorial] = React.useState(false);

  // Theme support
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Theme toggler
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial mount configurations, auto-save retrieval
  React.useEffect(() => {
    // 1. Theme auto-preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);

    // 2. Load autosaved content if present
    const saved = localStorage.getItem('studuino_autosave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.pythonCode) setPythonCode(parsed.pythonCode);
        if (parsed.blocks) setBlocks(parsed.blocks);
        if (parsed.projectName) setProjectName(parsed.projectName);
        addLog('前回のデータを自動復旧しました', 'success');
      } catch (e) {}
    } else {
      // Show tutorial on very first load
      setShowTutorial(true);
    }

    // 3. Setup core manager callbacks
    const closeLogCb = serialManager.registerLogCallback((text, type) => {
      addLog(text, type);
    });

    const closeSensorCb = serialManager.registerSensorCallback((data) => {
      setSensors(data);
    });

    // Start simulation as initial default
    serialManager.startSimulation();
    addLog('仮想シミュレーター環境をアクティブにしました', 'info');

    return () => {
      closeLogCb();
      closeSensorCb();
      serialManager.disconnect();
    };
  }, []);

  // Auto-save routine when variables modifying
  React.useEffect(() => {
    if (saveStatus === 'idle') {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        try {
          const payload = { pythonCode, blocks, projectName };
          localStorage.setItem('studuino_autosave', JSON.stringify(payload));
          setSaveStatus('saved');
        } catch (e) {}
      }, 800);
      return () => clearTimeout(timer);
    } else if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pythonCode, blocks, projectName, saveStatus]);

  // Add event logger
  const addLog = (text: string, type: 'info' | 'error' | 'success' | 'repl') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { text, type, timestamp: time }]);
  };

  // Toggle USB connections
  const handleConnectToggle = async () => {
    if (isConnected) {
      await serialManager.disconnect();
      setIsConnected(false);
      setIsSimulating(true);
    } else {
      try {
        const success = await serialManager.connect();
        if (success) {
          setIsConnected(true);
          setIsSimulating(false);
          addLog('ボード接続成功。リアルタイムセンサーモニター同期中...', 'success');
        }
      } catch (err: any) {
        // Connection error captured & printed in manager logcb automatically
        setIsConnected(false);
        setIsSimulating(true);
      }
    }
  };

  // Launch live board telemetry polling back to browser dashboard
  const handleInjectMonitor = async () => {
    addLog('実機センサーモニター同期プログラムの注入を開始します...', 'info');
    const success = await serialManager.injectLiveMonitor();
    if (success) {
      addLog('実機センサーモニターの同期動作チェックが開始されました！', 'success');
    } else {
      addLog('モニタープログラムの注入に失敗しました。', 'error');
    }
  };

  // Double Check confirmation popup before Transfer code to board
  const handleTransferRequest = async () => {
    // 1. Analyze code safety first to formulate additional warn advice
    const safetyChecks = scanPythonCode(pythonCode);
    const criticalProblems = safetyChecks.filter(c => c.severity === 'critical');

    let safetyAdvice = '';
    if (criticalProblems.length > 0) {
      safetyAdvice = `\n\n⚠️ 【重大警告】: 現在のプログラムにマイコンを固まらせる可能性のある致命的なバグが ${criticalProblems.length} 件検出されています：\n` + 
        criticalProblems.map(c => `・ ${c.title}`).join('\n') + 
        `\n本当にこのまま転送をすすめますか？`;
    }

    const confirmMsg = `Studuino:bit へプログラムを転送しますか？\n\n【注意事項】:\n・書き込み中、絶対にUSBケーブルを抜かないでください。\n・書き込むと、ボード内の以前の main.py は自動的に更新されます。${safetyAdvice}`;
    
    if (window.confirm(confirmMsg)) {
      addLog('転送リクエストを確認しました。コンパイル・配置ルーチン開始...', 'info');
      const completed = await serialManager.transferCode(pythonCode);
      if (completed) {
        addLog('ボードへの転送プロセスが100%完了しました！', 'success');
      } else {
        addLog('転送中にエラーが発生しました。USB接続および安全な診断状況をご確認ください。', 'error');
      }
    } else {
      addLog('ボードへの転送プロセスを中止しました。', 'info');
    }
  };

  // Save project file payload download
  const saveProjectFile = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify({
          projectName,
          pythonCode,
          blocks,
        })
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${projectName.replace(/\s+/g, '_')}.studuino`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addLog(`プロジェクトファイル「${projectName}.studuino」をローカルに保存しました`, 'success');
    } catch (e) {
      addLog('ファイルの保存に書き出しエラーが生じました。', 'error');
    }
  };

  // Load project file upload
  const loadProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload && payload.pythonCode !== undefined) {
          if (payload.pythonCode) setPythonCode(payload.pythonCode);
          if (payload.blocks) setBlocks(payload.blocks);
          if (payload.projectName) setProjectName(payload.projectName);
          addLog(`プロジェクト「${payload.projectName || 'インポート'}」を正常に読み込みました！`, 'success');
        }
      } catch (err) {
        addLog('対応外のファイルまたは破損したフォーマットです。', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value so loading same file again works
    e.target.value = '';
  };

  // Triggers when Block editor generates python
  const handleBlockPythonGenerated = (newPython: string) => {
    // Only overwrite python if currently in blocks mode to prevent cyclic writing
    if (activeTab === 'blocks') {
      setPythonCode(newPython);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 pb-12">
      
      {/* Top Header Panel */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Project Title */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-sm font-black bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 outline-none px-0.5 py-0.5 text-zinc-800 dark:text-zinc-100 font-sans tracking-tight focus:ring-0 max-w-[180px] sm:max-w-xs"
                  placeholder="プロジェクト名"
                />
                
                {/* Auto-save indicator */}
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-sans font-medium">
                  {saveStatus === 'saving' && (
                    <span className="text-zinc-400">編集中...</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      自動保存完了
                    </span>
                  )}
                  {saveStatus === 'idle' && (
                    <span>オートセーブ有効</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action bar and Theme switches */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Guide Tour */}
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-all border border-indigo-100/50 dark:border-indigo-950/50"
              title="チュートリアルガイドを開始する"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">チュートリアル</span>
            </button>

            {/* Load project file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-xs"
              title="ファイルを読み込む"
            >
              <Upload className="w-4 h-4" />
              <span>開く</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={loadProjectFile}
              accept=".studuino"
              className="hidden"
            />

            {/* Save project locally */}
            <button
              onClick={saveProjectFile}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-xs"
              title="プログラムファイル(.studuino)として保存"
            >
              <Download className="w-4 h-4" />
              <span>保存</span>
            </button>

            {/* Dark & Light switches */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shadow-xs"
              title={isDarkMode ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 mt-6 flex flex-col gap-6">
        
        {/* Workspace Dual-tab Toggler */}
        <div className="flex bg-zinc-200/65 dark:bg-zinc-900 rounded-2xl p-1.5 self-start shadow-xs">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'blocks'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>ブロックでつくる</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'python'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Pythonで記述</span>
          </button>
        </div>

        {/* Tab display workspaces */}
        <div className="min-h-[400px]">
          {activeTab === 'blocks' ? (
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              onPythonGenerated={handleBlockPythonGenerated}
            />
          ) : (
            <CodeEditor
              value={pythonCode}
              onChange={setPythonCode}
              onTransferRequest={handleTransferRequest}
            />
          )}
        </div>

        {/* Console and connection logs bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <SerialConsole
              logs={logs}
              onClearLogs={() => setLogs([])}
              isConnected={isConnected}
              isSimulating={isSimulating}
              onConnectToggle={handleConnectToggle}
            />
          </div>
        </div>

        {/* Sensors output dashboard monitoring section */}
        <section className="mt-4">
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight uppercase">
                Studuino:bit ボード状態の動作チェック＆モニター
              </h2>
            </div>
            
            <MonitorPanel
              sensors={sensors}
              isSimulated={isSimulating}
              onInjectMonitor={handleInjectMonitor}
            />
          </div>
        </section>

      </main>

      {/* Tutorial Modal Wizard walkthrough */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
