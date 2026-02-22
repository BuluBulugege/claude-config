import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: {
    text: string[];
    whisper: string[];
    image: string[];
    video: string[];
  };
}

export interface TextDefaults {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface WhisperDefaults {
  model: string;
  language: string;
  responseFormat: string;
  timestampGranularities: string[];
}

export interface ImageDefaults {
  model: string;
  size: string;
  quality: string;
  style: string;
}

export interface VideoDefaults {
  model: string;
  duration: number;
  fps: number;
}

export interface TTSDefaults {
  apiKey: string;
  model: string;
  voiceId: string;
  speed: number;
  vol: number;
  pitch: number;
  sampleRate: number;
  bitrate: number;
  format: string;
  outputDir: string;
  voices: Record<string, string>;
}

export interface AIConfig {
  providers: Record<string, ProviderConfig>;
  defaultProvider: string;
  textDefaults: TextDefaults;
  whisperDefaults: WhisperDefaults;
  imageDefaults: ImageDefaults;
  videoDefaults: VideoDefaults;
  ttsDefaults: TTSDefaults;
}

let cachedConfig: AIConfig | null = null;

function resolveEnvVars(value: string): string {
  return value.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '');
}

export function loadConfig(): AIConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(__dirname, '../../config/ai-config.json');
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const raw = readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw) as AIConfig;

  // 解析环境变量
  for (const key of Object.keys(config.providers)) {
    config.providers[key].apiKey = resolveEnvVars(config.providers[key].apiKey);
    config.providers[key].baseUrl = resolveEnvVars(config.providers[key].baseUrl);
  }

  cachedConfig = config;
  return config;
}
