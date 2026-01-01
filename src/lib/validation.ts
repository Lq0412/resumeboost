/**
 * 输入验证模块
 */

// 长度限制常量
export const LENGTH_LIMITS = {
  resumeText: 20000,
  jdText: 10000,
  sourceText: 3000,
  name: 50,
  bulletItem: 200,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证文本长度
 */
export function validateLength(
  text: string,
  maxLength: number,
  fieldName: string
): ValidationResult {
  if (text.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName}超出长度限制（最多 ${maxLength} 字符，当前 ${text.length} 字符）`,
    };
  }
  return { valid: true };
}

/**
 * 验证简历文本
 */
export function validateResumeText(text: string): ValidationResult {
  return validateLength(text, LENGTH_LIMITS.resumeText, '简历文本');
}

/**
 * 验证 JD 文本
 */
export function validateJDText(text: string): ValidationResult {
  return validateLength(text, LENGTH_LIMITS.jdText, 'JD 文本');
}

/**
 * 验证改写源文本
 */
export function validateSourceText(text: string): ValidationResult {
  return validateLength(text, LENGTH_LIMITS.sourceText, '待改写文本');
}

/**
 * 处理技能字符串：trim + 去重
 */
export function processSkills(skillsInput: string): string[] {
  if (!skillsInput.trim()) return [];
  
  const skills = skillsInput
    .split(/[,，]/) // 支持中英文逗号
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  
  // 去重（保持顺序）
  return [...new Set(skills)];
}

/**
 * 表单必填字段验证
 */
export interface BasicInfo {
  name?: string;
  phone: string;
  email: string;
  city?: string;
}

export interface EducationEntry {
  id: string;
  school: string;
  major?: string;
  degree?: string;
  timePeriod: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  timePeriod: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  role?: string;
  timePeriod?: string;
  bullets: string[];
}

export interface BuilderFormState {
  basicInfo: BasicInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string;
}

export interface FormValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 验证 Builder 表单
 */
export function validateBuilderForm(form: BuilderFormState): FormValidationResult {
  const errors: string[] = [];

  // 基本信息验证
  if (!form.basicInfo.phone.trim()) {
    errors.push('手机号为必填项');
  }
  if (!form.basicInfo.email.trim()) {
    errors.push('邮箱为必填项');
  }
  if (form.basicInfo.name && form.basicInfo.name.length > LENGTH_LIMITS.name) {
    errors.push(`姓名不能超过 ${LENGTH_LIMITS.name} 字符`);
  }

  // 教育经历验证（至少一条）
  if (form.education.length === 0) {
    errors.push('至少需要一条教育经历');
  } else {
    form.education.forEach((edu, i) => {
      if (!edu.school.trim()) {
        errors.push(`教育经历 ${i + 1}: 学校为必填项`);
      }
      if (!edu.timePeriod.trim()) {
        errors.push(`教育经历 ${i + 1}: 时间为必填项`);
      }
    });
  }

  // 工作经历验证（至少一条）
  if (form.experience.length === 0) {
    errors.push('至少需要一条工作经历');
  } else {
    form.experience.forEach((exp, i) => {
      if (!exp.company.trim()) {
        errors.push(`工作经历 ${i + 1}: 公司为必填项`);
      }
      if (!exp.position.trim()) {
        errors.push(`工作经历 ${i + 1}: 岗位为必填项`);
      }
      if (!exp.timePeriod.trim()) {
        errors.push(`工作经历 ${i + 1}: 时间为必填项`);
      }
      if (exp.bullets.length === 0 || !exp.bullets.some((b) => b.trim())) {
        errors.push(`工作经历 ${i + 1}: 至少需要一条工作内容`);
      }
      exp.bullets.forEach((bullet, j) => {
        if (bullet.length > LENGTH_LIMITS.bulletItem) {
          errors.push(`工作经历 ${i + 1} 第 ${j + 1} 条内容超出 ${LENGTH_LIMITS.bulletItem} 字符限制`);
        }
      });
    });
  }

  // 技能验证
  if (!form.skills.trim()) {
    errors.push('技能为必填项');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国手机号）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}
