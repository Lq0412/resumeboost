# 简历模板系统设计方案

## 📋 目标

打造一个灵活、可扩展的简历模板系统，让用户能够：
- 快速切换不同风格的模板
- 自定义配色和布局
- 保持数据一致性
- 导出专业的 PDF

## 🎨 模板分类

### 1. 经典模板（Classic）
**适用人群**：传统行业、政府机构、学术界
- 简洁大方，黑白为主
- 左右分栏或单栏布局
- 强调教育背景和工作经历

### 2. 现代模板（Modern）
**适用人群**：互联网、科技公司、创业公司
- 使用品牌色和渐变
- 卡片式设计
- 图标和视觉元素丰富

### 3. 极简模板（Minimal）
**适用人群**：设计师、创意行业
- 大量留白
- 排版精致
- 突出个人品牌

### 4. 专业模板（Professional）
**适用人群**：金融、咨询、法律
- 严谨正式
- 数据可视化
- 强调成就和数据

### 5. 创意模板（Creative）
**适用人群**：设计、艺术、媒体
- 大胆配色
- 非传统布局
- 个性化元素

## 🏗️ 技术架构

### 目录结构
```
src/
├── templates/
│   ├── index.ts                 # 模板注册中心
│   ├── types.ts                 # 模板类型定义
│   ├── classic/
│   │   ├── ClassicTemplate.tsx
│   │   ├── config.ts
│   │   └── styles.ts
│   ├── modern/
│   │   ├── ModernTemplate.tsx
│   │   ├── config.ts
│   │   └── styles.ts
│   ├── minimal/
│   │   ├── MinimalTemplate.tsx
│   │   ├── config.ts
│   │   └── styles.ts
│   └── shared/
│       ├── TemplateWrapper.tsx
│       └── components/
├── components/
│   └── TemplateSelector.tsx     # 模板选择器
└── routes/Builder/
    └── TemplatePreview.tsx      # 模板预览
```

### 核心类型定义

```typescript
// templates/types.ts
export interface TemplateConfig {
  id: string;
  name: string;
  category: 'classic' | 'modern' | 'minimal' | 'professional' | 'creative';
  thumbnail: string;
  description: string;
  features: string[];
  isPremium?: boolean;
  
  // 样式配置
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent?: string;
  };
  
  // 布局配置
  layout: {
    type: 'single' | 'two-column' | 'sidebar';
    spacing: 'compact' | 'normal' | 'relaxed';
    sectionOrder: string[];
  };
  
  // 字体配置
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: {
      name: string;
      heading: string;
      body: string;
    };
  };
}

export interface TemplateProps {
  form: ResumeForm;
  config: TemplateConfig;
  scale?: number;
}
```

## 🎯 实现步骤

### Phase 1: 基础架构（1-2天）
- [ ] 创建模板类型定义
- [ ] 实现模板注册系统
- [ ] 创建模板包装器组件
- [ ] 添加模板切换功能

### Phase 2: 第一个模板（2-3天）
- [ ] 实现经典模板
- [ ] 支持配色自定义
- [ ] 测试 PDF 导出
- [ ] 响应式适配

### Phase 3: 模板选择器（1-2天）
- [ ] 设计模板预览界面
- [ ] 实现实时预览
- [ ] 添加模板筛选
- [ ] 收藏功能

### Phase 4: 更多模板（3-5天）
- [ ] 现代模板
- [ ] 极简模板
- [ ] 专业模板
- [ ] 创意模板

### Phase 5: 高级功能（2-3天）
- [ ] 自定义配色方案
- [ ] 布局调整器
- [ ] 字体选择器
- [ ] 模板导入/导出

## 💡 核心功能设计

### 1. 模板选择器 UI

```
┌─────────────────────────────────────┐
│  选择模板                    [搜索框] │
├─────────────────────────────────────┤
│  [全部] [经典] [现代] [极简] [专业]  │
├─────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ 经典1  │  │ 经典2  │  │ 现代1  │ │
│  │ [预览] │  │ [预览] │  │ [预览] │ │
│  │ ✓使用  │  │  使用  │  │  使用  │ │
│  └────────┘  └────────┘  └────────┘ │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ 现代2  │  │ 极简1  │  │ 专业1  │ │
│  │ [预览] │  │ [预览] │  │ [预览] │ │
│  │  使用  │  │  使用  │  │ 💎PRO  │ │
│  └────────┘  └────────┘  └────────┘ │
└─────────────────────────────────────┘
```

### 2. 配色自定义面板

