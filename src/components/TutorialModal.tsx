import React from 'react';
import { TutorialStep } from '../types/studuino';
import { ChevronRight, ChevronLeft, Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Studuino:bit IDE へようこそ！',
    description: 'この環境は、教育用ロボットボード「Studuino:bit」（スタディーノ・ビット）のプログラム作成、コンパイル、USB転送、リアルタイム稼働モニターをブラウザ上からすべて行える、最新型のWebエディタです。まずは1分でわかる機能ツアーを始めましょう！',
    placement: 'center',
  },
  {
    title: '① ビジュアル・ブロックパレット',
    description: '左側のエリア（カラフルなパネル）をクリックするだけで、ビジュアルプログラミングとしてのブロックをワークスペースに登録できます。LED表示、ブザー音、時間ウェイト、各種端子出力などの便利なブロックを用意しています。',
    targetId: 'tutorial-block-palette',
    placement: 'right',
  },
  {
    title: '② ワークスペース',
    description: 'パレットから登録したブロックは、ここで編集と順序並べ替え（上へ移動・下へ移動）が可能です。また、ブロックを組み立てると、対応する綺麗なPythonコード（MicroPython）が即座に同期・自動生成されます。',
    targetId: 'tutorial-workspace',
    placement: 'left',
  },
  {
    title: '③ Pythonテキストエディタ',
    description: '「Pythonタブ」に切り替える（またはエディタエリアで）ことで、直接Pythonプログラミングを英字記述できます。高度な条件分岐や複雑なデバイス処理、サンプルテンプレートの読み込みも数クリックで可能です！',
    targetId: 'tutorial-editor',
    placement: 'top',
  },
  {
    title: '④ 安全診断スキャナー',
    description: 'MicroPythonでは、「無限ループの中にtime.sleep等の待機時間を入れない」などのミスがあるとマイコンボードがフリーズ（接続切断）する可能性があります。このスキャナーは記述コードをリアルタイムで自動検査し、壊れる・固まる要因となる危険な記述箇所を見つけて警告・改善案を提示します。',
    targetId: 'tutorial-safety-panel',
    placement: 'left',
  },
  {
    title: '⑤ リアルタイム動作チェッカー',
    description: '右側にはセンサーモニターを搭載。温度、明るさ、ボタンA/Bの物理押下や、方位コンパス・加速度による3D傾き表現まで再現できます。シミュレート調整バーのスライダーを動かせば、実機がない状態でも条件分岐テストを進められます！',
    targetId: 'tutorial-simulator-tweak',
    placement: 'top',
  },
  {
    title: '⑥ USBシリアル接続＆ボード転送',
    description: '最後は実機にプログラムを保存！Web Serial APIを利用してUSBからStuduino:bitとワンクリック通信。転送前に最終確認を行うことで、誤書き込みを防いで安全にマイコンを動作させます。iframe経由でシリアルが防がれた時は「新規タブで開く」を使って開いてください。',
    targetId: 'tutorial-serial',
    placement: 'bottom',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Try to scroll the target element into view if it exists
      const targetId = STEPS[currentStep + 1].targetId;
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const targetId = STEPS[currentStep - 1].targetId;
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-hidden flex flex-col gap-4 text-zinc-800 dark:text-zinc-200"
      >
        {/* Background glow styling */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            ツアーガイド ({currentStep + 1} / {STEPS.length})
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-500 transition-colors"
            title="ツアーを閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="min-h-[140px] flex flex-col gap-2 py-2">
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            {step.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal mt-1.5">
            {step.description}
          </p>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-transparent">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-600 disabled:opacity-30 flex items-center gap-1 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-lg disabled:hover:bg-zinc-100 disabled:hover:text-zinc-500"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>前へ</span>
          </button>

          {/* Indicators dots */}
          <div className="flex items-center gap-1.5 hidden sm:flex">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx ? 'bg-indigo-500 px-1.5' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-indigo-600/30"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <span>ツアー完了</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>次へ</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
export default TutorialModal;
