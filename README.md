# ResumeBoost

免费简历优化工具，帮助求职者快速创建专业简历并进行 AI 优化。

## 功能特性

### 📝 简历生成器
- **表单式编辑**：结构化填写基本信息、教育经历、工作经历、项目经历、技能、荣誉奖项
- **实时 A4 预览**：实时查看简历效果（导出 PDF 可能存在细微差异）
- **密度模式**：标准/紧凑/极简三种模式，适应不同内容量
- **页面使用指示**：显示当前内容占用百分比，避免超过一页
- **草稿保存**：自动保存到本地，下次打开可恢复
- **一键导出 PDF**：直接下载 PDF 文件

### 🤖 AI 优化工作台
- **简历诊断**：AI 分析简历问题，提供可执行建议
- **JD 匹配**：计算简历与职位描述的匹配度，找出缺失关键词
- **智能改写**：保守版/强化版两种风格，优化经历表达
- **终稿生成**：ATS 友好的一页 A4 简历

### 🔒 隐私保护
- 默认脱敏：手机号、邮箱、身份证、地址自动替换为占位符
- 无服务端存储：数据仅存储在浏览器本地
- 边缘函数二次脱敏：确保敏感信息不发送到 AI

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS v4 + Vite
- **边缘函数**：阿里云 ESA Pages Edge Functions
- **PDF 生成**：html2canvas + jsPDF
- **AI**：DeepSeek API

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 AI API 密钥

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `AI_API_KEY` | DeepSeek API 密钥 |
| `AI_API_URL` | AI API 地址（可选，默认 DeepSeek） |

## 部署到 ESA Pages

1. 在阿里云 ESA Pages 控制台创建项目
2. 连接 GitHub 仓库
3. 配置环境变量
4. 部署

## 项目结构

```
├── src/
│   ├── components/     # 通用组件
│   ├── lib/            # 工具库
│   │   ├── api.ts      # API 客户端
│   │   ├── masking.ts  # 脱敏服务
│   │   ├── session.ts  # 会话存储
│   │   └── validation.ts # 输入验证
│   └── routes/         # 页面组件
│       ├── Landing/    # 入口页
│       ├── Builder/    # 简历生成器
│       └── Workspace/  # AI 优化工作台
├── functions/          # 边缘函数
│   ├── api/            # API 端点
│   │   ├── analyze.ts  # 诊断分析
│   │   ├── match.ts    # JD 匹配
│   │   ├── rewrite.ts  # 经历改写
│   │   └── finalize.ts # 终稿生成
│   └── shared/         # 共享模块
└── esa.config.json     # ESA Pages 配置
```

## License

MIT
