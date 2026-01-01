/**
 * AI 模型调用封装
 * 注意：需要配置环境变量 AI_API_KEY 和 AI_API_URL
 */

export interface AIRequestOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export async function callAI(options: AIRequestOptions): Promise<string> {
  const apiKey = (globalThis as any).AI_API_KEY || process.env.AI_API_KEY;
  const apiUrl = (globalThis as any).AI_API_URL || process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    throw new Error('AI_API_KEY not configured');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export function parseJSON<T>(text: string): T | null {
  try {
    // 尝试提取 JSON 块
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // 直接解析
    return JSON.parse(text);
  } catch {
    return null;
  }
}
