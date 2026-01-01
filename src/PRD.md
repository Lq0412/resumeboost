# ResumeBoost PRD（MVP）& 开发规格说明

- 项目代号：ResumeBoost
- 文档版本：v0.2（可直接用于开发）
- 更新日期：2026-01-01

## 0. 概览

### 0.1 产品定位
一个免费简历优化工具站，同时覆盖两类用户：
- 已有简历的人：上传 PDF 或粘贴文本 → 提取内容 → 分析/匹配/改写 → 生成终稿
- 没有简历的人：用极简表单生成初稿 → 进入同样的优化流程

最终产出：ATS 友好的一页投递版简历（A4），支持打印导出 PDF。

### 0.2 关键原则（MVP 必须遵守）
- ATS 友好：单栏、可复制文本、无表格/无图标/无多栏、避免花哨排版
- 一页为主：默认目标 A4 一页；超长提示但不强制截断用户内容
- 不新增事实：只允许润色、重排、强化表达；需要量化时用占位符 `X%/X+` 并提示用户替换
- 隐私默认：默认脱敏；模型调用不接触未脱敏敏感信息（见“脱敏规范”）
- 无账号/无付费/无后端持久化：不在服务端保存简历内容；仅浏览器会话内存/会话存储
- 可用性优先：用户 3 分钟内完成一轮“输入→分析→终稿”

### 0.3 术语
- `resume_text`：简历全文（Markdown 或纯文本）
- `jd_text`：招聘 JD 文本（可选）
- “脱敏”：把手机号/邮箱/身份证/地址行替换为占位符，并保留可逆映射
- “采用改写”：用户选择将某段 `source_text` 的改写纳入终稿生成

## 1. MVP 范围与约束

### 1.1 P0（MVP 必做）
#### 1.1.1 输入方式
- A. 上传 PDF（仅支持“可复制文本”的 PDF）→ 前端提取文本 → 自动填入简历编辑框
- B. 粘贴简历文本/Markdown
- C. 极简表单生成初稿（无简历用户）→ 跳转 `/app` 自动填充

#### 1.1.2 核心能力
- 诊断报告：问题清单 + 可执行建议 + 示例（可选）
- ATS 匹配：有 JD 时输出匹配度（0–100）+ 缺失关键词（10–20）
- 经历改写：对用户选段输出保守版/强化版两版
- 终稿生成：基于简历全文 + 已采用改写生成 `simple_v1` 终稿（Markdown + HTML）
- 打印导出：`window.print()` 导出 PDF（排版不崩）

#### 1.1.3 隐私与安全
- 默认脱敏（手机号/邮箱/身份证/地址行）
- AI 调用必须走 `/api/*`（边缘/Serverless 隐藏 Key）
- 简单限流（按 IP / route，返回 429 + Retry-After）
- 前端不出现任何模型 API Key；后端日志不得记录原始文本

### 1.2 明确不做（MVP）
- 扫描版/图片型 PDF 的 OCR
- 登录/账户/付费/数据库持久化与历史版本
- 复杂在线富文本编辑器
- 多模板花哨排版（MVP 只做 1 套 `simple_v1`）
- 简历图片上传识别、附件管理

## 2. 用户画像与用户故事

### 2.1 Persona A：已有简历的求职者
- 目标：快速得到更 ATS 友好、更贴合 JD 的投递版简历
- 痛点：简历冗长、表达弱、关键词缺失、ATS 通过率低

### 2.2 Persona B：无简历的求职者
- 目标：用最少信息生成可用简历，然后逐步优化
- 痛点：不知道结构、不知道写法、难以表达成果

### 2.3 核心用户故事（P0）
- 用户可以上传/粘贴简历文本并得到诊断建议
- 用户提供 JD 后可以看到匹配分数与缺失关键词
- 用户可以改写某段经历，选择“采用”并用于生成终稿
- 用户可以生成一页终稿并打印导出 PDF
- 用户默认看到脱敏内容，且模型调用不接触敏感信息

## 3. 信息架构（路由）与导航

### 3.1 路由
- `/`：入口页（Landing）
- `/builder`：生成器（无简历用户）
- `/app`：工作台（核心）