```
┌─────────────────────────┐
│  自定义配色              │
├─────────────────────────┤
│  主色调   [🎨 #FF6B35]  │
│  辅助色   [🎨 #004E89]  │
│  文字色   [🎨 #1A1A1A]  │
│  背景色   [🎨 #FFFFFF]  │
├─────────────────────────┤
│  预设方案：              │
│  [橙红] [蓝绿] [紫粉]   │
│  [商务] [科技] [创意]   │
├─────────────────────────┤
│  [重置] [保存为预设]    │
└─────────────────────────┘
```

### 3. 布局调整器

```
┌─────────────────────────┐
│  布局设置                │
├─────────────────────────┤
│  样式：                  │
│  ○ 单栏  ● 双栏  ○ 侧边 │
├─────────────────────────┤
│  间距：                  │
│  ○ 紧凑  ● 标准  ○ 宽松 │
├─────────────────────────┤
│  章节顺序：              │
│  ≡ 基本信息              │
│  ≡ 教育经历              │
│  ≡ 工作经历              │
│  ≡ 项目经历              │
│  ≡ 专业技能              │
│  ≡ 荣誉奖项              │
└─────────────────────────┘
```

## 🎨 示例模板配置

### 经典模板
```typescript
export const classicTemplate: TemplateConfig = {
  id: 'classic-1',
  name: '经典商务',
  category: 'classic',
  thumbnail: '/templates/classic-1.png',
  description: '适合传统行业的经典简历模板',
  features: ['ATS友好', '简洁大方', '易于阅读'],
  
  colors: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    text: '#333333',
    background: '#FFFFFF',
  },
  
  layout: {
    type: 'single',
    spacing: 'normal',
    sectionOrder: ['basic', 'edu', 'work', 'project', 'skill', 'award'],
  },
  
  typography: {
    headingFont: 'DengXian',
    bodyFont: 'DengXian',
    sizes: {
      name: '24px',
      heading: '14px',
      body: '11px',
    },
  },
};
```

### 现代模板
```typescript
export const modernTemplate: TemplateConfig = {
  id: 'modern-1',
  name: '现代科技',
  category: 'modern',
  thumbnail: '/templates/modern-1.png',
  description: '适合互联网科技公司的现代简历',
  features: ['视觉吸引', '品牌化', '图标丰富'],
  
  colors: {
    primary: '#FF6B35',
    secondary: '#004E89',
    text: '#1A1A1A',
    background: '#FFFFFF',
    accent: '#F7931E',
  },
  
  layout: {
    type: 'two-column',
    spacing: 'normal',
    sectionOrder: ['basic', 'skill', 'work', 'project', 'edu', 'award'],
  },
  
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    sizes: {
      name: '28px',
      heading: '16px',
      body: '11px',
    },
  },
};
```

## 📊 数据流

```
用户选择模板
    ↓
更新 templateId
    ↓
加载模板配置
    ↓
应用样式和布局
    ↓
渲染简历预览
    ↓
导出 PDF（保持模板样式）
```

## 🔧 技术要点

### 1. 模板隔离
- 每个模板独立的样式作用域
- 使用 CSS-in-JS 或 CSS Modules
- 避免样式冲突

### 2. 性能优化
- 懒加载模板组件
- 缓存模板配置
- 虚拟滚动模板列表

### 3. PDF 导出
- 确保模板样式在 PDF 中正确渲染
- 处理分页问题
- 保持字体和颜色一致性

### 4. 响应式设计
- 模板在不同屏幕尺寸下的适配
- 移动端预览优化
- 打印样式优化

## 💰 商业化策略

### 免费模板（3-5个）
- 经典商务
- 简约现代
- 基础极简

### 高级模板（付费）
- 创意设计师模板
- 高级专业模板
- 行业定制模板
- 独家配色方案

### 定价建议
- 单个模板：¥9.9
- 模板包（5个）：¥29.9
- 年度会员（全部模板）：¥99

## 📈 成功指标

- 模板使用率 > 80%
- 用户平均尝试 3+ 个模板
- 付费转化率 > 5%
- 模板切换时间 < 2秒

## 🚀 未来扩展

1. **AI 推荐模板**：根据行业和职位推荐最佳模板
2. **用户自定义模板**：允许用户创建和分享模板
3. **模板市场**：设计师可以上传和售卖模板
4. **动态模板**：支持动画和交互效果
5. **多页模板**：支持 2-3 页的详细简历

---

**开发周期**：2-3 周
**优先级**：⭐⭐⭐⭐⭐
**技术难度**：中等
**商业价值**：高
