# Implementation Plan: ResumeBoost

## Overview

基于 React + TypeScript + Tailwind CSS 构建简历优化工具，部署到阿里云 ESA Pages。采用渐进式实现：先搭建核心框架和路由，再实现各功能模块，最后集成边缘函数。

## Tasks

- [x] 1. 项目基础设施搭建
  - [x] 1.1 配置路由和页面结构
    - 安装 react-router-dom
    - 创建 `/`、`/builder`、`/app` 三个路由
    - 创建基础页面组件骨架
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 配置 Tailwind CSS 和基础样式
    - 配置 Tailwind 主题色和打印样式
    - 创建 `@media print` 样式规则
    - 设置 A4 页面尺寸和边距
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 1.3 创建通用 UI 组件
    - Toast 消息提示组件
    - LoadingSkeleton 加载骨架屏
    - TabNav 标签页导航
    - _Requirements: 5.5, 10.1, 10.2, 10.3, 10.4_

- [-] 2. 核心服务模块实现
  - [x] 2.1 实现脱敏服务 (masking.ts)
    - 实现手机号、邮箱、身份证、地址行的正则匹配
    - 实现 mask() 函数生成占位符和映射表
    - 实现 unmask() 函数还原原文
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.2 编写脱敏服务属性测试
    - **Property 5: Sensitive Information Masking**
    - **Property 6: Masking Round-Trip**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [x] 2.3 实现输入验证模块 (validation.ts)
    - 实现文本长度验证函数
    - 实现表单必填字段验证函数
    - 实现技能字符串处理函数（trim + 去重）
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 2.5_

  - [ ]* 2.4 编写验证模块属性测试
    - **Property 1: Skills Deduplication and Trimming**
    - **Property 11: Input Length Validation**
    - **Property 12: Form Required Field Validation**
    - **Validates: Requirements 2.5, 12.1, 12.2, 12.3, 12.5**

  - [-] 2.5 实现会话存储服务 (session.ts)
    - 实现 save/load/clear 函数
    - 存储 resumeText、jdText、appliedRewrites、maskingMap
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 2.6 实现 API 客户端 (api.ts)
    - 实现统一的 fetchJson 函数
    - 实现错误处理和状态码映射
    - 实现 analyze/match/rewrite/finalize 四个 API 调用函数
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 3. Checkpoint - 核心服务模块完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 4. PDF 提取模块实现
  - [ ] 4.1 实现 PDF 提取服务 (pdf.ts)
    - 安装配置 pdfjs-dist
    - 实现文件验证函数（大小、页数限制）
    - 实现文本提取函数（逐页提取、空行分隔）
    - 实现提取结果验证（长度 < 30 判定为扫描件）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 编写 PDF 提取属性测试
    - **Property 3: PDF File Validation**
    - **Property 4: Extracted Text Length Threshold**
    - **Validates: Requirements 3.1, 3.4**

- [ ] 5. Landing Page 实现
  - [ ] 5.1 实现入口页面组件
    - 创建两个入口卡片："我有简历" / "我没有简历"
    - 实现导航跳转逻辑
    - 添加隐私声明文案
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 5.2 编写 Landing Page 单元测试
    - 测试两个按钮渲染
    - 测试导航跳转
    - 测试隐私声明显示
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6. Builder Page 实现
  - [ ] 6.1 实现表单数据模型和状态管理
    - 定义 BasicInfo、EducationEntry、ExperienceEntry、ProjectEntry 类型
    - 实现表单状态 hook
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 6.2 实现表单 UI 组件
    - 基本信息表单区
    - 教育经历动态列表（可添加/删除）
    - 工作经历动态列表
    - 项目经历动态列表
    - 技能输入框
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 6.3 实现 Markdown 生成逻辑
    - 实现 formToMarkdown() 函数
    - 遵循 Simple_V1_Template 结构
    - 集成脱敏服务
    - _Requirements: 2.6_

  - [ ]* 6.4 编写 Builder 属性测试
    - **Property 2: Form to Markdown Generation**
    - **Validates: Requirements 2.6**

  - [ ] 6.5 实现表单提交和跳转
    - 验证必填字段
    - 生成 Markdown 并存入 sessionStorage
    - 跳转到 /app
    - _Requirements: 2.7, 12.5_