### 3.2 跳转与数据携带（P0 决策）
- `/builder` → `/app`：使用 `sessionStorage` 携带 `resume_text`（关闭标签页即清除）；实现允许退化为路由 state
- `/app` 刷新：若 sessionStorage 存在则自动恢复；否则保持空

## 4. 页面与交互规格

### 4.1 入口页（`/`）
两张卡片/两个按钮：
- 我有简历 → 进入工作台（`/app`），默认显示“PDF上传/粘贴”
- 我没有简历 → 进入生成器（`/builder`）

页面文案（必须出现）：
- 默认脱敏
- AI 仅供参考
- 不在服务端保存简历内容（仅浏览器会话内）

### 4.2 生成器（`/builder`）
#### 4.2.1 表单字段（最小集）
基本信息：
- 姓名（可选，1–50 字符）
- 手机（必填）
- 邮箱（必填）
- 城市（可选）

教育（可多条）：
- 学校（必填）
- 专业（可选）
- 学历（可选）
- 时间（必填）

经历（可多条）：
- 公司（必填）/岗位（必填）/时间（必填）
- bullet 列表（必填，1–5 行，每行 ≤ 200 字）

项目（可多条）：
- 项目名（必填）/角色（可选）/时间（可选）
- bullet 列表（必填，1–5 行）

技能：
- 技能字符串列表（必填，逗号分隔，trim+去重）

#### 4.2.2 输出规则（点击“生成初稿”）
- 生成 `resume_text`（Markdown，结构见 7.1）
- 默认按脱敏开关展示（默认开）
- 写入 `sessionStorage` 并跳转 `/app` 自动填充

### 4.3 工作台（`/app`）
#### 4.3.1 左侧：输入区
PDF 上传区：
- 选择文件 → 提取文本 → 填充到“简历文本框”
- 提示：仅支持可复制文本的 PDF；扫描版不支持

简历文本框（必填）：
- 支持 Markdown/纯文本
- 建议上限：20,000 字符（超出提示并阻止调用 API）

JD 文本框（可选）：
- 建议上限：10,000 字符

脱敏开关（默认开）：
- 开：编辑区/预览/导出都显示占位符
- 关：编辑区/预览/导出显示原文；但 API 调用仍发送脱敏文本（见 6.4）

操作按钮：
- 一键分析（调用 `/api/analyze`）：resume_text 非空才可用
- ATS 匹配（调用 `/api/match`）：JD 非空才可用
- 清空：清空输入、结果与 sessionStorage

#### 4.3.2 右侧：结果区（Tabs）
Tab1 诊断：
- 展示 `issues`（最多 10 条）+ `actions`（最多 10 条）+ `examples`（可选，最多 5 条）

Tab2 匹配：
- 显示 `score`（0–100）
- `missing_keywords`（10–20）
- `hit_keywords`（可选，≤ 20）
- `notes`（一句话解释）

Tab3 改写：
- “待改写文本框”（用户粘贴/从简历复制，建议 1–8 行）
- 按钮：生成两版改写（分别请求 `/api/rewrite`：`style=conservative|strong`）
- 输出：保守版/强化版 + 按钮：采用/复制
- 已采用改写列表（用于终稿生成）：支持删除/撤销

Tab4 终稿：
- 按钮：生成终稿（调用 `/api/finalize`）
- 渲染 `final_html`（用于打印）
- 按钮：打印/导出 PDF（`window.print()`）

#### 4.3.3 统一状态与错误处理
- Loading：按钮禁用 + skeleton
- 网络错误：toast “网络异常，请重试”
- 400：toast 展示 `error.message`
- 429：toast “请求过于频繁，请稍后再试（{retry_after_sec}s）”
- 5xx：toast “服务异常，请稍后重试”

## 5. PDF 文本提取规范（前端）
- 推荐库：`pdfjs-dist`
- 限制：≤ 10MB、≤ 10 页（超出提示并拒绝解析）
- 提取策略：逐页提取 textContent，按行合并，页与页之间空行分隔
- 失败判定：去空白后长度 < 30 视为失败（可能为扫描件/图片型）
- 失败提示：提示“可能为扫描件 PDF，请改用粘贴文本/生成初稿”

## 6. 脱敏规范（MVP）

### 6.1 目标
- 默认不让模型/第三方看到手机号、邮箱、身份证号、地址行等敏感信息
- 保留简历结构，保证分析/改写/排版可用

