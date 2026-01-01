# Design Document: ResumeBoost

## Overview

ResumeBoost 是一个部署在阿里云 ESA Pages 边缘计算平台的简历优化工具。采用前后端分离架构：前端使用 React + TypeScript + Tailwind CSS，后端使用 ESA Pages 边缘函数处理 AI 调用。

### 技术栈
- **前端框架**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS
- **路由**: React Router DOM v6
- **PDF 解析**: pdfjs-dist
- **边缘函数**: 阿里云 ESA Pages Edge Functions
- **AI 模型**: 通过边缘函数调用（隐藏 API Key）

### 设计原则
1. **边缘优先**: AI 调用在边缘函数执行，降低延迟
2. **隐私保护**: 敏感信息脱敏后才发送到 AI
3. **无状态**: 不依赖服务端存储，仅使用 sessionStorage
4. **渐进增强**: 核心功能不依赖 JavaScript 以外的特性

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Landing  │  │ Builder  │  │         Workspace            │  │
│  │   (/)    │  │(/builder)│  │          (/app)              │  │
│  └────┬─────┘  └────┬─────┘  │  ┌────────┐ ┌────────────┐  │  │
│       │             │        │  │ Input  │ │  Results   │  │  │
│       │             │        │  │ Panel  │ │   Panel    │  │  │
│       └─────────────┼────────┤  └────────┘ └────────────┘  │  │
│                     │        └──────────────────────────────┘  │
│                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Shared Services                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐  │  │
│  │  │ Masking │ │   PDF   │ │   API   │ │ Session Store │  │  │
│  │  │ Service │ │ Extract │ │ Client  │ │    Service    │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └───────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Alibaba Cloud ESA Pages                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Edge Functions                         │  │
│  │  ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │  │
│  │  │ /api/      │ │ /api/     │ │ /api/     │ │ /api/   │ │  │
│  │  │ analyze    │ │ match     │ │ rewrite   │ │finalize │ │  │
│  │  └─────┬──────┘ └─────┬─────┘ └─────┬─────┘ └────┬────┘ │  │
│  │        │              │             │            │       │  │
│  │        └──────────────┴─────────────┴────────────┘       │  │
│  │                         │                                 │  │
│  │                    Rate Limiter                           │  │
│  │                         │                                 │  │
│  │                  Secondary Masking                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                      AI Model Provider                           │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Page Components

#### 1.1 LandingPage (`/`)
```typescript
interface LandingPageProps {}

// 职责：展示入口选项，导航到 Builder 或 Workspace
// 状态：无状态组件
```

#### 1.2 BuilderPage (`/builder`)
```typescript
interface BuilderPageProps {}

interface BuilderFormState {
  basicInfo: BasicInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string;
}

// 职责：收集用户信息，生成初稿，跳转到 Workspace
// 状态：表单状态，验证状态
```

#### 1.3 WorkspacePage (`/app`)
```typescript
interface WorkspacePageProps {}

interface WorkspaceState {
  resumeText: string;
  jdText: string;
  maskEnabled: boolean;
  activeTab: 'diagnosis' | 'match' | 'rewrite' | 'finalize';
  appliedRewrites: AppliedRewrite[];
  // Results
  diagnosisResult: DiagnosisResult | null;
  matchResult: MatchResult | null;
  rewriteResult: RewriteResult | null;
  finalResult: FinalResult | null;
  // Loading states
  isLoading: Record<string, boolean>;
}

// 职责：核心工作台，处理所有简历优化流程
// 状态：输入、结果、加载状态
```

### 2. Service Modules

#### 2.1 Masking Service (`src/lib/masking.ts`)
```typescript
interface MaskingMap {
  tokenToOriginal: Map<string, string>;
  originalToToken: Map<string, string>;
}

interface MaskingService {
  mask(text: string): { masked: string; map: MaskingMap };
  unmask(text: string, map: MaskingMap): string;
  getMaskingPatterns(): RegExp[];
}
```

#### 2.2 PDF Extractor (`src/lib/pdf.ts`)
```typescript
interface PDFExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
}

interface PDFExtractor {
  extract(file: File): Promise<PDFExtractionResult>;
  validateFile(file: File): { valid: boolean; error?: string };
}
```

#### 2.3 API Client (`src/lib/api.ts`)
```typescript
interface APIClient {
  analyze(params: AnalyzeRequest): Promise<AnalyzeResponse>;
  match(params: MatchRequest): Promise<MatchResponse>;
  rewrite(params: RewriteRequest): Promise<RewriteResponse>;
  finalize(params: FinalizeRequest): Promise<FinalizeResponse>;
}

interface APIError {
  code: string;
  message: string;
  retryAfterSec?: number;
}
```

