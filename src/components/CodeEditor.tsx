import React from 'react';
import { scanPythonCode } from '../utils/safetyScanner';
import { SafetyWarning } from '../types/studuino';
import { Play, Copy, AlertTriangle, ShieldCheck, RefreshCw, FileCode, Check, Zap, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  onTransferRequest: () => void;
}

const TEMPLATES = [
  {
    name: 'LEDアニメーション繰り返し',
    code: `from pystubit.board import *
import time

print("LED Animation starting...")

while True:
    display.show(Image.HAPPY)
    time.sleep_ms(500)
    display.show(Image.SAD)
    time.sleep_ms(500)
`
  },
  {
    name: '光度変化によるブザー連動',
    code: `from pystubit.board import *
import time

print("Light and Buzzer system active")

while True:
    bright = lightsensor.get_value()
    print("Brightness:", bright)
    
    if bright < 1000:
        # 暗くなったらピピッ! と鳴らす
        buzzer.on('C4', duration=100)
        time.sleep_ms(200)
    else:
        buzzer.off()
        time.sleep_ms(500)
`
  },
  {
    name: '傾き（加速度）センサー探知',
    code: `from pystubit.board import *
import time

print("Accelerometer active")

while True:
    x, y, z = accelerometer.get_values()
    print("Accel values (X, Y, Z):", x, y, z)
    
    if abs(x) > 3.0:
        # 傾きが大きい時に怒った顔
        display.show(Image.ANGRY)
    else:
        display.show(Image.SMILE)
        
    time.sleep_ms(150)
`
  },
  {
    name: '２つのピンの入出力制御',
    code: `from pystubit.board import *
import time

p0 = StuduinoBitTerminal('P0')  # デジタル出力端子
p1 = StuduinoBitTerminal('P1')  # アナログ入力端子

print("P0 and P1 controller start")

while True:
    # 端子P1から電圧強度(0-4095)を読み込む
    analog_val = p1.read_analog()
    print("P1 value is:", analog_val)
    
    if analog_val > 2000:
        # 電圧が閾値を超えたらP0端子にHIGH(3.3V)出力
        p0.write_digital(1)
    else:
        p0.write_digital(0)
        
    time.sleep_ms(100)
`
  }
];

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onTransferRequest }) => {
  const [warnings, setWarnings] = React.useState<SafetyWarning[]>([]);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const scanResults = scanPythonCode(value);
    setWarnings(scanResults);
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadTemplate = (code: string) => {
    if (window.confirm('エディタのコードを上書きしますか？')) {
      onChange(code);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[450px]">
        
        {/* Python Input Column (Left) */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs relative" id="tutorial-editor">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              main.py (Pythonエディタ)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors"
                title="コードをクリップボードにコピー"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>コピー完了!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>コピー</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onTransferRequest}
                className="text-xs flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                title="ボードに書き込む"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>ボード転送</span>
              </button>
            </div>
          </div>

          {/* Text Area Code block */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border-none outline-none resize-none focus:ring-1 focus:ring-emerald-500 overflow-y-auto leading-relaxed"
            placeholder="# ここにPython(MicroPython)コードを記述してください"
            spellCheck={false}
          />

          {/* Line count panel */}
          <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono text-right">
            Lines: {value.split('\n').length} | Size: {new Blob([value]).size} bytes
          </div>
        </div>

        {/* Snippets / Quick help panel (Right) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Safety scan diagnostics */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col shadow-xs" id="tutorial-safety-panel">
            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              ソースコード安全診断
            </h4>

            {warnings.length === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 flex gap-2.5 items-start text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">問題は検出されませんでした</p>
                  <p className="text-[11px] opacity-90 mt-0.5 font-normal leading-relaxed">
                    無限ループ待機状態、ピン入出力競合、危険なブザー等について、安全なコード表記になっています。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {warnings.map((warn) => (
                  <div
                    key={warn.id}
                    className={`border rounded-xl p-3 flex gap-2.5 items-start text-xs leading-relaxed ${
                      warn.severity === 'critical'
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warn.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                        <span>[{warn.severity === 'critical' ? '重大警告' : '注意'}]</span>
                        {warn.title}
                      </p>
                      <p className="text-[11px] opacity-95 my-1">{warn.message}</p>
                      
                      <div className="mt-1.5 text-[11px]">
                        <span className="font-semibold block text-zinc-900 dark:text-zinc-100">おすすめ改善案:</span>
                        <p className="dark:text-zinc-300">{warn.suggestion}</p>
                      </div>

                      {warn.codeSnippet && (
                        <pre className="mt-2 text-[10px] font-mono p-1.5 bg-zinc-900 text-zinc-200 rounded overflow-x-auto select-all">
                          {warn.codeSnippet}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick template snippets */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col flex-1 shadow-xs" id="tutorial-templates">
            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              かんたん動作テンプレート
            </h4>
            
            <div className="space-y-2 overflow-y-auto max-h-[180px] lg:max-h-[220px] pr-1 scrollbar-thin">
              {TEMPLATES.map((item, index) => (
                <button
                  key={index}
                  onClick={() => loadTemplate(item.code)}
                  className="w-full text-left p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all flex items-center justify-between gap-2 grup text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <span className="truncate">{item.name}</span>
                  <Play className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
