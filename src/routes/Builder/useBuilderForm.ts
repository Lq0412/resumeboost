/**
 * Builder 表单状态管理 Hook
 */

import { useState, useCallback } from 'react';
import type { 
  BuilderFormState, 
  BasicInfo, 
  EducationEntry, 
  ExperienceEntry, 
  ProjectEntry,
  FormValidationResult 
} from '../../lib/validation';
import { validateBuilderForm } from '../../lib/validation';

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 初始状态
const createInitialState = (): BuilderFormState => ({
  basicInfo: {
    name: '',
    phone: '',
    email: '',
    city: '',
  },
  education: [
    { id: generateId(), school: '', major: '', degree: '', timePeriod: '' }
  ],
  experience: [
    { id: generateId(), company: '', position: '', timePeriod: '', bullets: [''] }
  ],
  projects: [],
  skills: '',
});

export function useBuilderForm() {
  const [form, setForm] = useState<BuilderFormState>(createInitialState);
  const [errors, setErrors] = useState<string[]>([]);

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
      experience: [...prev.experience, { id: generateId(), company: '', position: '', timePeriod: '', bullets: [''] }],
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
      projects: [...prev.projects, { id: generateId(), name: '', role: '', timePeriod: '', bullets: [''] }],
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

  // 更新技能
  const updateSkills = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, skills: value }));
  }, []);

  // 验证表单
  const validate = useCallback((): FormValidationResult => {
    const result = validateBuilderForm(form);
    setErrors(result.errors);
    return result;
  }, [form]);

  // 重置表单
  const reset = useCallback(() => {
    setForm(createInitialState());
    setErrors([]);
  }, []);

  return {
    form,
    errors,
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
    validate,
    reset,
  };
}
