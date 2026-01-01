# ResumeBoost

免费简历优化工具，部署于阿里云 ESA Pages 边缘计算平台。

## 功能特性

- 📄 **简历诊断**：AI 分析简历问题，提供可执行建议
- 🎯 **JD 匹配**：计算简历与职位描述的匹配度，找出缺失关键词
- ✨ **智能改写**：保守版/强化版两种风格，优化经历表达
- 📝 **终稿生成**：ATS 友好的一页 A4 简历，支持打印导出 PDF
- 🔒 **隐私保护**：默认脱敏，敏感信息不发送到 AI

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS + Vite
- **边缘函数**：阿里云 ESA Pages Edge Functions
- **PDF 解析**：pdfjs-dist

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署到 ESA Pages

1. 在阿里云 ESA Pages 控制台创建项目
2. 连接 GitHub 仓库
3. 配置环境变量：
   - `AI_API_KEY`：AI API 密钥
   - `AI_API_URL`：AI API 地址（可选，默认 OpenAI）
4. 部署

## 项目结构

```
├── src/
│   ├── components/     # 通用组件
│   ├── lib/            # 工具库
│   │   ├── api.ts      # API 客户端
│   │   ├── masking.ts  # 脱敏服务
│   │   ├── pdf.ts      # PDF 提取
│   │   ├── session.ts  # 会话存储
│   │   └── validation.ts # 输入验证
│   └── routes/         # 页面组件
│       ├── Landing/    # 入口页
│       ├── Builder/    # 简历生成器
│       └── Workspace/  # 工作台
├── functions/          # 边缘函数
│   ├── api/            # API 端点
│   │   ├── analyze.ts  # 诊断分析
│   │   ├── match.ts    # JD 匹配
│   │   ├── rewrite.ts  # 经历改写
│   │   └── finalize.ts # 终稿生成
│   └── shared/         # 共享模块
└── esa.config.json     # ESA Pages 配置
```

## API 限流

| 端点 | 限制 |
|------|------|
| /api/analyze | 10 次/分钟 |
| /api/match | 20 次/分钟 |
| /api/rewrite | 20 次/分钟 |
| /api/finalize | 10 次/分钟 |

## 隐私说明

- 默认脱敏：手机号、邮箱、身份证、地址自动替换为占位符
- 无服务端存储：数据仅存储在浏览器 sessionStorage
- 边缘函数二次脱敏：确保敏感信息不发送到 AI

## License

MIT
