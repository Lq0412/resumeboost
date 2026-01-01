/**
 * Builder 表单状态管理 Hook
 */

import { useState, useCallback } from 'react';

const generateId = () => Math.random().toString(36).substring(2, 9);

export interface BasicInfo {
  name?: string;
  phone: string;
  email: string;
  city?: string;
  jobTitle?: string;
  status?: string;
  // 新增可选字段
  github?: string;
  website?: string;
  birthYear?: string;
  birthMonth?: string;
  hometown?: string;  // 籍贯
}

export interface EducationEntry {
  id: string;
  school: string;
  major?: string;
  degree?: string;
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
  description?: string;  // 校园经历描述
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location?: string;
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  role?: string;
  link?: string;  // GitHub/部署链接
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
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
  photo?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string;
  skillCategories?: SkillCategory[];
  awards?: Award[];
}

const createInitialState = (): BuilderFormState => ({
  basicInfo: { name: '', phone: '', email: '', city: '', jobTitle: '', status: '', github: '', website: '', birthYear: '', birthMonth: '', hometown: '' },
  photo: '',
  education: [{ id: generateId(), school: '', major: '', degree: '', startYear: '', startMonth: '', endYear: '', endMonth: '', description: '' }],
  experience: [],  // 工作经历可选，初始为空
  projects: [],
  skills: '',
  skillCategories: [{ id: generateId(), name: '', description: '' }],
  awards: [],
});

export function useBuilderForm() {
  const [form, setForm] = useState<BuilderFormState>(createInitialState);

  const updateBasicInfo = useCallback((field: keyof BasicInfo, value: string) => {
    setForm((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, [field]: value } }));
  }, []);

  const setPhoto = useCallback((photo: string) => {
    setForm((prev) => ({ ...prev, photo }));
  }, []);

  const addEducation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, { id: generateId(), school: '', major: '', degree: '', startYear: '', startMonth: '', endYear: '', endMonth: '', description: '' }],
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof Omit<EducationEntry, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
  }, []);

  const addExperience = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { id: generateId(), company: '', position: '', location: '', startYear: '', startMonth: '', endYear: '', endMonth: '', bullets: [''] }],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
  }, []);

  const updateExperience = useCallback((id: string, field: keyof Omit<ExperienceEntry, 'id' | 'bullets'>, value: string) => {
    setForm((prev) => ({ ...prev, experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)) }));
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

  const addProject = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { id: generateId(), name: '', role: '', link: '', startYear: '', startMonth: '', endYear: '', endMonth: '', bullets: [''] }],
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
  }, []);

  const updateProject = useCallback((id: string, field: keyof Omit<ProjectEntry, 'id' | 'bullets'>, value: string) => {
    setForm((prev) => ({ ...prev, projects: prev.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)) }));
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

  const updateSkills = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, skills: value }));
  }, []);

  const addSkillCategory = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      skillCategories: [...(prev.skillCategories || []), { id: generateId(), name: '', description: '' }],
    }));
  }, []);

  const removeSkillCategory = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, skillCategories: (prev.skillCategories || []).filter((c) => c.id !== id) }));
  }, []);

  const updateSkillCategory = useCallback((id: string, field: keyof Omit<SkillCategory, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, skillCategories: (prev.skillCategories || []).map((c) => (c.id === id ? { ...c, [field]: value } : c)) }));
  }, []);

  const addAward = useCallback(() => {
    setForm((prev) => ({ ...prev, awards: [...(prev.awards || []), { id: generateId(), name: '', time: '' }] }));
  }, []);

  const removeAward = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, awards: (prev.awards || []).filter((a) => a.id !== id) }));
  }, []);

  const updateAward = useCallback((id: string, field: keyof Omit<Award, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, awards: (prev.awards || []).map((a) => (a.id === id ? { ...a, [field]: value } : a)) }));
  }, []);

  const reset = useCallback(() => { setForm(createInitialState()); }, []);

  const loadForm = useCallback((data: BuilderFormState) => {
    // 深拷贝确保创建全新对象
    setForm(JSON.parse(JSON.stringify(data)));
  }, []);

  return {
    form,
    updateBasicInfo,
    setPhoto,
    addEducation,
    removeEducation,
    updateEducation,
    addExperience,
    removeExperience,
    updateExperience,
    updateExperienceBullet,
    addExperienceBullet,
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
    loadForm,
  };
}
