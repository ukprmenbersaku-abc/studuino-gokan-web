import { SafetyWarning } from '../types/studuino';

export function scanPythonCode(code: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  if (!code || code.trim() === '') return warnings;

  // 1. Infinite loop check without delay
  // Looks for while True: or while 1: and checks if there's any sleep or delay
  const loopRegex = /while\s+(True|1|\(\s*True\s*\)|\(\s*1\s*\))\s*:/g;
  let matches;
  let hasInfiniteLoop = false;
  
  while ((matches = loopRegex.exec(code)) !== null) {
    hasInfiniteLoop = true;
    break;
  }

  if (hasInfiniteLoop) {
    // Find if "sleep" or "sleep_ms" or "sleep_us" is present in the code
    const hasSleep = /time\.sleep|sleep_ms|sleep_us|sleep\s*\(/g.test(code);
    if (!hasSleep) {
      warnings.push({
        id: 'no-sleep-loop',
        severity: 'critical',
        title: 'CPU高負荷の警告（無限ループ内の待機なし）',
        message: 'while True: ループ内に待機処理（time.sleep や sleep_ms）が見つかりません。このままプログラムを転送すると、マイコンがリバウンドしてCPUが100%になり、フリーズして接続や再書き込みが困難になる危険性があります。',
        suggestion: 'ループの中に time.sleep_ms(100) や time.sleep(0.1) などの短い待機コードを追加してください。',
        codeSnippet: 'while True:\n    # 処理を記述\n    time.sleep_ms(50) # 待機時間を追加する！'
      });
    }
  }

  // 2. Output on P2 or P3 (AnalogDigitalPin write explanation on page 20/25/29)
  // "p2,p3 はデジタル出力ができません。write_digitalメソッドを実行するとエラーになります"
  const p2p3WriteRegex = /StuduinoBitTerminal\s*\(\s*['"`](P2|P3)['"`]\s*\)/i;
  const writeDigitalRegex = /\.write_digital\s*\(/i;

  if (p2p3WriteRegex.test(code) && writeDigitalRegex.test(code)) {
    warnings.push({
      id: 'p2-p3-digital-write',
      severity: 'critical',
      title: 'P2 / P3 デジタル出力エラーの警告',
      message: '端子 P2 および P3 はアナログ入力およびデジタル入力専用です。仕様書に記載がある通り、デジタル出力（write_digital）は実行できません。実行するとエラーでプログラムがクラッシュします。',
      suggestion: 'デジタル出力を行いたい場合は、P0、P1、あるいは P4〜P16、P19、P20 を使用してください。',
      codeSnippet: '# 修正例:\np0 = StuduinoBitTerminal("P0")\np0.write_digital(1)'
    });
  }

  // 3. Pin duplication (pin0~pin3 vs p0~p3)
  // Page 24: "※：pin0とp0、pin1とp1、pin2とp2、pin3とp3の併用はできません。"
  const pin0_3Used = /pin([0-3])/g.test(code);
  const p0_3Used = /p([0-3])\s*=\s*StuduinoBitTerminal/g.test(code);
  if (pin0_3Used && p0_3Used) {
    warnings.push({
      id: 'pin-p-conflict',
      severity: 'warning',
      title: '端子(pinとp)の同時使用エラー',
      message: 'micro:bit互換端子（pin0〜pin3）と標準のStuduino:bit端子（p0〜p3）が同時に使用されています。仕様書により、これらは物理的に同一ピンのため安全に併用できません。',
      suggestion: 'どちらか片方の命名のみに統一してください。（例：StuduinoBitTerminal("P0")に統一する）'
    });
  }

  // 4. Infinite buzzer tone without sleep/turned off
  // Detect buzzer.on without buzzer.off or duration
  const hasBuzzerOn = /\.on\s*\(/i.test(code) && /buzzer/i.test(code);
  const hasBuzzerOff = /\.off\s*\(/i.test(code) && /buzzer/i.test(code);
  const hasBuzzerDuration = /\.on\s*\(.*duration\s*=/i.test(code);
  if (hasBuzzerOn && !hasBuzzerOff && !hasBuzzerDuration) {
    warnings.push({
      id: 'buzzer-infinite-buzz',
      severity: 'warning',
      title: 'ブザー鳴りっぱなしの警告',
      message: 'ブザーを鳴らし始める（buzzer.on()）処理がありますが、停止（buzzer.off()）や duration パラメータの指定が見当たりません。一度起動すると、リセットするか電源を切るまでブザーが鳴り続けてしまいます。',
      suggestion: 'buzzer.on("C4", duration=1000) のように時間を指定するか、鳴らした後に time.sleep() して buzzer.off() を呼ぶようにしてください。',
      codeSnippet: 'buzzer.on("C4")\ntime.sleep(1.0)\nbuzzer.off()'
    });
  }

  // 5. Analog values check (Page 29: write_analog(value) [0-1023])
  const writeAnalogRegexWithVal = /\.write_analog\s*\(\s*(\d+)\s*\)/ig;
  let analogMatch;
  let outOfRangeAnalog = false;
  while ((analogMatch = writeAnalogRegexWithVal.exec(code)) !== null) {
    const val = parseInt(analogMatch[1], 10);
    if (val < 0 || val > 1023) {
      outOfRangeAnalog = true;
      break;
    }
  }

  if (outOfRangeAnalog) {
    warnings.push({
      id: 'analog-out-of-range',
      severity: 'warning',
      title: 'アナログ出力(PWM)値の範囲外エラー',
      message: 'write_analog に指定されている値が 0〜1023 の範囲を超えています。仕様書により、PWM(アナログ出力)の値は 0 (0%) から 1023 (100%) の間で設定する必要があります。',
      suggestion: 'write_analog の値を 0 から 1023 の間の値に変更してください。'
    });
  }

  return warnings;
}
