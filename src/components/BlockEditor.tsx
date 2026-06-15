import React from 'react';
import { BlockData, BlockType } from '../types/studuino';
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlockEditorProps {
  blocks: BlockData[];
  onChange: (newBlocks: BlockData[]) => void;
  onPythonGenerated: (pythonCode: string) => void;
}

const BLOCK_COLORS: Record<BlockType, string> = {
  start: 'bg-indigo-600 dark:bg-indigo-700 text-white border-indigo-700',
  loop_forever: 'bg-amber-500 dark:bg-amber-600 text-white border-amber-600',
  led_set_pixel: 'bg-pink-500 dark:bg-pink-600 text-white border-pink-600',
  led_clear: 'bg-rose-500 dark:bg-rose-600 text-white border-rose-600',
  led_show_builtin: 'bg-purple-600 dark:bg-purple-700 text-white border-purple-700',
  led_show_text: 'bg-violet-500 dark:bg-violet-600 text-white border-violet-600',
  buzzer_on: 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600',
  buzzer_off: 'bg-teal-500 dark:bg-teal-600 text-white border-teal-600',
  delay_ms: 'bg-cyan-500 dark:bg-cyan-600 text-white border-cyan-600',
  if_button_pressed: 'bg-orange-500 dark:bg-orange-600 text-white border-orange-600',
  terminal_write: 'bg-blue-500 dark:bg-blue-600 text-white border-blue-600',
  terminal_read: 'bg-sky-500 dark:bg-sky-600 text-white border-sky-600',
};

const BLOCK_NAMES: Record<BlockType, string> = {
  start: '初期セットアップ',
  loop_forever: '無限ループ (ずっと繰り返す)',
  led_set_pixel: 'LED点灯 (X, Y座標色設定)',
  led_clear: 'LED全消灯 (画面クリア)',
  led_show_builtin: '内蔵表情を表示する',
  led_show_text: 'スクロールテキスト表示',
  buzzer_on: 'ブザーを鳴らす (音階と時間)',
  buzzer_off: 'ブザーを止める',
  delay_ms: '一時待機 (ミリ秒)',
  if_button_pressed: 'もしボタンが押されたら',
  terminal_write: '端子へデジタル出力する',
  terminal_read: '端子からアナログ値を読込',
};

