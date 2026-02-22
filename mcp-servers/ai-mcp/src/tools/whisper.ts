import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { loadConfig } from '../utils/config.js';

export interface WhisperParams {
  audioFile: string;
  model?: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  timestampGranularities?: ('word' | 'segment')[];
  provider?: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SegmentTimestamp {
  id: number;
  text: string;
  start: number;
  end: number;
}

export interface WhisperResult {
  text: string;
  language?: string;
  duration?: number;
  words?: WordTimestamp[];
  segments?: SegmentTimestamp[];
}

export async function transcribeAudio(params: WhisperParams): Promise<WhisperResult> {
  const config = loadConfig();
  const providerName = params.provider || config.defaultProvider;
  const provider = config.providers[providerName];

  if (!provider) {
    throw new Error(`Provider not found: ${providerName}`);
  }

  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });

  const defaults = config.whisperDefaults;

  const granularities = params.timestampGranularities ||
    (defaults.timestampGranularities as ('word' | 'segment')[]);

  const needsVerbose = granularities.includes('word') ||
    granularities.includes('segment');

  const format = needsVerbose ? 'verbose_json' :
    (params.responseFormat || defaults.responseFormat);

  const requestParams: OpenAI.Audio.TranscriptionCreateParams = {
    file: createReadStream(params.audioFile) as unknown as File,
    model: params.model || defaults.model,
    response_format: format as OpenAI.Audio.TranscriptionCreateParams['response_format'],
  };

  if (params.language && params.language !== 'auto') {
    requestParams.language = params.language;
  }

  if (params.prompt) {
    requestParams.prompt = params.prompt;
  }

  if (needsVerbose) {
    requestParams.timestamp_granularities = granularities;
  }

  const response = await client.audio.transcriptions.create(requestParams);

  // 处理不同格式的响应
  if (typeof response === 'string') {
    return { text: response };
  }

  const result: WhisperResult = {
    text: response.text,
  };

  // 处理verbose_json格式的额外字段
  const verboseResponse = response as {
    text: string;
    language?: string;
    duration?: number;
    words?: WordTimestamp[];
    segments?: SegmentTimestamp[];
  };

  if (verboseResponse.language) {
    result.language = verboseResponse.language;
  }

  if (verboseResponse.duration) {
    result.duration = verboseResponse.duration;
  }

  if (verboseResponse.words) {
    result.words = verboseResponse.words;
  }

  if (verboseResponse.segments) {
    result.segments = verboseResponse.segments;
  }

  return result;
}
