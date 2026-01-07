// 工具函数

import type { BuilderFormState } from './useBuilderForm';

const hasText = (value?: string) => typeof value === 'string' && value.trim().length > 0;

export const formatTime = (startYear?: string, startMonth?: string, endYear?: string, endMonth?: string) => {
  if (!startYear) return '';
  const start = startMonth ? `${startYear}-${startMonth}` : startYear;
  if (!endYear) return start;
  if (endYear === 'present') return `${start} ~ 至今`;
  const end = endMonth ? `${endYear}-${endMonth}` : endYear;
  return `${start} ~ ${end}`;
};

export const hasResumeContent = (form: BuilderFormState) => {
  const basic = form.basicInfo;
  const basicHas = [
    basic.name,
    basic.phone,
    basic.email,
    basic.city,
    basic.jobTitle,
    basic.status,
    basic.github,
    basic.website,
    basic.birthYear,
    basic.birthMonth,
    basic.hometown,
  ].some(hasText);

  const educationHas = form.education.some((edu) =>
    [
      edu.school,
      edu.major,
      edu.degree,
      edu.description,
      edu.startYear,
      edu.startMonth,
      edu.endYear,
      edu.endMonth,
    ].some(hasText)
  );

  const experienceHas = form.experience.some((exp) =>
    [
      exp.company,
      exp.position,
      exp.location,
      exp.startYear,
      exp.startMonth,
      exp.endYear,
      exp.endMonth,
    ].some(hasText) || exp.bullets.some(hasText)
  );

  const projectsHas = form.projects.some((proj) =>
    [
      proj.name,
      proj.role,
      proj.link,
      proj.startYear,
      proj.startMonth,
      proj.endYear,
      proj.endMonth,
    ].some(hasText) || proj.bullets.some(hasText)
  );

  const skillCategoriesHas = (form.skillCategories ?? []).some((cat) =>
    [cat.name, cat.description].some(hasText)
  );

  const awardsHas = (form.awards ?? []).some((award) =>
    [award.name, award.time].some(hasText)
  );

  const skillsHas = hasText(form.skills);
  const photoHas = hasText(form.photo);

  return (
    basicHas ||
    educationHas ||
    experienceHas ||
    projectsHas ||
    skillCategoriesHas ||
    awardsHas ||
    skillsHas ||
    photoHas
  );
};

export const mapSectionFromTitle = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('教育') || t.includes('学历')) return 'education';
  if (t.includes('技能') || t.includes('技术')) return 'skills';
  if (t.includes('工作') || t.includes('实习')) return 'experience';
  if (t.includes('项目')) return 'projects';
  if (t.includes('奖') || t.includes('荣誉')) return 'awards';
  return 'general';
};

// 常量
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
export const MIN_RESUME_LENGTH = 50;

// A4 纸张尺寸常量 (mm -> px, 96dpi)
export const A4_WIDTH = 210 * 3.78; // ~794px
export const A4_HEIGHT = 297 * 3.78; // ~1123px

// 密度模式样式配置
export const densityStyles = {
  normal: {
    padding: 40,
    titleSize: 'text-2xl',
    sectionTitleSize: 'text-base',
    textSize: 'text-sm',
    sectionGap: 'mb-5',
    itemGap: 'mb-3',
    lineHeight: 'leading-normal',
  },
  compact: {
    padding: 32,
    titleSize: 'text-xl',
    sectionTitleSize: 'text-sm',
    textSize: 'text-xs',
    sectionGap: 'mb-3',
    itemGap: 'mb-2',
    lineHeight: 'leading-snug',
  },
  tight: {
    padding: 24,
    titleSize: 'text-lg',
    sectionTitleSize: 'text-xs',
    textSize: 'text-xs',
    sectionGap: 'mb-2',
    itemGap: 'mb-1',
    lineHeight: 'leading-tight',
  },
};

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
