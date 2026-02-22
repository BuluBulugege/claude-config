import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../utils/config.js';

export interface TTSParams {
  text: string;
  voiceId?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
  outputDir?: string;
}

export interface TTSResult {
  audioFile: string;
  duration: number;
  voiceId: string;
}

export async function generateSpeech(params: TTSParams): Promise<TTSResult> {
  const config = loadConfig();
  const ttsConfig = config.ttsDefaults;

  const voiceId = params.voiceId || ttsConfig.voiceId;
  const speed = params.speed ?? ttsConfig.speed;
  const vol = params.vol ?? ttsConfig.vol;
  const pitch = params.pitch ?? ttsConfig.pitch;

  const requestBody = {
    model: ttsConfig.model,
    text: params.text,
    stream: false,
    voice_setting: {
      voice_id: voiceId,
      speed: speed,
      vol: vol,
      pitch: pitch,
    },
    audio_setting: {
      sample_rate: ttsConfig.sampleRate,
      bitrate: ttsConfig.bitrate,
      format: ttsConfig.format,
    },
  };

  const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ttsConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax TTS API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as {
    base_resp?: { status_code: number; status_msg: string };
    data?: { audio: string };
    extra_info?: { audio_length: number };
  };

  if (result.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax TTS error: ${result.base_resp?.status_msg}`);
  }

  const audioBase64 = result.data?.audio;
  if (!audioBase64) {
    throw new Error('No audio data in response');
  }

  // 生成输出文件路径
  const outputDir = params.outputDir || ttsConfig.outputDir || '/tmp';
  const timestamp = Date.now();
  const filename = `tts_${timestamp}.${ttsConfig.format}`;
  const outputPath = join(outputDir, filename);

  // 写入音频文件
  const audioBuffer = Buffer.from(audioBase64, 'hex');
  writeFileSync(outputPath, audioBuffer);

  return {
    audioFile: outputPath,
    duration: result.extra_info?.audio_length || 0,
    voiceId: voiceId,
  };
}