- [ ] 7. Checkpoint - 前端页面基础完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 8. Workspace Page - 输入区实现
  - [ ] 8.1 实现输入面板组件
    - PDF 上传区（拖拽 + 点击选择）
    - 简历文本框（Markdown/纯文本）
    - JD 文本框
    - 脱敏开关
    - _Requirements: 3.5, 4.6, 4.7_

  - [ ] 8.2 实现操作按钮组
    - "一键分析" 按钮（resumeText 非空时可用）
    - "ATS 匹配" 按钮（jdText 非空时可用）
    - "清空" 按钮
    - _Requirements: 5.4, 6.6, 11.3_

  - [ ] 8.3 集成 PDF 提取功能
    - 文件选择后调用 PDF 提取
    - 成功后填充简历文本框
    - 失败时显示错误提示
    - _Requirements: 3.2, 3.4, 3.5_

- [ ] 9. Workspace Page - 结果区实现
  - [ ] 9.1 实现诊断结果 Tab
    - 展示 issues 列表（最多 10 条）
    - 展示 actions 列表（最多 10 条）
    - 展示 examples（可选）
    - _Requirements: 5.2, 5.3_

  - [ ]* 9.2 编写诊断结果属性测试
    - **Property 7: Diagnosis Result Constraints**
    - **Validates: Requirements 5.2, 5.3**

  - [ ] 9.3 实现匹配结果 Tab
    - 展示匹配分数（0-100）
    - 展示缺失关键词（10-20 个）
    - 展示命中关键词（最多 20 个）
    - 展示说明文字
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.4 编写匹配结果属性测试
    - **Property 8: Match Result Constraints**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [ ] 9.5 实现改写 Tab
    - 待改写文本输入框
    - 生成两版改写按钮
    - 保守版/强化版并排展示
    - 采用/复制按钮
    - 已采用改写列表（支持删除）
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [ ]* 9.6 编写改写结构保持属性测试
    - **Property 9: Rewrite Structure Preservation**
    - **Validates: Requirements 7.3**

  - [ ] 9.7 实现终稿 Tab
    - 生成终稿按钮
    - HTML 预览区域
    - 打印/导出 PDF 按钮
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* 9.8 编写终稿输出属性测试
    - **Property 10: Finalize Output Validation**
    - **Validates: Requirements 8.3, 8.4**

- [ ] 10. Checkpoint - 前端功能完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 11. 边缘函数实现
  - [ ] 11.1 创建边缘函数项目结构
    - 创建 functions/ 目录
    - 配置 ESA Pages 边缘函数入口
    - _Requirements: 10.5_

  - [ ] 11.2 实现 /api/analyze 边缘函数
    - 请求验证和二次脱敏
    - 调用 AI 模型
    - 响应格式化
    - _Requirements: 5.1, 4.8_

  - [ ] 11.3 实现 /api/match 边缘函数
    - 请求验证
    - 调用 AI 模型
    - 响应格式化
    - _Requirements: 6.1_

  - [ ] 11.4 实现 /api/rewrite 边缘函数
    - 请求验证
    - 调用 AI 模型（conservative/strong）
    - 响应格式化
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ] 11.5 实现 /api/finalize 边缘函数
    - 请求验证
    - 调用 AI 模型
    - 生成 Markdown 和 HTML
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 11.6 实现限流中间件
    - 基于 IP + route 的限流
    - 返回 429 + Retry-After
    - _Requirements: 10.5_

- [ ] 12. 集成测试和最终验收
  - [ ] 12.1 端到端流程测试
    - Builder → Workspace 流程
    - PDF 上传 → 分析 → 改写 → 终稿流程
    - 脱敏开关切换测试
    - _Requirements: 全部_

  - [ ] 12.2 打印导出测试
    - Chrome/Edge 打印预览
    - A4 排版验证
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Final Checkpoint - 项目完成
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 标记 `*` 的任务为可选测试任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以便追溯
- Checkpoint 任务用于阶段性验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次
- 边缘函数部分需要根据阿里云 ESA Pages 的具体 API 进行调整
