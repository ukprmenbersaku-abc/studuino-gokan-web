import React from 'react';
import { SensorData } from '../types/studuino';
import serialManager from '../utils/serialManager';
import { Sun, Thermometer, Compass, RotateCw, Sparkles, Sliders, Play, ToggleLeft, Activity, AppWindow } from 'lucide-react';

interface MonitorPanelProps {
  sensors: SensorData;
  isSimulated: boolean;
  onInjectMonitor?: () => void;
}

export const MonitorPanel: React.FC<MonitorPanelProps> = ({ sensors, isSimulated, onInjectMonitor }) => {
  const [ledGrid, setLedGrid] = React.useState<number[][]>([
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ]);

  const togglePixel = (r: number, c: number) => {
    const newGrid = ledGrid.map((rowArr, ri) =>
      rowArr.map((val, ci) => (ri === r && ci === c ? (val === 1 ? 0 : 1) : val))
    );
    setLedGrid(newGrid);
  };

  // Generate python binary image code representation of grid, e.g. '01010:11111:...' (Page 11 formatting)
  const getGridPythonCode = () => {
    const lines = ledGrid.map((row) => row.join('')).join(':') + ':';
    return `img = StuduinoBitImage('${lines}')\ndisplay.show(img)`;
  };

  const handleCopyGridCode = () => {
    navigator.clipboard.writeText(getGridPythonCode());
    alert('5x5 LEDマトリックスのPythonイメージコードをお使いのクリップボードにコピーしました！\n\n' + getGridPythonCode());
  };

  const handleSimButtonTrigger = (btn: 'A' | 'B', isPressed: boolean) => {
    if (isSimulated) {
      serialManager.triggerSimulatedButton(btn, isPressed);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Real device active alert */}
      {!isSimulated && onInjectMonitor && (
        <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">実機（USBシリアル）が接続されています！</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-normal">
                Studuino:bitの実機に組み込まれている温度、明るさ、ボタン、加速度センサーなどの出力をリアルタイムに読み取り、画面に表示するには、下のボタンから監視用プログラムをロードしてください。
              </p>
            </div>
          </div>
          <button
            onClick={onInjectMonitor}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 font-bold py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs shadow-md shadow-emerald-500/15 transition-all self-start sm:self-center uppercase"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>実機センサーの監視を開始する</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        
        {/* 5x5 LED Designer & Display Monitor (Column 1) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col shadow-xs" id="tutorial-led-designer">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2.5 flex items-center gap-2">
            <AppWindow className="w-4 h-4 text-pink-500" />
            5x5 LED ディスプレイ設計器
          </h3>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-4 leading-relaxed font-normal">
            グリッドをクリックしてオリジナルの表情やアイコンのパターンをドットペイント、ボードへ渡す用のイメージ文字列をコード出力できます。
          </p>

        {/* 5x5 Grid representation */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
          <div className="grid grid-cols-5 gap-2.5 p-3.5 bg-zinc-800 rounded-2xl shadow-md border-2 border-zinc-700/80">
            {ledGrid.map((row, ri) =>
              row.map((val, ci) => (
                <button
                  key={`${ri}-${ci}`}
                  onClick={() => togglePixel(ri, ci)}
                  className={`w-7 h-7 rounded-sm transition-all outline-none duration-150 transform active:scale-90 ${
                    val === 1
                      ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-105 border-red-400'
                      : 'bg-zinc-700 hover:bg-zinc-600 border-zinc-600'
                  } border`}
                  title={`LED座標 X:${ci}, Y:${ri}`}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full px-4">
            <button
              onClick={handleCopyGridCode}
              className="w-full text-center py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-xs font-bold transition-all"
            >
              イメージ定義をコードコピー
            </button>
            <button
              onClick={() => setLedGrid(Array(5).fill(0).map(() => Array(5).fill(0)))}
              className="text-center text-[11px] text-zinc-400 hover:text-zinc-500 font-medium py-1 transition-colors"
            >
              リセットしてクリア
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Dashboard Values (Column 2) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col shadow-xs" id="tutorial-dashboard">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          リアルタイム・センサーモニター
        </h3>

        <div className="space-y-4 flex-grow flex flex-col justify-between">
          {/* Temperature sensor */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Thermometer className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                温度センサー / get_celsius()
              </span>
              <span className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-100 block">
                {sensors.temperature.toFixed(1)} ℃
              </span>
              <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, ((sensors.temperature - 10) / 35) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Light Ambient sensor */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sun className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                明るさ光センサー / lightsensor
              </span>
              <span className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-100 block">
                {sensors.light} / 4095
              </span>
              <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${(sensors.light / 4095) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Simulated buttons control / Button status monitoring */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block mb-2">
              本体ボタン状態 / StuduinoBitButton
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Button A */}
              <div
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  sensors.buttonA
                    ? 'bg-indigo-500 border-indigo-400 text-white font-bold shadow-sm scale-95'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
                onMouseDown={() => handleSimButtonTrigger('A', true)}
                onMouseUp={() => handleSimButtonTrigger('A', false)}
                onTouchStart={(e) => { e.preventDefault(); handleSimButtonTrigger('A', true); }}
                onTouchEnd={(e) => { e.preventDefault(); handleSimButtonTrigger('A', false); }}
              >
                <p className="text-[10px] opacity-75">ボタン A</p>
                <p className="text-xs font-bold font-mono">{sensors.buttonA ? '押下中' : '解放中'}</p>
                {isSimulated && <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">押したままにする</p>}
              </div>

              {/* Button B */}
              <div
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  sensors.buttonB
                    ? 'bg-indigo-500 border-indigo-400 text-white font-bold shadow-sm scale-95'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
                onMouseDown={() => handleSimButtonTrigger('B', true)}
                onMouseUp={() => handleSimButtonTrigger('B', false)}
                onTouchStart={(e) => { e.preventDefault(); handleSimButtonTrigger('B', true); }}
                onTouchEnd={(e) => { e.preventDefault(); handleSimButtonTrigger('B', false); }}
              >
                <p className="text-[10px] opacity-75">ボタン B</p>
                <p className="text-xs font-bold font-mono">{sensors.buttonB ? '押下中' : '解放中'}</p>
                {isSimulated && <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">押したままにする</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Axis & Rotation / Angles (Column 3) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col shadow-xs" id="tutorial-simulator">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
          9軸ジャイロ ＆ 方角コンパス
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-4 font-normal">
          センサー方位や基板の傾き（重力加速度）を視覚的に連動します。
        </p>

        <div className="flex-grow flex flex-col justify-between space-y-4">
          
          {/* Compass rose rotation */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center relative">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 absolute top-2 left-3">
              方位センサー / heading()
            </span>
            <div className="relative w-24 h-24 mt-2">
              <div
                className="w-full h-full border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${sensors.compassHeading}deg)` }}
              >
                {/* Pointer Rose */}
                <div className="w-1.5 h-12 bg-red-500 absolute top-0 rounded-t-full" />
                <div className="w-1.5 h-12 bg-zinc-400 dark:bg-zinc-700 absolute bottom-0 rounded-b-full" />
                <span className="text-[10px] font-bold text-red-500 absolute top-1 font-sans">N</span>
                <span className="text-[10px] font-bold text-zinc-500 absolute bottom-1 font-sans">S</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-zinc-800 dark:text-zinc-200 bg-white/40 dark:bg-black/50 w-12 h-12 m-auto rounded-full shadow-xs border border-zinc-200 dark:border-zinc-800">
                {Math.floor(sensors.compassHeading)}°
              </div>
            </div>
          </div>

          {/* 3D tilt visualization card */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden flex flex-col justify-center min-h-[110px]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 absolute top-2 left-3">
              加速度センサー / x, y, z
            </span>
            <div className="perspective-500 flex items-center justify-center mt-3">
              {/* Virtual micro-board that tilts */}
              <div
                className="w-28 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-400 border-b-4 flex items-center justify-center shadow-lg transform transition-transform"
                style={{
                  transform: `rotateX(${(sensors.accelY / 9.8) * 35}deg) rotateY(${(sensors.accelX / 9.8) * 35}deg)`
                }}
              >
                <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full border border-zinc-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                </div>
                <div className="text-[8px] font-bold text-emerald-200 select-none ml-2 uppercase tracking-tight">Studuino</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mt-4 text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-mono">
              <div>X: <span className="text-zinc-800 dark:text-zinc-200 mt-0.5 block font-bold">{sensors.accelX.toFixed(2)}</span></div>
              <div>Y: <span className="text-zinc-800 dark:text-zinc-200 mt-0.5 block font-bold">{sensors.accelY.toFixed(2)}</span></div>
              <div>Z: <span className="text-zinc-800 dark:text-zinc-200 mt-0.5 block font-bold">{sensors.accelZ.toFixed(2)}</span></div>
            </div>
          </div>

        </div>
      </div>

      {/* Simulator Inputs Drawer (Collapsible bottom controls ONLY shown in Simulating Mode) */}
      {isSimulated && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border-2 border-indigo-100 dark:border-indigo-950/40 rounded-2xl p-4 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="tutorial-simulator-tweak">
          <div className="flex items-start gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">シミュレータ調整バー</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-normal">
                実機が手元になくても、以下のスライダーを動かして温度や照度の擬似検知値を変更し、作成したPythonコードの判定や動きを再現・評価できます。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow max-w-xl text-xs">
            {/* Temp slider */}
            <div className="flex flex-col gap-1.5 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between font-mono font-bold text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>温度(℃)</span>
                <span>{sensors.temperature.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                value={sensors.temperature}
                onChange={(e) => serialManager.updateSimulatedSensor('temperature', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
              />
            </div>

            {/* Light slider */}
            <div className="flex flex-col gap-1.5 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between font-mono font-bold text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>照度(0-4095)</span>
                <span>{sensors.light}</span>
              </div>
              <input
                type="range"
                min={0}
                max={4095}
                value={sensors.light}
                onChange={(e) => serialManager.updateSimulatedSensor('light', parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
              />
            </div>

            {/* Compass Heading slider */}
            <div className="flex flex-col gap-1.5 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between font-mono font-bold text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>方位角(0-360)</span>
                <span>{Math.floor(sensors.compassHeading)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={sensors.compassHeading}
                onChange={(e) => serialManager.updateSimulatedSensor('compassHeading', parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
