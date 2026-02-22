import { loadConfig } from '../utils/config.js';

export interface AIConfigInfo {
  providers: ProviderInfo[];
  defaultProvider: string;
  defaults: DefaultsInfo;
}

export interface ProviderInfo {
  name: string;
  baseUrl: string;
  hasApiKey: boolean;
  models: {
    text: string[];
    whisper: string[];
    image: string[];
    video: string[];
  };
}

export interface DefaultsInfo {
  text: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  whisper: {
    model: string;
    language: string;
  };
  image: {
    model: string;
    size: string;
    quality: string;
  };
  video: {
    model: string;
    duration: number;
  };
}

export function getAIConfig(): AIConfigInfo {
  const config = loadConfig();

  const providers: ProviderInfo[] = Object.values(config.providers).map((p) => ({
    name: p.name,
    baseUrl: p.baseUrl,
    hasApiKey: !!p.apiKey,
    models: p.models,
  }));

  return {
    providers,
    defaultProvider: config.defaultProvider,
    defaults: {
      text: {
        model: config.textDefaults.model,
        temperature: config.textDefaults.temperature,
        maxTokens: config.textDefaults.maxTokens,
      },
      whisper: {
        model: config.whisperDefaults.model,
        language: config.whisperDefaults.language,
      },
      image: {
        model: config.imageDefaults.model,
        size: config.imageDefaults.size,
        quality: config.imageDefaults.quality,
      },
      video: {
        model: config.videoDefaults.model,
        duration: config.videoDefaults.duration,
      },
    },
  };
}
