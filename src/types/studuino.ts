export interface PixelColor {
  r: number;
  g: number;
  b: number;
}

export type GridPattern = number[][]; // 5x5 grid of 0 or 1

export interface StuduinoProject {
  id: string;
  name: string;
  pythonCode: string;
  blocks: BlockData[];
  createdAt: string;
  updatedAt: string;
}

export type BlockType =
  | 'start'
  | 'loop_forever'
  | 'led_set_pixel'
  | 'led_clear'
  | 'led_show_builtin'
  | 'led_show_text'
  | 'buzzer_on'
  | 'buzzer_off'
  | 'delay_ms'
  | 'if_button_pressed'
  | 'terminal_write'
  | 'terminal_read';

export interface BlockData {
  id: string;
  type: BlockType;
  params: {
    x?: number;
    y?: number;
    color?: string; // hex or (r,g,b)
    text?: string;
    imageName?: string;
    tone?: string;
    duration?: number;
    button?: 'A' | 'B';
    pin?: string;
    pinValue?: number;
  };
}

export interface SensorData {
  temperature: number; // Celsius
  light: number;       // 0-4095
  buttonA: boolean;     // pressed or not
  buttonB: boolean;     // pressed or not
  accelX: number;      // m/s^2
  accelY: number;
  accelZ: number;
  gyroX: number;       // dps
  gyroY: number;
  gyroZ: number;
  compassHeading: number; // 0-360 degrees
}

export interface SafetyWarning {
  id: string;
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  suggestion: string;
  codeSnippet?: string;
}

export interface TutorialStep {
  title: string;
  description: string;
  targetId?: string; // Selector to highlight
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