### 6.2 占位符与映射（必须可逆）
占位符格式：
- 手机：`[PHONE_1]`、`[PHONE_2]`...
- 邮箱：`[EMAIL_1]`...
- 身份证：`[ID_1]`...
- 地址行：`[ADDRESS_1]`...

前端生成并保存映射表（仅会话内）：
- `token -> original`（用于反脱敏导出）
- `original -> token`（用于去重）

### 6.3 脱敏规则（建议实现）
- Email：常见邮箱格式 → `[EMAIL_n]`
- 手机：
  - 中国手机：`1[3-9]\\d{9}`
  - 泛化电话：`\\+?\\d[\\d\\s-]{7,}\\d`（注意避免误伤年份/日期）
- 身份证：`\\d{15}` 或 `\\d{17}[\\dXx]`
- 地址行：按“行”处理；若该行含地址关键字（省/市/区/县/路/街/号/楼/室等）且包含数字，则整行替换为 `[ADDRESS_n]`

### 6.4 开关语义（P0 决策）
- API 发送：始终发送脱敏后的文本（无论开关）
- UI/导出展示：
  - 开（默认）：展示脱敏文本
  - 关：展示原文；导出前对 `final_markdown/final_html` 执行反脱敏替换
- 边缘函数二次脱敏：在调用模型前再次执行同样的脱敏（防止前端漏脱敏）

## 7. 文本格式规范

### 7.1 `resume_text`（Markdown）推荐结构（`simple_v1` 语义）
终稿与生成器输出尽量遵循以下结构（字段为空则省略）：
- 顶部：姓名（可选）
- 联系方式：手机、邮箱、城市（同一行或多行均可）
- `## Summary`（可选，2–3 行）
- `## Skills`（逗号或 bullet 列表）
- `## Experience`（每段：公司｜岗位｜时间；下方 1–5 条 bullet）
- `## Projects`（同上）
- `## Education`（学校｜专业｜学历｜时间）

ATS 约束：
- 禁止 Markdown 表格
- 禁止多栏/装饰性符号/Emoji
- bullet 统一使用 `- `

### 7.2 JD 文本要求
- 纯文本粘贴；不要求结构
- 超长（>10k）提示用户只保留“职责/要求/加分项”

## 8. API（边缘/Serverless）规格（4 个接口）
统一：POST JSON；错误返回 `{ "error": { "code", "message", "..." } }`（`error` 至少包含 `code/message`，可额外包含 `retry_after_sec` 等字段）。

### 8.1 通用约定
- Base URL：同域 `/api/*`
- Method：`POST`
- Request Header：`Content-Type: application/json`
- 成功：HTTP 200
- 返回字段稳定：数组字段无数据时返回空数组（不省略字段），减少前端分支
- 脱敏 token：`mask_enabled=true` 时输出必须原样保留 `[PHONE_1]` 等占位符，不尝试补全/猜测
- 错误码（建议）：
  - `BAD_REQUEST`（400）
  - `PAYLOAD_TOO_LARGE`（413）
  - `RATE_LIMITED`（429，建议包含 `retry_after_sec`）
  - `MODEL_ERROR`（502）
  - `INTERNAL_ERROR`（500）
- 输入长度建议：
  - `resume_text`：1–20,000 字符
  - `jd_text`：0–10,000 字符
  - `source_text`：1–3,000 字符
- `lang`：`auto | zh | en`（默认 `auto`）

### 8.2 /api/analyze
输入：`resume_text, jd_text?, lang, mask_enabled`

Request：
```json
{
  "resume_text": "string",
  "jd_text": "string | null",
  "lang": "auto | zh | en",
  "mask_enabled": true
}
```

输出：
```json
{
  "issues": [
    { "title": "string", "why": "string", "how": "string", "example": { "before": "string", "after": "string" } }
  ],
  "actions": ["string"],
  "examples": [{ "before": "string", "after": "string" }]
}
```

约束：
- `issues` ≤ 10；每条必须可执行，避免空泛
- `actions` ≤ 10；建议以动词开头
- `issues[].example` 可选；`examples` 可为空数组

### 8.3 /api/match（必须有 JD）
输入：`resume_text, jd_text, lang`