#### 2.4 Session Store (`src/lib/session.ts`)
```typescript
interface SessionData {
  resumeText: string;
  jdText: string;
  appliedRewrites: AppliedRewrite[];
  maskingMap: MaskingMap;
}

interface SessionStore {
  save(data: Partial<SessionData>): void;
  load(): SessionData | null;
  clear(): void;
}
```

### 3. UI Components

#### 3.1 Input Components
```typescript
// ResumeInput: 简历文本输入框 + PDF 上传
// JDInput: JD 文本输入框
// MaskToggle: 脱敏开关
// ActionButtons: 操作按钮组
```

#### 3.2 Result Components
```typescript
// DiagnosisPanel: 诊断结果展示
// MatchPanel: 匹配结果展示
// RewritePanel: 改写面板（输入 + 结果 + 采用列表）
// FinalizePanel: 终稿预览 + 打印按钮
```

#### 3.3 Common Components
```typescript
// Toast: 消息提示
// LoadingSkeleton: 加载骨架屏
// TabNav: 标签页导航
// PrintArea: 打印区域容器
```

## Data Models

### 1. Form Data Models

```typescript
interface BasicInfo {
  name?: string;        // 1-50 chars, optional
  phone: string;        // required
  email: string;        // required
  city?: string;        // optional
}

interface EducationEntry {
  id: string;
  school: string;       // required
  major?: string;       // optional
  degree?: string;      // optional
  timePeriod: string;   // required
}

interface ExperienceEntry {
  id: string;
  company: string;      // required
  position: string;     // required
  timePeriod: string;   // required
  bullets: string[];    // 1-5 items, each ≤200 chars
}

interface ProjectEntry {
  id: string;
  name: string;         // required
  role?: string;        // optional
  timePeriod?: string;  // optional
  bullets: string[];    // 1-5 items
}
```

### 2. API Request/Response Models

```typescript
// Analyze
interface AnalyzeRequest {
  resume_text: string;
  jd_text?: string;
  lang: 'auto' | 'zh' | 'en';
  mask_enabled: boolean;
}

interface AnalyzeResponse {
  issues: Issue[];
  actions: string[];
  examples: Example[];
}

interface Issue {
  title: string;
  why: string;
  how: string;
  example?: Example;
}

interface Example {
  before: string;
  after: string;
}

// Match
interface MatchRequest {
  resume_text: string;
  jd_text: string;
  lang: 'auto' | 'zh' | 'en';
}

interface MatchResponse {
  score: number;              // 0-100
  missing_keywords: string[]; // 10-20 items
  hit_keywords: string[];     // ≤20 items
  notes: string;
}

// Rewrite
interface RewriteRequest {
  source_text: string;
  jd_text?: string;
  style: 'conservative' | 'strong';
  lang: 'auto' | 'zh' | 'en';
  constraints: {
    no_new_facts: boolean;
    ats_friendly: boolean;
    keep_bullets: boolean;
  };
}

interface RewriteResponse {
  rewritten_text: string;
  cautions: string[];
}

// Finalize
interface FinalizeRequest {
  resume_text: string;
  applied_rewrites: AppliedRewrite[];
  lang: 'auto' | 'zh' | 'en';
  template: 'simple_v1';
  mask_enabled: boolean;
}

interface AppliedRewrite {
  id: string;
  before_text: string;
  after_text: string;
  style: 'conservative' | 'strong';
}

interface FinalizeResponse {
  final_markdown: string;
  final_html: string;
}
```

### 3. Internal State Models

