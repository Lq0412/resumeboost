/**
 * Builder 表单状态管理 Hook
 */

import { useState, useCallback } from 'react';

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 类型定义
export interface BasicInfo {
  name?: string;
  phone: string;
  email: string;
  city?: string;
  jobTitle?: string;  // 求职意向
  status?: string;    // 求职状态
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
  location?: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  role?: string;
  timePeriod?: string;
  location?: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
}

export interface Award {
  id: string;
  name: string;
  time?: string;
}

export interface BuilderFormState {
  basicInfo: BasicInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string;
  skillCategories?: SkillCategory[];
  awards?: Award[];
}

// 初始状态
const createInitialState = (): BuilderFormState => ({
  basicInfo: {
    name: '',
    phone: '',
    email: '',
    city: '',
    jobTitle: '',
    status: '',
  },
  education: [
    { id: generateId(), school: '', major: '', degree: '', timePeriod: '' }
  ],
  experience: [
    { id: generateId(), company: '', position: '', timePeriod: '', location: '', bullets: [''] }
  ],
  projects: [],
  skills: '',
  skillCategories: [
    { id: generateId(), name: '', description: '' }
  ],
  awards: [],
});

export function useBuilderForm() {
  const [form, setForm] = useState<BuilderFormState>(createInitialState);

  // 更新基本信息
  const updateBasicInfo = useCallback((field: keyof BasicInfo, value: string) => {
    setForm((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }));
  }, []);

  // 教育经历操作
  const addEducation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, { id: generateId(), school: '', major: '', degree: '', timePeriod: '' }],
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof Omit<EducationEntry, 'id'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  // 工作经历操作
  const addExperience = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { id: generateId(), company: '', position: '', timePeriod: '', location: '', bullets: [''] }],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  }, []);

  const updateExperience = useCallback((id: string, field: keyof Omit<ExperienceEntry, 'id' | 'bullets'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  const updateExperienceBullet = useCallback((id: string, index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== id) return e;
        const bullets = [...e.bullets];
        bullets[index] = value;
        return { ...e, bullets };
      }),
    }));
  }, []);

  const addExperienceBullet = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== id || e.bullets.length >= 5) return e;
        return { ...e, bullets: [...e.bullets, ''] };
      }),
    }));
  }, []);

  const removeExperienceBullet = useCallback((id: string, index: number) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== id || e.bullets.length <= 1) return e;
        return { ...e, bullets: e.bullets.filter((_, i) => i !== index) };
      }),
    }));
  }, []);

  // 项目经历操作
  const addProject = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { id: generateId(), name: '', role: '', timePeriod: '', location: '', bullets: [''] }],
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  }, []);

  const updateProject = useCallback((id: string, field: keyof Omit<ProjectEntry, 'id' | 'bullets'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  }, []);

  const updateProjectBullet = useCallback((id: string, index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== id) return p;
        const bullets = [...p.bullets];
        bullets[index] = value;
        return { ...p, bullets };
      }),
    }));
  }, []);

  const addProjectBullet = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== id || p.bullets.length >= 5) return p;
        return { ...p, bullets: [...p.bullets, ''] };
      }),
    }));
  }, []);

  const removeProjectBullet = useCallback((id: string, index: number) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== id || p.bullets.length <= 1) return p;
        return { ...p, bullets: p.bullets.filter((_, i) => i !== index) };
      }),
    }));
  }, []);

  // 更新技能（简单文本）
  const updateSkills = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, skills: value }));
  }, []);

  // 技能分类操作
  const addSkillCategory = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      skillCategories: [...(prev.skillCategories || []), { id: generateId(), name: '', description: '' }],
    }));
  }, []);

  const removeSkillCategory = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      skillCategories: (prev.skillCategories || []).filter((c) => c.id !== id),
    }));
  }, []);

  const updateSkillCategory = useCallback((id: string, field: keyof Omit<SkillCategory, 'id'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      skillCategories: (prev.skillCategories || []).map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  }, []);

  // 荣誉奖项操作
  const addAward = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      awards: [...(prev.awards || []), { id: generateId(), name: '', time: '' }],
    }));
  }, []);

  const removeAward = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      awards: (prev.awards || []).filter((a) => a.id !== id),
    }));
  }, []);

  const updateAward = useCallback((id: string, field: keyof Omit<Award, 'id'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      awards: (prev.awards || []).map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));
  }, []);

  // 重置表单
  const reset = useCallback(() => {
    setForm(createInitialState());
  }, []);

  return {
    form,
    updateBasicInfo,
    addEducation,
    removeEducation,
    updateEducation,
    addExperience,
    removeExperience,
    updateExperience,
    updateExperienceBullet,
    addExperienceBullet,
    removeExperienceBullet,
    addProject,
    removeProject,
    updateProject,
    updateProjectBullet,
    addProjectBullet,
    removeProjectBullet,
    updateSkills,
    addSkillCategory,
    removeSkillCategory,
    updateSkillCategory,
    addAward,
    removeAward,
    updateAward,
    reset,
  };
}
