/**
 * Mock API 响应 - 用于本地开发测试
 */

export const mockAnalyzeResponse = {
  issues: [
    {
      title: '缺少量化数据',
      why: '简历中的成就描述缺乏具体数字，难以展示实际影响力',
      how: '为每项成就添加具体的数字指标，如增长百分比、处理数量等',
      example: {
        before: '提升了系统性能',
        after: '优化数据库查询，将系统响应时间从 2s 降低至 200ms，提升 90%'
      }
    },
    {
      title: '动词使用较弱',
      why: '使用了"负责"、"参与"等被动词汇，缺乏主动性',
      how: '使用更有力的动词如"主导"、"设计"、"实现"、"优化"',
    },
    {
      title: '技能列表可优化',
      why: '技能排列缺乏优先级，重要技能不突出',
      how: '将与目标职位最相关的技能放在前面',
    }
  ],
  actions: [
    '为每项工作经历添加 2-3 个量化指标',
    '将"负责"替换为更主动的动词',
    '按重要性重新排列技能列表',
    '添加项目的技术栈说明',
    '精简冗长的描述，每条 bullet 控制在一行内'
  ],
  examples: []
};

export const mockMatchResponse = {
  score: 72,
  missing_keywords: [
    'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
    'CI/CD', 'GraphQL', '微服务', '单元测试', 'Agile',
    'RESTful API', 'MongoDB', 'Redis', '性能优化', '代码审查'
  ],
  hit_keywords: [
    'React', 'JavaScript', 'Git', 'HTML', 'CSS',
    'Vue', '前端开发', '响应式设计'
  ],
  notes: '简历与职位要求有较好匹配，但缺少后端和云服务相关经验的体现'
};

export const mockRewriteResponse = (style: string) => ({
  rewritten_text: style === 'conservative'
    ? '- 负责前端架构设计与核心模块开发，确保代码质量和可维护性\n- 优化页面加载性能，提升用户体验\n- 与后端团队协作，完成 API 对接和数据处理'
    : '- 主导前端架构升级，引入组件化设计，代码复用率提升 X%\n- 实施性能优化方案，首屏加载时间减少 X%，用户留存提升 X%\n- 设计并实现 X+ 个核心业务模块，支撑日均 X 万用户访问',
  cautions: style === 'strong' ? ['请将 X% 和 X 替换为实际数据'] : []
});

export const mockFinalizeResponse = {
  final_markdown: `# 张三

[PHONE_1] | [EMAIL_1] | 北京

## Skills

React, TypeScript, Node.js, Vue, JavaScript, Git, Docker

## Experience

### ABC科技有限公司 | 高级前端工程师 | 2021-至今

- 主导前端架构升级，引入微前端方案，支撑 10+ 业务线独立部署
- 优化核心页面性能，首屏加载时间从 3s 降至 800ms
- 搭建组件库和开发规范，团队开发效率提升 40%

### XYZ互联网公司 | 前端工程师 | 2019-2021

- 负责电商平台前端开发，日均 PV 100 万+
- 实现购物车、订单等核心模块，转化率提升 15%

## Education

- 北京大学 | 计算机科学 | 本科 | 2015-2019
`,
  final_html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; max-width: 210mm; margin: 0 auto; padding: 12mm; color: #000; background: #fff;">
  <h1 style="font-size: 18pt; margin: 0 0 8px 0; text-align: center;">张三</h1>
  <p style="text-align: center; margin: 0 0 16px 0; color: #666;">[PHONE_1] | [EMAIL_1] | 北京</p>
  
  <h2 style="font-size: 12pt; margin: 16px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Skills</h2>
  <p style="margin: 0 0 12px 0;">React, TypeScript, Node.js, Vue, JavaScript, Git, Docker</p>
  
  <h2 style="font-size: 12pt; margin: 16px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Experience</h2>
  
  <h3 style="font-size: 11pt; margin: 12px 0 4px 0;">ABC科技有限公司 | 高级前端工程师 | 2021-至今</h3>
  <ul style="margin: 4px 0; padding-left: 20px;">
    <li>主导前端架构升级，引入微前端方案，支撑 10+ 业务线独立部署</li>
    <li>优化核心页面性能，首屏加载时间从 3s 降至 800ms</li>
    <li>搭建组件库和开发规范，团队开发效率提升 40%</li>
  </ul>
  
  <h3 style="font-size: 11pt; margin: 12px 0 4px 0;">XYZ互联网公司 | 前端工程师 | 2019-2021</h3>
  <ul style="margin: 4px 0; padding-left: 20px;">
    <li>负责电商平台前端开发，日均 PV 100 万+</li>
    <li>实现购物车、订单等核心模块，转化率提升 15%</li>
  </ul>
  
  <h2 style="font-size: 12pt; margin: 16px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Education</h2>
  <p style="margin: 0;">北京大学 | 计算机科学 | 本科 | 2015-2019</p>
</div>`
};

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockFetch(url: string, options: RequestInit): Promise<Response> {
  await delay(800 + Math.random() * 400); // 模拟网络延迟

  const body = JSON.parse(options.body as string);

  if (url.includes('/api/analyze')) {
    return new Response(JSON.stringify(mockAnalyzeResponse), { status: 200 });
  }
  
  if (url.includes('/api/match')) {
    return new Response(JSON.stringify(mockMatchResponse), { status: 200 });
  }
  
  if (url.includes('/api/rewrite')) {
    return new Response(JSON.stringify(mockRewriteResponse(body.style)), { status: 200 });
  }
  
  if (url.includes('/api/finalize')) {
    return new Response(JSON.stringify(mockFinalizeResponse), { status: 200 });
  }

  return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), { status: 404 });
}
