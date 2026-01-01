/**
 * /api/analyze - 简历诊断分析
 */

import { serverMask } from '../shared/masking';
import { checkRateLimit, getRateLimitHeaders } from '../shared/ratelimit';
import { callAI, parseJSON } from '../shared/ai';
import { jsonResponse, errorResponse, rateLimitResponse } from '../shared/response';

interface AnalyzeRequest {
  resume_text: string;
  jd_text?: string | null;
  lang: 'auto' | 'zh' | 'en';
  mask_enabled: boolean;
}

interface Issue {
  title: string;
  why: string;
  how: string;
  example?: { before: string; after: string };
}

interface AnalyzeResponse {
  issues: Issue[];
  actions: string[];
  examples: { before: string; after: string }[];
}

const SYSTEM_PROMPT = `你是资深HR和简历优化专家，拥有10年招聘经验。请对简历进行深度诊断。

## 分析维度（按优先级）
1. **结构完整性**：是否包含必要模块（联系方式、教育、经历、技能）？顺序是否合理？
2. **内容质量**：描述是否具体可量化？是否使用STAR法则？是否有空洞表述？
3. **ATS友好度**：格式是否规范？关键词是否充足？是否有特殊字符/表格影响解析？
4. **专业度**：时间线是否合理？是否有明显错误（如未来时间）？表述是否专业？
5. **差异化**：是否突出个人优势？是否有亮点数据？

## 输出要求
- issues：找出3-6个最关键的问题，每个问题必须：
  - title：一句话概括问题（如"项目成果缺乏量化数据"）
  - why：解释为什么这是问题，对求职的具体影响
  - how：给出具体可执行的改进方法，最好有示例
- actions：5-8条立即可执行的优化建议，按重要性排序，以动词开头
- examples：如果发现可以改进的具体句子，给出before/after示例（最多3个）

## 输出格式（严格JSON）
{"issues": [{"title": "问题标题", "why": "原因和影响", "how": "具体改进方法"}], "actions": ["建议1"], "examples": [{"before": "原文", "after": "改进后"}]}

## 注意
- 保持脱敏占位符（如[PHONE_1]、[EMAIL_1]）不变
- 不要给出泛泛的建议，要针对简历的具体内容
- 优先指出影响最大的问题`;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed', 405);
  }

  // 获取客户端 IP
  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  // 限流检查
  const rateLimit = checkRateLimit(ip, '/api/analyze');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!);
  }

  try {
    const body: AnalyzeRequest = await request.json();

    // 验证输入
    if (!body.resume_text || body.resume_text.length < 10) {
      return errorResponse('BAD_REQUEST', '简历文本不能为空', 400);
    }
    if (body.resume_text.length > 20000) {
      return errorResponse('PAYLOAD_TOO_LARGE', '简历文本超出长度限制', 413);
    }

    // 二次脱敏
    const maskedResume = serverMask(body.resume_text);
    const maskedJd = body.jd_text ? serverMask(body.jd_text) : '';

    // 构建提示
    let userPrompt = `请分析以下简历：\n\n${maskedResume}`;
    if (maskedJd) {
      userPrompt += `\n\n目标职位 JD：\n${maskedJd}`;
    }

    // 调用 AI
    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    // 解析响应
    const result = parseJSON<AnalyzeResponse>(aiResponse);
    if (!result) {
      return errorResponse('MODEL_ERROR', 'AI 响应解析失败', 502);
    }

    // 确保数组字段存在
    const response: AnalyzeResponse = {
      issues: (result.issues || []).slice(0, 10),
      actions: (result.actions || []).slice(0, 10),
      examples: result.examples || [],
    };

    return jsonResponse(response, 200, getRateLimitHeaders('/api/analyze', ip));
  } catch (error) {
    console.error('Analyze error:', error);
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500);
  }
}
