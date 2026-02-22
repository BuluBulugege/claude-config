import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { loadConfig } from '../utils/config.js';

export interface ImageGenerateParams {
  prompt: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  provider?: string;
  transparentBackground?: boolean;
}

export interface ImageEditParams {
  image: string;
  prompt: string;
  mask?: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
  provider?: string;
}

export interface ImageVariationParams {
  image: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
  provider?: string;
}

export interface ImageResult {
  url?: string;
  filePath?: string;
  revisedPrompt?: string;
}

function saveBase64ToFile(base64Data: string, outputDir: string = '/tmp'): string {
  const timestamp = Date.now();
  const filename = `image_${timestamp}.png`;
  const filePath = join(outputDir, filename);
  const buffer = Buffer.from(base64Data, 'base64');
  writeFileSync(filePath, buffer);
  return filePath;
}

async function chromaKeyGreen(inputPath: string): Promise<string> {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    // Remove pixels where green dominates (chroma key)
    if (g > 100 && g > r * 1.4 && g > b * 1.4) {
      data[i * channels + 3] = 0;
    }
  }
  const outPath = inputPath.replace(/\.png$/, '.transparent.png');
  await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toFile(outPath);
  return outPath;
}

function getClient(providerName?: string) {
  const config = loadConfig();
  const name = providerName || config.defaultProvider;
  const provider = config.providers[name];

  if (!provider) {
    throw new Error(`Provider not found: ${name}`);
  }

  return {
    client: new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    }),
    defaults: config.imageDefaults,
  };
}

const FALLBACK_MODEL = 'doubao-seedream-4-5-251128';

async function generateImageWithModel(client: OpenAI, defaults: any, params: ImageGenerateParams, model: string): Promise<ImageResult[]> {
  const prompt = params.transparentBackground
    ? `${params.prompt}. Pure solid green background (#00FF00), subject centered and fully visible against the green background.`
    : params.prompt;

  if (model.includes('gemini')) {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Generate an image: ${prompt}` }],
    });

    const message = response.choices[0]?.message;
    const content = message?.content || '';

    // Gemini返回格式: ![image](data:image/png;base64,...)
    const base64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    const textMatch = content.match(/^([^!\[]*)/);

    let filePath: string | undefined;
    if (base64Match) {
      filePath = saveBase64ToFile(base64Match[1]);
    }

    return [{
      url: undefined,
      filePath,
      revisedPrompt: textMatch ? textMatch[1].trim() : params.prompt,
    }];
  }

  const response = await client.images.generate({
    model,
    prompt,
    size: params.size || defaults.size as ImageGenerateParams['size'],
    quality: params.quality || defaults.quality as ImageGenerateParams['quality'],
    style: params.style || defaults.style as ImageGenerateParams['style'],
    n: params.n || 1,
  });

  return (response.data || []).map((img) => {
    let filePath: string | undefined;
    if (img.b64_json) {
      filePath = saveBase64ToFile(img.b64_json);
    }
    return { url: img.url, filePath, revisedPrompt: img.revised_prompt };
  });
}

export async function generateImage(params: ImageGenerateParams): Promise<ImageResult[]> {
  const { client, defaults } = getClient(params.provider);
  const primaryModel = params.model || defaults.model;
  let results: ImageResult[];
  try {
    results = await generateImageWithModel(client, defaults, params, primaryModel);
  } catch (err) {
    if (primaryModel === FALLBACK_MODEL) throw err;
    results = await generateImageWithModel(client, defaults, params, FALLBACK_MODEL);
  }
  if (params.transparentBackground) {
    results = await Promise.all(results.map(async (r) => {
      if (r.filePath) r.filePath = await chromaKeyGreen(r.filePath);
      return r;
    }));
  }
  return results;
}

export async function editImage(params: ImageEditParams): Promise<ImageResult[]> {
  const { client, defaults } = getClient(params.provider);

  const imageBuffer = readFileSync(params.image);
  const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });

  let maskFile: File | undefined;
  if (params.mask) {
    const maskBuffer = readFileSync(params.mask);
    maskFile = new File([maskBuffer], 'mask.png', { type: 'image/png' });
  }

  const response = await client.images.edit({
    image: imageFile,
    prompt: params.prompt,
    mask: maskFile,
    model: params.model || 'dall-e-2',
    size: params.size || '1024x1024',
    n: params.n || 1,
  });

  return (response.data || []).map((img) => {
    let filePath: string | undefined;
    if (img.b64_json) {
      filePath = saveBase64ToFile(img.b64_json);
    }
    return {
      url: img.url,
      filePath,
    };
  });
}

export async function createImageVariation(params: ImageVariationParams): Promise<ImageResult[]> {
  const { client } = getClient(params.provider);

  const imageBuffer = readFileSync(params.image);
  const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });

  const response = await client.images.createVariation({
    image: imageFile,
    model: params.model || 'dall-e-2',
    size: params.size || '1024x1024',
    n: params.n || 1,
  });

  return (response.data || []).map((img) => {
    let filePath: string | undefined;
    if (img.b64_json) {
      filePath = saveBase64ToFile(img.b64_json);
    }
    return {
      url: img.url,
      filePath,
    };
  });
}
