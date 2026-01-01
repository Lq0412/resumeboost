# Requirements Document

## Introduction

ResumeBoost 是一个免费的简历优化工具站，部署于阿里云 ESA Pages 边缘计算平台。产品覆盖两类用户：已有简历的求职者（上传 PDF 或粘贴文本）和无简历的求职者（表单生成初稿）。最终产出 ATS 友好的一页 A4 投递版简历，支持打印导出 PDF。

核心原则：
- ATS 友好：单栏、可复制文本、无表格/图标/多栏
- 一页为主：默认目标 A4 一页
- 不新增事实：只允许润色、重排、强化表达
- 隐私默认：默认脱敏，模型调用不接触未脱敏敏感信息
- 无账号/无付费/无后端持久化：仅浏览器会话存储

## Glossary

- **Resume_Text**: 简历全文（Markdown 或纯文本格式）
- **JD_Text**: 招聘职位描述文本（可选输入）
- **Masking_System**: 脱敏系统，将敏感信息替换为占位符并保留可逆映射
- **PDF_Extractor**: PDF 文本提取模块，从可复制文本的 PDF 中提取内容
- **Diagnosis_Engine**: 诊断引擎，分析简历问题并提供建议
- **Match_Engine**: 匹配引擎，计算简历与 JD 的匹配度
- **Rewrite_Engine**: 改写引擎，生成经历段落的保守版/强化版改写
- **Finalize_Engine**: 终稿引擎，生成最终简历 Markdown 和 HTML
- **Applied_Rewrite**: 用户已采用的改写，用于终稿生成
- **Simple_V1_Template**: MVP 唯一的简历模板，ATS 友好的单栏布局

## Requirements

### Requirement 1: Landing Page Navigation

**User Story:** As a user, I want to choose my entry path on the landing page, so that I can access the appropriate workflow based on whether I have an existing resume.

#### Acceptance Criteria

1. WHEN a user visits the landing page (`/`) THEN the Landing_Page SHALL display two distinct entry options: "我有简历" and "我没有简历"
2. WHEN a user clicks "我有简历" THEN the Landing_Page SHALL navigate to the workspace (`/app`)
3. WHEN a user clicks "我没有简历" THEN the Landing_Page SHALL navigate to the builder (`/builder`)
4. THE Landing_Page SHALL display privacy notices including: default masking enabled, AI suggestions are for reference only, and no server-side resume storage

### Requirement 2: Resume Builder Form

**User Story:** As a user without a resume, I want to fill out a simple form to generate an initial resume draft, so that I can start the optimization workflow.

#### Acceptance Criteria

1. THE Builder_Form SHALL collect basic information: name (optional, 1-50 chars), phone (required), email (required), city (optional)
2. THE Builder_Form SHALL collect education entries (multiple allowed): school (required), major (optional), degree (optional), time period (required)
3. THE Builder_Form SHALL collect experience entries (multiple allowed): company (required), position (required), time period (required), bullet points (required, 1-5 items, each ≤200 chars)
4. THE Builder_Form SHALL collect project entries (multiple allowed): project name (required), role (optional), time period (optional), bullet points (required, 1-5 items)
5. THE Builder_Form SHALL collect skills as a comma-separated string (required), with automatic trim and deduplication
6. WHEN a user submits the form THEN the Builder_Form SHALL generate Resume_Text in Markdown format following Simple_V1_Template structure
7. WHEN Resume_Text is generated THEN the Builder_Form SHALL store it in sessionStorage and navigate to `/app` with auto-fill

### Requirement 3: PDF Text Extraction

**User Story:** As a user with an existing PDF resume, I want to upload it and have the text extracted, so that I can use it for optimization.

#### Acceptance Criteria

1. WHEN a user uploads a PDF file THEN the PDF_Extractor SHALL validate file size ≤10MB and page count ≤10
2. IF the PDF file exceeds size or page limits THEN the PDF_Extractor SHALL display an error message and reject the file
3. WHEN a valid PDF is uploaded THEN the PDF_Extractor SHALL extract text content page by page, joining pages with blank line separators
4. IF the extracted text (after trimming whitespace) has length <30 characters THEN the PDF_Extractor SHALL display a warning suggesting the PDF may be a scanned image and recommend using text paste or builder instead
5. WHEN text extraction succeeds THEN the PDF_Extractor SHALL populate the resume text input field with the extracted content

### Requirement 4: Sensitive Information Masking

**User Story:** As a user, I want my sensitive information to be automatically masked, so that my privacy is protected when AI processes my resume.

#### Acceptance Criteria

1. THE Masking_System SHALL detect and replace phone numbers (Chinese mobile: `1[3-9]\d{9}`, international: `\+?\d[\d\s-]{7,}\d`) with tokens `[PHONE_n]`
2. THE Masking_System SHALL detect and replace email addresses with tokens `[EMAIL_n]`
3. THE Masking_System SHALL detect and replace ID card numbers (15 digits or 17 digits + check digit) with tokens `[ID_n]`
4. THE Masking_System SHALL detect and replace address lines (lines containing address keywords like 省/市/区/县/路/街/号/楼/室 with numbers) with tokens `[ADDRESS_n]`
5. THE Masking_System SHALL maintain a bidirectional mapping (token↔original) in session memory for reversible masking
6. WHEN masking toggle is ON (default) THEN the Workspace SHALL display masked text in editor, preview, and export
7. WHEN masking toggle is OFF THEN the Workspace SHALL display original text in UI but still send masked text to API calls
8. THE Masking_System SHALL apply secondary masking in edge functions before calling AI models

### Requirement 5: Resume Diagnosis

**User Story:** As a user, I want to analyze my resume and get actionable improvement suggestions, so that I can identify and fix issues.

#### Acceptance Criteria

