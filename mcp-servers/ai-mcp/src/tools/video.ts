import { readFileSync } from 'fs';
import { loadConfig } from '../utils/config.js';

export interface VideoGenerateParams {
  prompt: string;
  model?: string;
  referenceImage?: string;
  duration?: number;
  fps?: number;
  size?: string;
  provider?: string;
}

export interface VideoResult {
  url?: string;
  taskId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

function getProviderConfig(providerName?: string) {
  const config = loadConfig();
  const name = providerName || config.defaultProvider;
  const provider = config.providers[name];

  if (!provider) {
    throw new Error(`Provider not found: ${name}`);
  }

  return {
    defaults: config.videoDefaults,
    provider,
  };
}

// Sora 使用 /v1/videos 接口 (multipart/form-data)，与 Veo 格式一致
async function generateWithSora(
  params: VideoGenerateParams,
  provider: { baseUrl: string; apiKey: string },
  defaults: { duration: number }
): Promise<VideoResult> {
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  formData.append('model', params.model || 'sora-2-all');
  formData.append('prompt', params.prompt);
  formData.append('seconds', String(params.duration || defaults.duration || 8));
  formData.append('size', params.size || '16x9');
  formData.append('watermark', 'false');

  if (params.referenceImage) {
    const imageBuffer = readFileSync(params.referenceImage);
    formData.append('input_reference', imageBuffer, {
      filename: 'reference.png',
      contentType: 'image/png',
    });
  }

  const response = await fetch(`${provider.baseUrl}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      ...formData.getHeaders(),
    },
    body: new Uint8Array(formData.getBuffer()),
  });

  if (!response.ok) {
    const error = await response.text();
    return { status: 'failed', error: `API error: ${response.status} - ${error}` };
  }

  const data = await response.json() as {
    id?: string;
    status?: string;
    video_url?: string;
  };

  return {
    url: data.video_url || undefined,
    taskId: data.id,
    status: data.video_url ? 'completed' : 'processing',
  };
}

// Veo 使用 /v1/videos 接口 (multipart/form-data)
async function generateWithVeo(
  params: VideoGenerateParams,
  provider: { baseUrl: string; apiKey: string },
  defaults: { duration: number }
): Promise<VideoResult> {
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  formData.append('model', params.model || 'veo_3_1');
  formData.append('prompt', params.prompt);
  formData.append('seconds', String(params.duration || defaults.duration || 8));

  // size: 16x9 横屏, 9x16 竖屏
  formData.append('size', params.size || '16x9');
  formData.append('watermark', 'false');

  if (params.referenceImage) {
    const imageBuffer = readFileSync(params.referenceImage);
    formData.append('input_reference', imageBuffer, {
      filename: 'reference.png',
      contentType: 'image/png',
    });
  }

  const response = await fetch(`${provider.baseUrl}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      ...formData.getHeaders(),
    },
    body: new Uint8Array(formData.getBuffer()),
  });

  if (!response.ok) {
    const error = await response.text();
    return { status: 'failed', error: `API error: ${response.status} - ${error}` };
  }

  const data = await response.json() as {
    id?: string;
    status?: string;
    url?: string;
  };

  return {
    url: data.url,
    taskId: data.id,
    status: data.url ? 'completed' : 'processing',
  };
}

export interface VideoStatusParams {
  taskId: string;
  provider?: string;
}

export interface VideoStatusResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  enhancedPrompt?: string;
  error?: string;
}

export async function getVideoStatus(params: VideoStatusParams): Promise<VideoStatusResult> {
  const { provider } = getProviderConfig(params.provider);

  const response = await fetch(`${provider.baseUrl}/videos/${params.taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      id: params.taskId,
      status: 'failed',
      error: `API error: ${response.status} - ${error}`,
    };
  }

  const data = await response.json() as {
    id: string;
    status: string;
    video_url?: string | null;
    enhanced_prompt?: string;
  };

  let status: VideoStatusResult['status'] = 'processing';
  if (data.status === 'completed' || data.status === 'succeeded') {
    status = 'completed';
  } else if (data.status === 'failed') {
    status = 'failed';
  } else if (data.status === 'pending' || data.status === 'queued') {
    status = 'pending';
  }

  return {
    id: data.id,
    status,
    url: data.video_url || undefined,
    enhancedPrompt: data.enhanced_prompt,
  };
}

export async function generateVideo(params: VideoGenerateParams): Promise<VideoResult> {
  const { defaults, provider } = getProviderConfig(params.provider);

  if (!provider.models.video || provider.models.video.length === 0) {
    throw new Error(`Provider ${provider.name} does not support video generation`);
  }

  const model = params.model || defaults.model || provider.models.video[0];

  try {
    // 根据模型名称选择 API
    if (model.toLowerCase().includes('sora')) {
      return await generateWithSora({ ...params, model }, provider, defaults);
    } else if (model.toLowerCase().includes('veo')) {
      return await generateWithVeo({ ...params, model }, provider, defaults);
    } else {
      // 默认使用 Veo 格式
      return await generateWithVeo({ ...params, model }, provider, defaults);
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
