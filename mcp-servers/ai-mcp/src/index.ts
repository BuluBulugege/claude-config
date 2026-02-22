#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { generateSpeech } from './tools/tts.js';
import { transcribeAudio } from './tools/whisper.js';
import { generateImage, editImage, createImageVariation } from './tools/image.js';
import { generateVideo, getVideoStatus } from './tools/video.js';
import { getAIConfig } from './tools/config-query.js';

const server = new Server(
  {
    name: 'ai-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'tts_generate',
        description: '文字转语音，使用MiniMax TTS生成语音文件',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要转换的文本内容' },
            voiceId: { type: 'string', description: '音色ID，可在配置文件voices中查看可用音色' },
            speed: { type: 'number', description: '语速，0.5-2.0，默认1.0' },
            vol: { type: 'number', description: '音量，0.1-10.0，默认1.0' },
            pitch: { type: 'number', description: '音调，-12到12，默认0' },
            outputDir: { type: 'string', description: '输出目录，默认/tmp' },
          },
          required: ['text'],
        },
      },
      {
        name: 'whisper_transcribe',
        description: '使用Whisper将语音转换为文本，支持逐字定位',
        inputSchema: {
          type: 'object',
          properties: {
            audioFile: { type: 'string', description: '音频文件路径' },
            model: { type: 'string', description: '模型名称' },
            language: { type: 'string', description: '语言代码' },
            prompt: { type: 'string', description: '提示词' },
            responseFormat: {
              type: 'string',
              enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
              description: '响应格式'
            },
            timestampGranularities: {
              type: 'array',
              items: { type: 'string', enum: ['word', 'segment'] },
              description: '时间戳粒度（word为逐字定位）'
            },
            provider: { type: 'string', description: 'AI提供商名称' },
          },
          required: ['audioFile'],
        },
      },
      {
        name: 'image_generate',
        description: '文生图，使用AI生成图片',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: '图片描述' },
            model: { type: 'string', description: '模型名称' },
            size: { type: 'string', description: '图片尺寸' },
            quality: { type: 'string', enum: ['standard', 'hd'] },
            style: { type: 'string', enum: ['vivid', 'natural'] },
            n: { type: 'number', description: '生成数量' },
            provider: { type: 'string' },
            transparentBackground: { type: 'boolean', description: '透明背景模式：生成纯绿背景图后自动滤色输出PNG' },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'image_edit',
        description: '编辑图片，基于参考图和mask进行修改',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: '原图路径' },
            prompt: { type: 'string', description: '编辑描述' },
            mask: { type: 'string', description: 'mask图路径' },
            model: { type: 'string' },
            size: { type: 'string' },
            n: { type: 'number' },
            provider: { type: 'string' },
          },
          required: ['image', 'prompt'],
        },
      },
      {
        name: 'image_variation',
        description: '基于参考图生成变体图片',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: '参考图路径' },
            model: { type: 'string' },
            size: { type: 'string' },
            n: { type: 'number' },
            provider: { type: 'string' },
          },
          required: ['image'],
        },
      },
      {
        name: 'video_generate',
        description: '生成视频，支持参考图',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: '视频描述' },
            model: { type: 'string' },
            referenceImage: { type: 'string', description: '参考图路径' },
            duration: { type: 'number', description: '时长(秒)' },
            fps: { type: 'number' },
            size: { type: 'string' },
            provider: { type: 'string' },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'video_status',
        description: '查询视频生成任务状态',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: '视频任务ID' },
            provider: { type: 'string', description: 'AI提供商名称' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ai_config_query',
        description: '查询AI配置信息，包括可用模型、baseUrl、apiKey状态',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'tts_generate': {
        const result = await generateSpeech(args as unknown as Parameters<typeof generateSpeech>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'whisper_transcribe': {
        const result = await transcribeAudio(args as unknown as Parameters<typeof transcribeAudio>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'image_generate': {
        const result = await generateImage(args as unknown as Parameters<typeof generateImage>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'image_edit': {
        const result = await editImage(args as unknown as Parameters<typeof editImage>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'image_variation': {
        const result = await createImageVariation(args as unknown as Parameters<typeof createImageVariation>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'video_generate': {
        const result = await generateVideo(args as unknown as Parameters<typeof generateVideo>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'video_status': {
        const result = await getVideoStatus(args as unknown as Parameters<typeof getVideoStatus>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'ai_config_query': {
        const result = getAIConfig();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI MCP Server started');
}

main().catch(console.error);
