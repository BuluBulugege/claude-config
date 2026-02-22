import { generateSpeech } from './tools/tts.js';
import { getAIConfig } from './tools/config-query.js';
import { generateImage } from './tools/image.js';
import { writeFileSync } from 'fs';

async function test() {
  console.log('=== 测试 AI 配置查询 ===');
  const config = getAIConfig();
  console.log(JSON.stringify(config, null, 2));

  console.log('\n=== 测试 TTS 语音生成 ===');
  try {
    const result = await generateSpeech({
      text: '你好，这是一段测试语音',
    });
    console.log('结果:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('错误:', e);
  }

  console.log('\n=== 测试图片生成 ===');
  try {
    const result = await generateImage({
      prompt: 'A cute cat sitting on a sofa',
    });
    console.log('revisedPrompt:', result[0]?.revisedPrompt);
    console.log('filePath:', result[0]?.filePath);

    if (result[0]?.filePath) {
      console.log('图片已保存到:', result[0].filePath);
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error('错误:', err.message || e);
  }
}

test();