输出：
```json
{
  "score": 0,
  "missing_keywords": ["string"],
  "hit_keywords": ["string"],
  "notes": "string"
}
```

约束：
- `score` 为整数 0–100
- `missing_keywords` 10–20，去重并按重要性排序
- `hit_keywords` ≤ 20（无则空数组）
- `notes` 一句话解释

### 8.4 /api/rewrite
输入：`source_text, jd_text?, style=conservative|strong, lang, constraints`

Request：
```json
{
  "source_text": "string",
  "jd_text": "string | null",
  "style": "conservative | strong",
  "lang": "auto | zh | en",
  "constraints": {
    "no_new_facts": true,
    "ats_friendly": true,
    "keep_bullets": true
  }
}
```

输出：
```json
{
  "rewritten_text": "string",
  "cautions": ["string"]
}
```

约束：
- 必须保持结构（输入为 bullet 列表则输出也为 bullet 列表）
- `conservative`：贴近原文，主要优化表达
- `strong`：更强调影响力；若需量化但原文无数据，用 `X%/X+` 并在 `cautions` 提醒替换
- 禁止编造事实/数据/时间

### 8.5 /api/finalize
输入：`resume_text, applied_rewrites[], lang, template=simple_v1, mask_enabled`

Request：
```json
{
  "resume_text": "string",
  "applied_rewrites": [
    { "id": "string", "before_text": "string", "after_text": "string", "style": "conservative | strong" }
  ],
  "lang": "auto | zh | en",
  "template": "simple_v1",
  "mask_enabled": true
}
```

输出：
```json
{
  "final_markdown": "string",
  "final_html": "string"
}
```

约束：
- 输出必须符合“一页为主”“ATS 友好”“不新增事实”
- `applied_rewrites.after_text` 的表达应优先融入合理位置；无法定位时不得崩溃，允许以合理方式合并
- `final_html` 不包含外链脚本；打印样式由前端 `@media print` 控制（或内联极少量安全样式）

## 9. 限流（MVP 默认策略）
- 维度：IP + route
- 建议阈值（可调整）：
  - `/api/analyze`：10 次/分钟
  - `/api/match`：20 次/分钟
  - `/api/rewrite`：20 次/分钟
  - `/api/finalize`：10 次/分钟
- 429 返回建议：
  - Header：`Retry-After: <seconds>`
  - Body：`{ "error": { "code": "RATE_LIMITED", "message": "...", "retry_after_sec": 12 } }`

## 10. 前端实现建议（React + TS + Tailwind，非强制）
- 路由：建议引入 `react-router-dom` 实现 `/`、`/builder`、`/app`
- PDF 提取：建议引入 `pdfjs-dist`，只在浏览器侧解析
- 校验：可用轻量函数或引入 `zod`（可选）
- 代码组织建议：
  - `src/routes/*`：Landing / Builder / AppWorkbench
  - `src/lib/api.ts`：`fetchJson` + 统一错误处理
  - `src/lib/masking.ts`：脱敏/反脱敏与映射
  - `src/lib/pdf.ts`：PDF 提取

## 11. 打印与样式（`simple_v1`）
- 终稿区域加 `.print-area`
- `@media print`：隐藏非 `.print-area` 内容；黑字白底；避免深色主题影响打印
- 建议：`@page { size: A4; margin: 12mm; }`；正文 10.5–11pt；行高 1.2–1.35
- 兼容：Chrome/Edge（P0）

## 12. 验收标准（做到即可提交）
- `/builder` 能生成初稿并跳转 `/app` 自动填充
- `/app` 支持 PDF（可复制文本）提取并填充简历框；失败有明确提示
- 简历文本 → 一键分析返回诊断结果并展示
- 简历 + JD → ATS 匹配返回分数与缺失关键词
- 改写两版可生成，支持“采用/撤销”，终稿能体现已采用改写
- 终稿可预览并 `window.print()` 导出 PDF（排版不崩）
- 默认脱敏生效；前端不出现任何模型 API Key
- 限流触发时能看到明确提示（429）

## 13. 待确认（不阻塞开发，默认按本文执行）
- 部署平台（Vercel / Cloudflare / Netlify）与函数目录结构
- 模型选择、成本控制与失败重试策略