1. WHEN a user clicks "一键分析" with non-empty Resume_Text THEN the Diagnosis_Engine SHALL call `/api/analyze` with masked resume text
2. WHEN `/api/analyze` returns successfully THEN the Diagnosis_Engine SHALL display up to 10 issues, each with title, why, how, and optional example (before/after)
3. WHEN `/api/analyze` returns successfully THEN the Diagnosis_Engine SHALL display up to 10 actionable suggestions starting with verbs
4. IF Resume_Text is empty THEN the "一键分析" button SHALL be disabled
5. WHILE the API call is in progress THEN the Workspace SHALL display loading state with disabled button and skeleton UI

### Requirement 6: JD Matching Analysis

**User Story:** As a user, I want to see how well my resume matches a job description, so that I can identify missing keywords and improve my chances.

#### Acceptance Criteria

1. WHEN a user clicks "ATS 匹配" with non-empty JD_Text THEN the Match_Engine SHALL call `/api/match` with masked resume and JD text
2. WHEN `/api/match` returns successfully THEN the Match_Engine SHALL display a match score (0-100)
3. WHEN `/api/match` returns successfully THEN the Match_Engine SHALL display 10-20 missing keywords sorted by importance
4. WHEN `/api/match` returns successfully THEN the Match_Engine SHALL display up to 20 hit keywords (if any)
5. WHEN `/api/match` returns successfully THEN the Match_Engine SHALL display a one-sentence explanation note
6. IF JD_Text is empty THEN the "ATS 匹配" button SHALL be disabled

### Requirement 7: Experience Rewriting

**User Story:** As a user, I want to rewrite specific sections of my resume in different styles, so that I can choose the best version for my final resume.

#### Acceptance Criteria

1. WHEN a user enters source text (1-8 lines recommended) and clicks rewrite THEN the Rewrite_Engine SHALL call `/api/rewrite` twice with style=conservative and style=strong
2. WHEN `/api/rewrite` returns successfully THEN the Rewrite_Engine SHALL display both conservative and strong versions side by side
3. THE Rewrite_Engine SHALL preserve the original structure (bullet list input produces bullet list output)
4. WHEN the strong version requires quantification without source data THEN the Rewrite_Engine SHALL use placeholders `X%/X+` and include a caution message
5. WHEN a user clicks "采用" on a rewrite THEN the Workspace SHALL add it to the Applied_Rewrite list for finalization
6. THE Workspace SHALL allow users to remove items from the Applied_Rewrite list

### Requirement 8: Final Resume Generation

**User Story:** As a user, I want to generate a polished final resume incorporating my chosen rewrites, so that I can export a professional document.

#### Acceptance Criteria

1. WHEN a user clicks "生成终稿" THEN the Finalize_Engine SHALL call `/api/finalize` with Resume_Text, Applied_Rewrite list, and mask_enabled flag
2. WHEN `/api/finalize` returns successfully THEN the Finalize_Engine SHALL display the final resume in HTML format for preview
3. THE Finalize_Engine SHALL generate output following Simple_V1_Template: single column, no tables, no icons, no multi-column layout
4. THE Finalize_Engine SHALL incorporate Applied_Rewrite items into appropriate positions in the final resume
5. WHEN a user clicks "打印/导出 PDF" THEN the Workspace SHALL trigger `window.print()` with proper A4 print styles

### Requirement 9: Print and Export

**User Story:** As a user, I want to export my final resume as a PDF, so that I can submit it to job applications.

#### Acceptance Criteria

1. THE Print_System SHALL apply `@media print` styles to hide non-resume content during printing
2. THE Print_System SHALL use A4 page size with 12mm margins
3. THE Print_System SHALL use 10.5-11pt font size with 1.2-1.35 line height
4. THE Print_System SHALL ensure black text on white background regardless of theme
5. WHEN masking is OFF during export THEN the Print_System SHALL apply reverse masking to restore original sensitive information in the output

### Requirement 10: Error Handling and Rate Limiting

**User Story:** As a user, I want clear feedback when errors occur or rate limits are hit, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the Workspace SHALL display toast message "网络异常，请重试"
2. WHEN API returns 400 THEN the Workspace SHALL display toast with the error message from response
3. WHEN API returns 429 THEN the Workspace SHALL display toast "请求过于频繁，请稍后再试（{retry_after_sec}s）"
4. WHEN API returns 5xx THEN the Workspace SHALL display toast "服务异常，请稍后重试"
5. THE Edge_Functions SHALL implement rate limiting: analyze (10/min), match (20/min), rewrite (20/min), finalize (10/min) per IP

### Requirement 11: Session Data Management

**User Story:** As a user, I want my work to persist within my browser session, so that I don't lose progress if I navigate away temporarily.

#### Acceptance Criteria

1. THE Workspace SHALL store Resume_Text, JD_Text, and Applied_Rewrite list in sessionStorage
2. WHEN the `/app` page loads THEN the Workspace SHALL restore data from sessionStorage if available
3. WHEN a user clicks "清空" THEN the Workspace SHALL clear all inputs, results, and sessionStorage data
4. WHEN the browser tab is closed THEN all session data SHALL be automatically cleared (sessionStorage behavior)

### Requirement 12: Input Validation

**User Story:** As a user, I want the system to validate my inputs, so that I don't waste API calls on invalid data.

#### Acceptance Criteria

1. THE Workspace SHALL enforce Resume_Text maximum length of 20,000 characters
2. THE Workspace SHALL enforce JD_Text maximum length of 10,000 characters
3. THE Rewrite_Engine SHALL enforce source_text maximum length of 3,000 characters
4. IF input exceeds length limits THEN the Workspace SHALL display a warning and prevent API calls
5. THE Builder_Form SHALL validate required fields before allowing form submission
