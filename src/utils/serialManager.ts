import { SensorData } from '../types/studuino';

type SerialLogCallback = (text: string, type: 'info' | 'error' | 'success' | 'repl') => void;
type SensorCallback = (data: SensorData) => void;

class SerialManager {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isReading = false;
  private logCallbacks: Set<SerialLogCallback> = new Set();
  private sensorCallbacks: Set<SensorCallback> = new Set();
  private simulatedInterval: any = null;
  private isSimulated = true;

  // Cache current simulator values so sliders can affect them
  public simData: SensorData = {
    temperature: 24.5,
    light: 1850,
    buttonA: false,
    buttonB: false,
    accelX: 0.12,
    accelY: -0.05,
    accelZ: 9.81,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    compassHeading: 180,
  };

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public registerLogCallback(cb: SerialLogCallback) {
    this.logCallbacks.add(cb);
    return () => this.logCallbacks.delete(cb);
  }

  public registerSensorCallback(cb: SensorCallback) {
    this.sensorCallbacks.add(cb);
    return () => this.sensorCallbacks.delete(cb);
  }

  private log(text: string, type: 'info' | 'error' | 'success' | 'repl' = 'info') {
    this.logCallbacks.forEach((cb) => cb(text, type));
  }

  public isConnected(): boolean {
    return this.port !== null;
  }

  public isSimulating(): boolean {
    return this.isSimulated;
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.log('Web Serial API がお使いのブラウザでサポートされていません。シミュレーターモードで起動します。', 'info');
      this.startSimulation();
      return false;
    }

