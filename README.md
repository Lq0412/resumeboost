# ResumeBoost 🚀

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/AI-DeepSeek-FF6B6B?style=flat-square" alt="DeepSeek AI" />
</p>

<p align="center">
  <b>免费、开源的 AI 简历优化工具</b><br/>
  帮助求职者快速创建专业简历，AI 智能分析并提供改进建议
</p>

---

## ✨ 功能亮点

### 📝 可视化简历编辑器
- **双模式编辑**：表单填写 + 预览区直接点击编辑
- **实时 A4 预览**：所见即所得，精确还原打印效果
- **智能密度调节**：标准/紧凑/极简三档，自动适应内容量
- **页面溢出提醒**：实时显示页面使用率，避免超页
- **本地草稿保存**：数据存储在浏览器，随时恢复编辑
- **一键导出 PDF**：高质量 PDF 下载

### 🤖 AI 智能优化
- **一键分析**：AI 扫描全文，自动识别可优化的描述
- **Diff 对比**：原文 vs 建议并排显示，清晰直观
- **精准定位**：点击建议卡片，自动跳转到对应位置
- **批量操作**：支持全部接受/拒绝，高效处理
- **JD 匹配**：输入职位描述，针对性优化简历内容

### 💬 AI 对话式编辑 (NEW)
- **自然语言交互**：用日常语言描述修改需求，如"让第一条工作经历更突出成果"
- **智能定位**：AI 自动理解"第一条工作经历"、"项目2的描述"等引用
- **快捷操作**：预设常用操作按钮，一键优化工作经历、添加量化数据
- **上下文感知**：AI 记住对话历史，支持连续对话
- **撤销支持**：不满意可一键撤销修改

### 🔒 隐私优先
- **本地优先**：数据仅存储在浏览器，不上传服务器
- **自动脱敏**：手机号、邮箱等敏感信息自动替换
- **边缘计算**：AI 请求通过边缘函数处理，二次脱敏

## 🖼️ 界面预览

```
┌─────────────────────────────────────────────────────────────┐
│  ResumeBoost                    [保存] [导出] [AI 优化]     │
├──────────┬─────────────────────────────┬────────────────────┤
│          │                             │                    │
│  表单区   │       A4 预览区             │   AI 建议面板      │
│          │                             │                    │
│ [基本]   │  ┌─────────────────────┐   │  ✨ AI 智能改写    │
│ [教育]   │  │                     │   │                    │
│ [技能]   │  │   实时预览          │   │  [JD 输入框]       │
│ [工作]   │  │   点击可编辑        │   │  [开始分析]        │
│ [项目]   │  │                     │   │                    │
│ [奖项]   │  │   AI 建议以 Diff    │   │  建议卡片列表      │
│          │  │   形式内联显示      │   │  - 原文 (删除线)   │
│          │  │                     │   │  + 建议 (绿色)     │
│          │  └─────────────────────┘   │  [接受] [拒绝]     │
│          │                             │                    │
└──────────┴─────────────────────────────┴────────────────────┘
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 样式方案 | Tailwind CSS v4 |
| 构建工具 | Vite 6 |
| PDF 生成 | html2canvas + jsPDF |
| AI 服务 | DeepSeek API |
| 边缘函数 | 阿里云 ESA Pages |

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/resumeboost.git
cd resumeboost

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 VITE_DEEPSEEK_API_KEY

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# 前端开发模式（本地直接调用 DeepSeek）
VITE_DEEPSEEK_API_KEY=your_api_key

# 生产环境（边缘函数使用）
AI_API_KEY=your_api_key
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

## 📁 项目结构

```
resumeboost/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Toast.tsx        # 消息提示
│   │   ├── TabNav.tsx       # 标签导航
│   │   └── LoadingSkeleton.tsx
│   ├── lib/                 # 工具库
│   │   ├── api.ts           # API 客户端 + DeepSeek 直连
│   │   ├── masking.ts       # 隐私脱敏
│   │   └── validation.ts    # 输入验证
│   ├── routes/
│       ├── Landing/         # 首页
│       ├── Builder/         # 简历编辑器 ⭐
│       │   ├── index.tsx    # 主组件
│       │   ├── EditablePreview.tsx  # 可编辑预览
│       │   ├── AISuggestionPanel.tsx # AI 建议面板
│       │   ├── AIChatPanel.tsx      # AI 对话面板 ⭐
│       │   ├── ChatMessage.tsx      # 对话消息组件
│       │   ├── ChatInput.tsx        # 对话输入框
│       │   ├── QuickActions.tsx     # 快捷操作按钮
│       │   ├── useChatState.ts      # 对话状态管理
│       │   ├── useUndoStack.ts      # 撤销栈管理
│       │   ├── AIDiffBlock.tsx      # Diff 显示组件
│       │   └── ...
│       └── Workspace/       # AI 工作台
├── functions/               # 边缘函数
│   ├── api/
│   │   ├── analyze.ts       # 简历诊断
│   │   ├── match.ts         # JD 匹配
│   │   ├── rewrite.ts       # 经历改写
│   │   ├── rewrite-suggestions.ts  # AI 建议
│   │   ├── chat-edit.ts     # 对话式编辑 ⭐
│   │   └── finalize.ts      # 终稿生成
│   └── shared/              # 共享模块
└── esa.config.json          # ESA Pages 配置
```

## 🎯 核心功能实现

### AI 对话式编辑流程

```
1. 用户在对话框输入自然语言，如"让第一条工作经历更突出成果"
2. AI 理解意图，定位到 experience.0.bullets
3. AI 返回修改建议，包含原文和建议内容
4. 用户点击 [接受] 应用修改，或 [拒绝] 放弃
5. 支持撤销，可恢复到修改前状态
```

### AI 建议流程

```
1. 用户点击 [AI 优化] 按钮
2. 前端构建结构化简历数据（保留原始索引）
3. 调用 /api/rewrite-suggestions
4. AI 返回 suggestions 数组，每条包含：
   - path: "experience.0.bullets.1"
   - original: 原文
   - suggested: 改写建议
   - reason: 改写原因
5. 预览区通过 path 匹配，内联显示 Diff
6. 用户可逐条接受/拒绝，或批量操作
```

### 隐私保护机制

```
用户输入 → 前端脱敏 → 边缘函数二次脱敏 → AI API
                ↓
        本地存储（原始数据）
```

## 📝 开发计划

- [x] 基础简历编辑器
- [x] AI 智能改写建议
- [x] Diff 内联显示
- [x] 预览区直接编辑
- [x] AI 对话式编辑
- [x] 快捷操作按钮
- [x] 撤销/重做支持
- [x] 页面溢出智能提示
- [ ] 多模板支持（进行中）
- [ ] 简历评分系统
- [ ] 导出 Word 格式
- [ ] 多语言支持

## 📚 文档

详细文档请查看 [docs](./docs/) 目录：
- [UI 设计规范](./docs/ui-design-prompt.md)
- [模板系统设计](./docs/TEMPLATE_SYSTEM_DESIGN.md)
- [设计更新日志](./docs/DESIGN_UPDATES.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

<p align="center">
  Made with ❤️ for job seekers
</p>
