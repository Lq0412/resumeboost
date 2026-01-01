/**
 * /api/finalize - 生成终稿
 */

import { serverMask } from '../shared/masking';
import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface AppliedRewrite {
  id: string;
  before_text: string;
  after_text: string;
  style: 'conservative' | 'strong';
}

interface FinalizeRequest {
  resume_text: string;
  applied_rewrites: AppliedRewrite[];
  lang: 'auto' | 'zh' | 'en';
  template: 'simple_v1';
  mask_enabled: boolean;
}

interface FinalizeResponse {
  final_markdown: string;
  final_html: string;
}

const SYSTEM_PROMPT = `你是简历排版专家。根据简历内容生成ATS友好的最终版本。

## 排版要求（simple_v1模板）
1. **结构**：单栏布局，清晰的模块分隔
2. **顺序**：姓名/联系方式 → 求职意向(可选) → 教育背景 → 专业技能 → 工作/项目经历 → 其他（证书/荣誉）
3. **格式**：
   - 使用Markdown标题（##）分隔模块
   - 经历使用bullet point（-）
   - 时间右对齐或放在标题行
   - 无表格、无图标、无多栏

## HTML要求
- 简洁的内联样式
- 适合A4打印（字号10.5-11pt，行高1.3）
- 黑字白底，无背景色
- 模块间有适当间距

## 输出格式（严格JSON）
{"final_markdown": "Markdown格式简历", "final_html": "HTML格式简历"}

## 注意
- 保持所有脱敏占位符不变
- 整合已采用的改写内容
- 确保内容完整，不遗漏原简历信息
- 一页为主，内容精炼`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  const rateLimit = checkRateLimit(ip, '/api/finalize');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: FinalizeRequest = await request.json();

    if (!body.resume_text || body.resume_text.length < 10) {
      return errorResponse('BAD_REQUEST', '简历文本不能为空', 400);
    }
    if (body.resume_text.length > 20000) {
      return errorResponse('PAYLOAD_TOO_LARGE', '简历文本超出长度限制', 413);
    }

    const maskedResume = serverMask(body.resume_text);
    
    // 构建改写信息
    let rewritesInfo = '';
    if (body.applied_rewrites && body.applied_rewrites.length > 0) {
      rewritesInfo = '\n\n已采用的改写（请融入到对应位置）：\n';
      body.applied_rewrites.forEach((r, i) => {
        rewritesInfo += `\n${i + 1}. 原文：${r.before_text}\n   改为：${r.after_text}\n`;
      });
    }

    const userPrompt = `请根据以下简历内容生成最终版本：

${maskedResume}${rewritesInfo}`;

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      maxTokens: 3000,
    });

    const result = parseJSON<FinalizeResponse>(aiResponse);
    if (!result || !result.final_markdown) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    // 如果没有 HTML，从 Markdown 生成简单 HTML
    let finalHtml = result.final_html;
    if (!finalHtml) {
      finalHtml = markdownToHtml(result.final_markdown);
    }

    const response: FinalizeResponse = {
      final_markdown: result.final_markdown,
      final_html: finalHtml,
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/finalize', ip));
  } catch (error) {
    console.error('Finalize error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}

// 简单的 Markdown 转 HTML
function markdownToHtml(markdown: string): string {
  let html = markdown
    // 标题
    .replace(/^### (.+)$/gm, '<h3 style="font-size: 12pt; margin: 8px 0 4px 0;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size: 13pt; margin: 12px 0 6px 0; border-bottom: 1px solid #ccc; padding-bottom: 2px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size: 16pt; margin: 0 0 8px 0; text-align: center;">$1</h1>')
    // 列表
    .replace(/^- (.+)$/gm, '<li style="margin: 2px 0;">$1</li>')
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 段落
    .replace(/\n\n/g, '</p><p style="margin: 4px 0;">')
    // 换行
    .replace(/\n/g, '<br>');

  // 包装列表
  html = html.replace(/(<li[^>]*>.*?<\/li>)+/g, '<ul style="margin: 4px 0; padding-left: 20px;">$&</ul>');

  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.3; max-width: 210mm; margin: 0 auto; padding: 12mm; color: #000; background: #fff;">
  <p style="margin: 4px 0;">${html}</p>
</div>`;
}