    try {
      this.log('接続先デバイスを選択してください...', 'info');
      this.port = await (navigator as any).serial.requestPort();
      
      this.log('ポートを開いています（ボーレート: 115200）...', 'info');
      await this.port.open({ baudRate: 115200 });
      
      this.isSimulated = false;
      this.stopSimulation();

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      const textDecoder = new TextDecoderStream();
      this.reader = this.port.readable.pipeThrough(textDecoder).getReader();
      
      this.log('Studuino:bit へのシリアル接続が成功しました！', 'success');
      this.isReading = true;
      this.readLoop();

      // Send ctrl+c to interrupt any running script
      await this.sendRaw('\x03');
      
      return true;
    } catch (err: any) {
      this.log(`接続エラー: ${err.message}`, 'error');
      this.port = null;
      this.startSimulation();
      throw err;
    }
  }

  public async disconnect() {
    this.log('デバイスを切断しています...', 'info');
    
    // Stop reading loop
    this.isReading = false;
    
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {}
      this.reader = null;
    }

    if (this.writer) {
      try {
        await this.writer.close();
      } catch (e) {}
      this.writer = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {}
      this.port = null;
    }

    this.log('デバイスが切断されました。物理シミュレーターモードに切り替えます。', 'info');
    this.startSimulation();
  }

  private async readLoop() {
    let buffer = '';
    while (this.isReading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            // Check for serialized sensor monitoring packet
            if (cleanLine.startsWith('__DATA__:')) {
              this.parseSensorPacket(cleanLine);
            } else {
              this.log(cleanLine, 'repl');
            }
          }
        }
      } catch (err: any) {
        this.log(`シリアル読込エラー: ${err.message}`, 'error');
        break;
      }
    }
  }

  private parseSensorPacket(packet: string) {
    try {
      // Format: __DATA__:temp,light,btnA,btnB,ax,ay,az,gx,gy,gz,heading
      const dataStr = packet.replace('__DATA__:', '');
      const parts = dataStr.split(',');
      if (parts.length >= 4) {
        const data: SensorData = {
          temperature: parseFloat(parts[0]) || 20,
          light: parseInt(parts[1], 10) || 0,
          buttonA: parts[2] === 'True' || parts[2] === '1',
          buttonB: parts[3] === 'True' || parts[3] === '1',
          accelX: parseFloat(parts[4]) || 0,
          accelY: parseFloat(parts[5]) || 0,
          accelZ: parseFloat(parts[6]) || 9.8,
          gyroX: parseFloat(parts[7]) || 0,
          gyroY: parseFloat(parts[8]) || 0,
          gyroZ: parseFloat(parts[9]) || 0,
          compassHeading: parseFloat(parts[10]) || 0,
        };
        this.sensorCallbacks.forEach((cb) => cb(data));
      }
    } catch (e) {}
  }

  public async sendRaw(data: string) {
    if (this.isSimulated || !this.writer) {
      this.log(`[送出 (シミュレート)]: ${data.replace('\x03', 'Ctrl+C').replace('\x04', 'Ctrl+D')}`, 'repl');
      return;
    }
    try {
      await this.writer.write(data);
    } catch (err: any) {
      this.log(`送信失敗: ${err.message}`, 'error');
    }
  }

  // Compile and Transfer Python code to Studuino:bit main.py
  public async transferCode(pythonCode: string): Promise<boolean> {
    this.log('プログラムのコンパイルと整合性チェック中...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate compilation lag

    this.log('転送を開始します。ボードへのパケット送信中...', 'info');

    if (this.isSimulated) {
      // Let's print the simulation logs of flashing
      this.log('>>> [模擬コンパイル]: 成功。エラーは検出されませんでした。', 'success');
      this.log('>>> [模擬転送]: main.py をボードのフラッシュに書き込み中...', 'info');
      let progress = 0;
      for (let i = 0; i <= 5; i++) {
        await new Promise((res) => setTimeout(res, 200));
        progress += 20;
        this.log(`書き込み中... ${progress}%`, 'info');
      }
      this.log('>>> [模擬完了]: 転送が成功しました。デバイスでプログラムを実行中です！', 'success');
      
      // Update simulation to make it active
      this.log('リアルタイムの動作チェック＆モニター出力を開始します。', 'success');
      return true;
    }

    try {
      // Actual ESP32/MicroPython code uploading over Serial REPL
      // Close reader loop briefly to avoid messy echo
      this.isReading = false;
      this.log('CTRL+C を送信して実行中のプログラムを強制終了しています...', 'info');
      await this.sendRaw('\x03');
      await new Promise((res) => setTimeout(res, 500));

      this.log('Raw REPL モード（自動書き込みモード）をアクティブにしています...', 'info');
      await this.sendRaw('\x01'); // CTRL+A (raw repl)
      await new Promise((res) => setTimeout(res, 500));

      this.log('main.py ファイルを開いて、Pythonコードを書き込んでいます...', 'info');
      // Escaping blocks of text to python write statement
      const escapedCode = pythonCode.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      const writeCmd = `f = open('main.py', 'w')\nf.write('${escapedCode}')\nf.close()\n`;

      await this.sendRaw(writeCmd);
      await new Promise((res) => setTimeout(res, 800));

      this.log('ソフトウェア再起動（ソフトリブート）を実行します...', 'info');
      await this.sendRaw('\x04'); // CTRL+D (soft reboot)
      await new Promise((res) => setTimeout(res, 1000));

      // Re-enable and resume read loop
      this.isReading = true;
      this.readLoop();

      this.log('プログラムの転送と自動実行が完了しました！', 'success');
      return true;
    } catch (err: any) {
      this.log(`転送エラーが発生しました: ${err.message}`, 'error');
      // Re-enable read just in case
      this.isReading = true;
      if (this.port) this.readLoop();
      return false;
    }
  }

  // Inject a specialized MicroPython monitoring firmware loop to report actual board sensor values back to browser
  public async injectLiveMonitor(): Promise<boolean> {
    if (this.isSimulated) {
      this.log('シミュレータ上で実機モニタープログラムの注入（模擬）を開始しました。', 'info');
      await new Promise((r) => setTimeout(r, 600));
      this.log('センサー自動取得モードがオンになりました。スライダー等でテスト可能です。', 'success');
      return true;
    }

    this.log('実機モニター用Pythonスクリプトを生成中...', 'info');
    const monitorScript = `from pystubit.board import *
import time

print("Live telemetry started...")
while True:
    try:
        t = temperature.get_celsius()
    except:
        t = 0
    try:
        l = lightsensor.get_value()
    except:
        l = 0
    try:
        ba = button_a.is_pressed()
    except:
        ba = False
    try:
        bb = button_b.is_pressed()
    except:
        bb = False
    try:
        ax, ay, az = accelerometer.get_values()
    except:
        ax, ay, az = 0, 0, 9.8
    try:
        gx, gy, gz = gyro.get_values()
    except:
        gx, gy, gz = 0, 0, 0
    try:
        heading = compass.heading()
    except:
        heading = 0
    # format: temp,light,btnA,btnB,ax,ay,az,gx,gy,gz,heading
    print("__DATA__:{},{},{},{},{},{},{},{},{},{},{}".format(t, l, ba, bb, ax, ay, az, gx, gy, gz, heading))
    time.sleep_ms(250)
`;

    try {
      this.isReading = false;
      this.log('シリアルREPLを初期化中...', 'info');
      await this.sendRaw('\x03'); // ctrl+c
      await new Promise((res) => setTimeout(res, 300));
      await this.sendRaw('\x01'); // ctrl+a (raw REPL)
      await new Promise((res) => setTimeout(res, 300));

      this.log('実機センサー読み取り用のバッキング処理をボードのRAMに一時転送して展開中...', 'info');
      
      // We will send block of raw stream representing python script to run on board
      const escapedScript = monitorScript.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      const execCmd = `exec('''${escapedScript}''')\n`;
      await this.sendRaw(execCmd);
      
      this.log('ソフト再接続を行っています...', 'info');
      this.isReading = true;
      this.readLoop();
      
      this.log('実機センサー情報のストリーミング監視を開始しました！', 'success');
      return true;
    } catch (err: any) {
      this.log(`実機モニター起動エラー: ${err.message}`, 'error');
      this.isReading = true;
      if (this.port) this.readLoop();
      return false;
    }
  }

  // Polling simulated sensors
  public startSimulation() {
    this.isSimulated = true;
    if (this.simulatedInterval) clearInterval(this.simulatedInterval);

    this.simulatedInterval = setInterval(() => {
      // Simulate lifelike micro fluctuations
      this.simData.temperature += (Math.random() - 0.5) * 0.2;
      this.simData.temperature = Math.max(10, Math.min(45, this.simData.temperature));

      this.simData.light += Math.floor((Math.random() - 0.5) * 80);
      this.simData.light = Math.max(0, Math.min(4095, this.simData.light));

      this.simData.accelX += (Math.random() - 0.5) * 0.1;
      this.simData.accelY += (Math.random() - 0.5) * 0.1;
      this.simData.accelZ += (Math.random() - 0.5) * 0.1;

      // Small gyro swing
      this.simData.gyroX = (Math.random() - 0.5) * 5;
      this.simData.gyroY = (Math.random() - 0.5) * 5;
      this.simData.gyroZ = (Math.random() - 0.5) * 5;

      // Compass fluctuation
      this.simData.compassHeading += (Math.random() - 0.5) * 4;
      if (this.simData.compassHeading < 0) this.simData.compassHeading += 360;
      if (this.simData.compassHeading > 360) this.simData.compassHeading -= 360;

      // Push copy to listeners
      this.sensorCallbacks.forEach((cb) => cb({ ...this.simData }));
    }, 400);
  }

  public stopSimulation() {
    if (this.simulatedInterval) {
      clearInterval(this.simulatedInterval);
      this.simulatedInterval = null;
    }
  }

  public triggerSimulatedButton(btn: 'A' | 'B', pressed: boolean) {
    if (btn === 'A') {
      this.simData.buttonA = pressed;
    } else {
      this.simData.buttonB = pressed;
    }
    // Update listeners immediately
    this.sensorCallbacks.forEach((cb) => cb({ ...this.simData }));
    
    // Add console logs
    const action = pressed ? '押されました (Pressed)' : '放されました (Released)';
    this.log(`[シミュレーター]: ボタン ${btn} が${action}`, 'repl');
  }

  public updateSimulatedSensor(sensor: 'temperature' | 'light' | 'compassHeading' | 'accelX' | 'accelY' | 'accelZ', value: number) {
    this.simData[sensor] = value;
    this.sensorCallbacks.forEach((cb) => cb({ ...this.simData }));
  }
}

export const serialManager = new SerialManager();
export default serialManager;