const BUILTIN_IMAGES = [
  'HAPPY', 'SAD', 'ANGRY', 'SMILE', 'CONFUSED', 'ASLEEP', 'SURPRISED',
  'SILLY', 'FABULOUS', 'MEH', 'YES', 'NO', 'CLOCK12', 'XMAS', 'PACMAN'
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, onPythonGenerated }) => {
  
  // Re-generate python code whenever blocks change
  React.useEffect(() => {
    const generated = generatePythonFromBlocks(blocks);
    onPythonGenerated(generated);
  }, [blocks]);

  const addBlock = (type: BlockType) => {
    let defaultParams: any = {};
    
    switch (type) {
      case 'led_set_pixel':
        defaultParams = { x: 2, y: 2, color: '0xff0000' };
        break;
      case 'led_show_builtin':
        defaultParams = { imageName: 'HAPPY' };
        break;
      case 'led_show_text':
        defaultParams = { text: 'HELLO' };
        break;
      case 'buzzer_on':
        defaultParams = { tone: 'C4', duration: 1000 };
        break;
      case 'delay_ms':
        defaultParams = { duration: 500 };
        break;
      case 'if_button_pressed':
        defaultParams = { button: 'A' };
        break;
      case 'terminal_write':
        defaultParams = { pin: 'P0', pinValue: 1 };
        break;
      case 'terminal_read':
        defaultParams = { pin: 'P0' };
        break;
    }

    const newBlock: BlockData = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      params: defaultParams,
    };
    
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[swapWithIndex];
    newBlocks[swapWithIndex] = temp;

    onChange(newBlocks);
  };

  const updateParams = (id: string, params: any) => {
    onChange(
      blocks.map((b) => {
        if (b.id === id) {
          return { ...b, params: { ...b.params, ...params } };
        }
        return b;
      })
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Block Palette (Left) */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col shadow-xs" id="tutorial-block-palette">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          ブロックパレット (クリックして追加)
        </h3>
        
        <div className="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[500px] space-y-2 pr-1 scrollbar-thin">
          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1 mb-1">
            基本・構造
          </div>
          <button
            onClick={() => addBlock('start')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.start}`}
          >
            <span>{BLOCK_NAMES.start}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => addBlock('loop_forever')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.loop_forever}`}
          >
            <span>{BLOCK_NAMES.loop_forever}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('delay_ms')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.delay_ms}`}
          >
            <span>{BLOCK_NAMES.delay_ms}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pt-3 mb-1">
            5x5 LED ディスプレイ
          </div>
          
          <button
            onClick={() => addBlock('led_set_pixel')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.led_set_pixel}`}
          >
            <span>{BLOCK_NAMES.led_set_pixel}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('led_show_builtin')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.led_show_builtin}`}
          >
            <span>{BLOCK_NAMES.led_show_builtin}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('led_show_text')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.led_show_text}`}
          >
            <span>{BLOCK_NAMES.led_show_text}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('led_clear')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.led_clear}`}
          >
            <span>{BLOCK_NAMES.led_clear}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pt-3 mb-1">
            電子ブザー
          </div>

          <button
            onClick={() => addBlock('buzzer_on')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.buzzer_on}`}
          >
            <span>{BLOCK_NAMES.buzzer_on}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('buzzer_off')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.buzzer_off}`}
          >
            <span>{BLOCK_NAMES.buzzer_off}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pt-3 mb-1">
            イベント・入出力端子
          </div>

          <button
            onClick={() => addBlock('if_button_pressed')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.if_button_pressed}`}
          >
            <span>{BLOCK_NAMES.if_button_pressed}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('terminal_write')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.terminal_write}`}
          >
            <span>{BLOCK_NAMES.terminal_write}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addBlock('terminal_read')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium border-l-4 transition-all hover:scale-[1.02] flex items-center justify-between ${BLOCK_COLORS.terminal_read}`}
          >
            <span>{BLOCK_NAMES.terminal_read}</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Canvas (Right) */}
      <div className="lg:col-span-7 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col h-[400px] lg:h-[550px] overflow-hidden shadow-xs relative" id="tutorial-workspace">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4 bg-transparent">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            ワークスペース ({blocks.length}個のブロック)
          </h3>
          {blocks.length === 0 && (
            <span className="text-xs text-zinc-500">
              パレットからブロックを追加しよう
            </span>
          )}
        </div>

        {/* List of active blocks */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 gap-2 p-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Code className="w-10 h-10 stroke-1" />
              <p className="text-sm font-medium">配置されているブロックがありません</p>
              <p className="text-xs max-w-xs leading-relaxed">左側のパレットにあるカラフルなブロックをクリックして、ボード動作のプログラムを組み立てましょう！</p>
            </div>
          ) : (
            <AnimatePresence>
              {blocks.map((block, idx) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-xl shadow-xs border-l-[6px] border ${BLOCK_COLORS[block.type]} border-zinc-200 dark:border-zinc-800 text-zinc-900 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3`}
                >
                  {/* Block Left: Title & inputs */}
                  <div className="flex flex-col gap-2 flex-grow">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 uppercase">
                      {BLOCK_NAMES[block.type]}
                    </span>

                    {/* Render parameters based on block type */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {block.type === 'led_set_pixel' && (
                        <>
                          <span className="text-zinc-500">座標:</span>
                          <span className="text-zinc-400">X:</span>
                          <select
                            value={block.params.x ?? 0}
                            onChange={(e) => updateParams(block.id, { x: parseInt(e.target.value, 10) })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            {[0, 1, 2, 3, 4].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <span className="text-zinc-400">Y:</span>
                          <select
                            value={block.params.y ?? 0}
                            onChange={(e) => updateParams(block.id, { y: parseInt(e.target.value, 10) })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            {[0, 1, 2, 3, 4].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <span className="text-zinc-500 ml-1">色:</span>
                          <select
                            value={block.params.color ?? '0xff0000'}
                            onChange={(e) => updateParams(block.id, { color: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            <option value="0xff0000">赤 (Red)</option>
                            <option value="0x00ff00">緑 (Green)</option>
                            <option value="0x0000ff">青 (Blue)</option>
                            <option value="0xffff00">黄 (Yellow)</option>
                            <option value="0xff5500">オレンジ</option>
                            <option value="0xff00ff">マゼンタ</option>
                            <option value="0xffffff">白 (White)</option>
                          </select>
                        </>
                      )}

                      {block.type === 'led_show_builtin' && (
                        <>
                          <span className="text-zinc-500">表情パターン:</span>
                          <select
                            value={block.params.imageName ?? 'HAPPY'}
                            onChange={(e) => updateParams(block.id, { imageName: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            {BUILTIN_IMAGES.map((img) => (
                              <option key={img} value={img}>{img}</option>
                            ))}
                          </select>
                        </>
                      )}

                      {block.type === 'led_show_text' && (
                        <>
                          <span className="text-zinc-500">文字:</span>
                          <input
                            type="text"
                            maxLength={15}
                            value={block.params.text ?? ''}
                            onChange={(e) => updateParams(block.id, { text: e.target.value.toUpperCase() })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-2 py-0.5 w-24 border border-zinc-200 dark:border-zinc-700 outline-none font-mono"
                          />
                        </>
                      )}

                      {block.type === 'buzzer_on' && (
                        <>
                          <span className="text-zinc-500">音名:</span>
                          <select
                            value={block.params.tone ?? 'C4'}
                            onChange={(e) => updateParams(block.id, { tone: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none font-mono"
                          >
                            {['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <span className="text-zinc-500 ml-1">時間(ミリ秒):</span>
                          <input
                            type="number"
                            min={50}
                            max={5000}
                            step={50}
                            value={block.params.duration ?? 1000}
                            onChange={(e) => updateParams(block.id, { duration: Math.max(50, parseInt(e.target.value, 10) || 100) })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 w-16 border border-zinc-200 dark:border-zinc-700 outline-none font-mono"
                          />
                        </>
                      )}

                      {block.type === 'delay_ms' && (
                        <>
                          <span className="text-zinc-500">時間(ミリ秒):</span>
                          <input
                            type="number"
                            min={10}
                            max={10000}
                            step={50}
                            value={block.params.duration ?? 500}
                            onChange={(e) => updateParams(block.id, { duration: Math.max(10, parseInt(e.target.value, 10) || 50) })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 w-20 border border-zinc-200 dark:border-zinc-700 outline-none font-mono"
                          />
                        </>
                      )}

                      {block.type === 'if_button_pressed' && (
                        <>
                          <span className="text-zinc-500">ボタン種類:</span>
                          <select
                            value={block.params.button ?? 'A'}
                            onChange={(e) => updateParams(block.id, { button: e.target.value as 'A' | 'B' })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            <option value="A">ボタン A</option>
                            <option value="B">ボタン B</option>
                          </select>
                        </>
                      )}

                      {block.type === 'terminal_write' && (
                        <>
                          <span className="text-zinc-500">端子:</span>
                          <select
                            value={block.params.pin ?? 'P0'}
                            onChange={(e) => updateParams(block.id, { pin: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            {['P0', 'P1', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P19', 'P20'].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <span className="text-zinc-500 ml-1">出力値:</span>
                          <select
                            value={block.params.pinValue ?? 1}
                            onChange={(e) => updateParams(block.id, { pinValue: parseInt(e.target.value, 10) })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            <option value={1}>High (1 / 電圧出力)</option>
                            <option value={0}>Low (0 / オフ)</option>
                          </select>
                        </>
                      )}

                      {block.type === 'terminal_read' && (
                        <>
                          <span className="text-zinc-500">端子:</span>
                          <select
                            value={block.params.pin ?? 'P0'}
                            onChange={(e) => updateParams(block.id, { pin: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 outline-none"
                          >
                            {['P0', 'P1', 'P2', 'P3'].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <span className="text-zinc-400 ml-1">(アナログ電圧 0~4095)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Block Right: Controls (Move down, up, delete) */}
                  <div className="flex items-center gap-1 self-end md:self-center ml-auto">
                    <button
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 rounded border border-zinc-200 dark:border-zinc-800 transition-colors"
                      title="上へ移動"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 rounded border border-zinc-200 dark:border-zinc-800 transition-colors"
                      title="下へ移動"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded border border-zinc-200 dark:border-zinc-800 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

// Compile visual blocks to actual readable Python MicroPython code
export function generatePythonFromBlocks(blocks: BlockData[]): string {
  if (blocks.length === 0) {
    return `# Studuino:bit Python Code\nfrom pystubit.board import *\nimport time\n\n# ワークスペースにブロックを置いてコードを生成してください\n`;
  }

  let codeLines: string[] = [
    '# Automatic code generated by Studuino:bit Visual Block Editor',
    'from pystubit.board import *',
    'import time',
    '',
    '# --- Setup program ---'
  ];

  let loopLines: string[] = [];
  let indent = '    ';

  // Find if we have active 'loop_forever' block
  const hasLoopBlock = blocks.some((b) => b.type === 'loop_forever');

  blocks.forEach((block) => {
    switch (block.type) {
      case 'start':
        codeLines.push('print("Starting Studuino:bit code...")');
        codeLines.push('display.clear()');
        break;

      case 'led_set_pixel':
        const x = block.params.x ?? 2;
        const y = block.params.y ?? 2;
        const color = block.params.color ?? '0xff0000';
        const parsedColor = color.startsWith('0x') ? color : `'${color}'`;
        
        if (hasLoopBlock) {
          loopLines.push(`${indent}display.set_pixel(${x}, ${y}, ${parsedColor})`);
        } else {
          codeLines.push(`display.set_pixel(${x}, ${y}, ${parsedColor})`);
        }
        break;

      case 'led_clear':
        if (hasLoopBlock) {
          loopLines.push(`${indent}display.clear()`);
        } else {
          codeLines.push('display.clear()');
        }
        break;

      case 'led_show_builtin':
        const img = block.params.imageName ?? 'HAPPY';
        if (hasLoopBlock) {
          loopLines.push(`${indent}display.show(Image.${img})`);
        } else {
          codeLines.push(`display.show(Image.${img})`);
        }
        break;

      case 'led_show_text':
        const txt = block.params.text ?? 'HELLO';
        if (hasLoopBlock) {
          loopLines.push(`${indent}display.scroll("${txt}", 100)`);
        } else {
          codeLines.push(`display.scroll("${txt}", 100)`);
        }
        break;

      case 'buzzer_on':
        const tone = block.params.tone ?? 'C4';
        const dur = block.params.duration ?? 1000;
        if (hasLoopBlock) {
          loopLines.push(`${indent}buzzer.on('${tone}', duration=${dur})`);
        } else {
          codeLines.push(`buzzer.on('${tone}', duration=${dur})`);
        }
        break;

      case 'buzzer_off':
        if (hasLoopBlock) {
          loopLines.push(`${indent}buzzer.off()`);
        } else {
          codeLines.push('buzzer.off()');
        }
        break;

      case 'delay_ms':
        const sleepDur = block.params.duration ?? 500;
        if (hasLoopBlock) {
          loopLines.push(`${indent}time.sleep_ms(${sleepDur})`);
        } else {
          codeLines.push(`time.sleep_ms(${sleepDur})`);
        }
        break;

      case 'if_button_pressed':
        const btn = block.params.button ?? 'A';
        const btnObj = btn === 'A' ? 'button_a' : 'button_b';
        if (hasLoopBlock) {
          loopLines.push(`${indent}if ${btnObj}.is_pressed():`);
          loopLines.push(`${indent}    display.show(Image.HAPPY)`);
          loopLines.push(`${indent}    time.sleep_ms(200)`);
        } else {
          codeLines.push(`if ${btnObj}.is_pressed():`);
          codeLines.push(`    display.show(Image.HAPPY)`);
        }
        break;

      case 'terminal_write':
        const pin = block.params.pin ?? 'P0';
        const val = block.params.pinValue ?? 1;
        const pinVarName = pin.toLowerCase();
        
        // Define pin initialization if not done yet
        if (!codeLines.some(line => line.includes(`StuduinoBitTerminal('${pin}')`))) {
          codeLines.splice(4, 0, `${pinVarName} = StuduinoBitTerminal('${pin}')`);
        }

        if (hasLoopBlock) {
          loopLines.push(`${indent}${pinVarName}.write_digital(${val})`);
        } else {
          codeLines.push(`${pinVarName}.write_digital(${val})`);
        }
        break;

      case 'terminal_read':
        const rPin = block.params.pin ?? 'P0';
        const rPinVarName = rPin.toLowerCase();

        // Define pin initialization if not done yet
        if (!codeLines.some(line => line.includes(`StuduinoBitTerminal('${rPin}')`))) {
          codeLines.splice(4, 0, `${rPinVarName} = StuduinoBitTerminal('${rPin}')`);
        }

        if (hasLoopBlock) {
          loopLines.push(`${indent}val = ${rPinVarName}.read_analog()`);
          loopLines.push(`${indent}print("Analog value at ${rPin}:", val)`);
        } else {
          codeLines.push(`val = ${rPinVarName}.read_analog()`);
          codeLines.push(`print("Analog value at ${rPin}:", val)`);
        }
        break;
    }
  });

  // Append loop logic at the very end
  if (hasLoopBlock) {
    codeLines.push('');
    codeLines.push('# --- Loop program ---');
    codeLines.push('while True:');
    if (loopLines.length === 0) {
      codeLines.push(`${indent}time.sleep_ms(50)  # Empty loop safety sleep`);
    } else {
      // Append generated loops
      codeLines.push(...loopLines);
      // Ensure there is at least one sleep in the while True loop to satisfy scanner
      if (!loopLines.some(line => line.includes('sleep'))) {
        codeLines.push(`${indent}time.sleep_ms(50)  # Safe CPU cooling sleep`);
      }
    }
  }

  return codeLines.join('\n');
}