```typescript
interface DiagnosisResult {
  issues: Issue[];
  actions: string[];
  examples: Example[];
  timestamp: number;
}

interface MatchResult {
  score: number;
  missingKeywords: string[];
  hitKeywords: string[];
  notes: string;
  timestamp: number;
}

interface RewriteResult {
  sourceText: string;
  conservative: { text: string; cautions: string[] };
  strong: { text: string; cautions: string[] };
  timestamp: number;
}

interface FinalResult {
  markdown: string;
  html: string;
  timestamp: number;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties have been identified for property-based testing:

### Property 1: Skills Deduplication and Trimming

*For any* input string of comma-separated skills, the processed output SHALL contain only unique, trimmed skill values with no duplicates and no leading/trailing whitespace on any item.

**Validates: Requirements 2.5**

### Property 2: Form to Markdown Generation

*For any* valid BuilderFormState with all required fields populated, the generated Resume_Text SHALL be valid Markdown following the Simple_V1_Template structure, containing all provided information in the correct sections.

**Validates: Requirements 2.6**

### Property 3: PDF File Validation

*For any* File object, the PDF_Extractor validation SHALL return valid=true if and only if the file size is ≤10MB AND the file has ≤10 pages.

**Validates: Requirements 3.1**

### Property 4: Extracted Text Length Threshold

*For any* extracted text string, the PDF_Extractor SHALL flag it as potentially scanned/image-based if and only if the trimmed text length is less than 30 characters.

**Validates: Requirements 3.4**

### Property 5: Sensitive Information Masking

*For any* text containing sensitive information (phone numbers, emails, ID cards, address lines), the Masking_System SHALL replace ALL occurrences with unique tokens, and the masked text SHALL contain zero instances of the original sensitive values.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Masking Round-Trip

*For any* text string, applying mask() followed by unmask() with the returned mapping SHALL produce a string identical to the original input.

**Validates: Requirements 4.5, 9.5**

### Property 7: Diagnosis Result Constraints

*For any* successful AnalyzeResponse, the issues array SHALL have length ≤10 AND the actions array SHALL have length ≤10.

**Validates: Requirements 5.2, 5.3**

### Property 8: Match Result Constraints

*For any* successful MatchResponse, the score SHALL be an integer in range [0, 100] AND missing_keywords SHALL have length in range [10, 20] AND hit_keywords SHALL have length ≤20.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 9: Rewrite Structure Preservation

*For any* source_text that is a bullet list (lines starting with "- " or "* "), the rewritten_text SHALL also be a bullet list with the same number of bullet points.

**Validates: Requirements 7.3**

### Property 10: Finalize Output Validation

*For any* successful FinalizeResponse, the final_html SHALL NOT contain `<table>`, multi-column CSS (`column-count`, `display: flex` with multiple columns), or emoji characters, AND SHALL incorporate all provided applied_rewrites.

**Validates: Requirements 8.3, 8.4**

### Property 11: Input Length Validation

*For any* input text, the validation function SHALL return invalid if resume_text length > 20,000 OR jd_text length > 10,000 OR source_text length > 3,000.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 12: Form Required Field Validation

*For any* BuilderFormState, the form SHALL be submittable if and only if all required fields (phone, email, at least one education with school and time, at least one experience with company/position/time/bullets, skills) are non-empty.

**Validates: Requirements 12.5**

## Error Handling

### Client-Side Error Handling

```typescript
interface ErrorHandler {
  handleNetworkError(): void;      // Toast: "网络异常，请重试"
  handleBadRequest(msg: string): void;  // Toast: error message
  handleRateLimit(retryAfter: number): void;  // Toast: "请求过于频繁，请稍后再试（{n}s）"
  handleServerError(): void;       // Toast: "服务异常，请稍后重试"
}

// Error handling flow
async function apiCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof NetworkError) {
      handleNetworkError();
    } else if (error instanceof APIError) {
      switch (error.status) {
        case 400: handleBadRequest(error.message); break;
        case 429: handleRateLimit(error.retryAfterSec); break;
        default: handleServerError(); break;
      }
    }
    return null;
  }
}
```

### Edge Function Error Handling

```typescript
// Standard error response format
interface ErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'PAYLOAD_TOO_LARGE' | 'RATE_LIMITED' | 'MODEL_ERROR' | 'INTERNAL_ERROR';
    message: string;
    retry_after_sec?: number;
  };
}

// Rate limiting implementation
const RATE_LIMITS = {
  '/api/analyze': { limit: 10, window: 60 },
  '/api/match': { limit: 20, window: 60 },
  '/api/rewrite': { limit: 20, window: 60 },
  '/api/finalize': { limit: 10, window: 60 },
};
```

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples and edge cases:

1. **Component Rendering**: Verify UI components render correctly with various props
2. **Form Validation**: Test specific validation scenarios (empty fields, invalid formats)
3. **Error Handling**: Test error toast display for each error type
4. **Navigation**: Test route transitions
5. **Session Storage**: Test save/load/clear operations

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript/JavaScript:

```typescript
import * as fc from 'fast-check';

// Configuration: minimum 100 iterations per property
const propertyConfig = { numRuns: 100 };
```

Each property test will be tagged with:
- **Feature: resume-boost, Property {N}: {property_text}**
- **Validates: Requirements X.Y**

### Test File Organization

```
src/
├── lib/
│   ├── masking.ts
│   ├── masking.test.ts        # Unit tests
│   ├── masking.property.test.ts  # Property tests (P5, P6)
│   ├── pdf.ts
│   ├── pdf.test.ts
│   ├── pdf.property.test.ts   # Property tests (P3, P4)
│   ├── validation.ts
│   ├── validation.test.ts
│   └── validation.property.test.ts  # Property tests (P11, P12)
├── routes/
│   ├── Builder/
│   │   ├── index.tsx
│   │   ├── Builder.test.tsx
│   │   └── Builder.property.test.tsx  # Property tests (P1, P2)
│   └── ...
└── ...
```

### Integration Tests

Integration tests will verify:
1. Full user flows (Builder → Workspace)
2. API integration with mock responses
3. Session persistence across navigation
