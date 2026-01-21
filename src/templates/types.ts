/**
 * 简历模板系统类型定义
 */

import type { useBuilderForm } from '../routes/Builder/useBuilderForm';

export type ResumeForm = ReturnType<typeof useBuilderForm>['form'];

export type TemplateCategory = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative';

export type LayoutType = 'single' | 'two-column' | 'sidebar';

export type SpacingMode = 'compact' | 'normal' | 'relaxed';

export interface TemplateColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent?: string;
}

export interface TemplateLayout {
  type: LayoutType;
  spacing: SpacingMode;
  sectionOrder: string[];
}

export interface TemplateTypography {
  headingFont: string;
  bodyFont: string;
  sizes: {
    name: string;
    heading: string;
    body: string;
  };
}

export interface TemplateConfig {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnail: string;
  description: string;
  features: string[];
  isPremium?: boolean;
  
  colors: TemplateColors;
  layout: TemplateLayout;
  typography: TemplateTypography;
}

export interface TemplateProps {
  form: ResumeForm;
  config: TemplateConfig;
  scale?: number;
  previewRef?: React.RefObject<HTMLDivElement>;
}

export interface TemplateRegistry {
  [key: string]: {
    config: TemplateConfig;
    component: React.ComponentType<TemplateProps>;
  };
}
