/**
 * 将表单数据转换为 Markdown 格式的简历
 */

import type { BuilderFormState } from './useBuilderForm';

const formatTime = (startYear?: string, startMonth?: string, endYear?: string, endMonth?: string) => {
  if (!startYear) return '';
  const start = startMonth ? `${startYear}-${startMonth}` : startYear;
  if (!endYear) return start;
  if (endYear === 'present') return `${start} ~ 至今`;
  const end = endMonth ? `${endYear}-${endMonth}` : endYear;
  return `${start} ~ ${end}`;
};

export function formToMarkdown(form: BuilderFormState): string {
  const lines: string[] = [];

  // 基本信息
  if (form.basicInfo.name) {
    lines.push(`# ${form.basicInfo.name}`);
    lines.push('');
  }

  const contactParts: string[] = [];
  if (form.basicInfo.phone) contactParts.push(`📱 ${form.basicInfo.phone}`);
  if (form.basicInfo.email) contactParts.push(`✉️ ${form.basicInfo.email}`);
  if (form.basicInfo.city) contactParts.push(`📍 ${form.basicInfo.city}`);
  if (form.basicInfo.status) contactParts.push(`🔵 ${form.basicInfo.status}`);
  if (form.basicInfo.jobTitle) contactParts.push(`💼 ${form.basicInfo.jobTitle}`);
  if (form.basicInfo.birthYear) {
    const birth = form.basicInfo.birthMonth ? `${form.basicInfo.birthYear}-${form.basicInfo.birthMonth}` : form.basicInfo.birthYear;
    contactParts.push(`🎂 ${birth}`);
  }
  if (form.basicInfo.hometown) contactParts.push(`🏠 ${form.basicInfo.hometown}`);
  if (form.basicInfo.github) contactParts.push(`🔗 ${form.basicInfo.github}`);
  if (form.basicInfo.website) contactParts.push(`🌐 ${form.basicInfo.website}`);
  
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' | '));
    lines.push('');
  }

  // 教育经历
  const validEducation = form.education.filter(e => e.school);
  if (validEducation.length > 0) {
    lines.push('## 教育经历');
    lines.push('');
    validEducation.forEach(edu => {
      const time = formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth);
      let line = `**${edu.school}**`;
      if (edu.major) line += ` ${edu.major}`;
      if (time) line += ` | ${time}`;
      lines.push(line);
      if (edu.degree) lines.push(edu.degree);
      lines.push('');
    });
  }

  // 专业技能
  const validSkillCategories = form.skillCategories?.filter(c => c.name) || [];
  if (validSkillCategories.length > 0 || form.skills) {
    lines.push('## 专业技能');
    lines.push('');
    if (validSkillCategories.length > 0) {
      validSkillCategories.forEach(cat => {
        lines.push(`**${cat.name}**`);
        if (cat.description) lines.push(cat.description);
        lines.push('');
      });
    } else if (form.skills) {
      lines.push(form.skills);
      lines.push('');
    }
  }

  // 工作经历
  const validExperience = form.experience.filter(e => e.company);
  if (validExperience.length > 0) {
    lines.push('## 工作经历');
    lines.push('');
    validExperience.forEach(exp => {
      const time = formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth);
      let header = `**${exp.company}**`;
      if (time) header += ` | ${time}`;
      lines.push(header);
      
      const subLine: string[] = [];
      if (exp.position) subLine.push(exp.position);
      if (exp.location) subLine.push(exp.location);
      if (subLine.length > 0) lines.push(subLine.join(' · '));
      
      const validBullets = exp.bullets.filter(b => b.trim());
      if (validBullets.length > 0) {
        lines.push('');
        lines.push(validBullets.join(' '));
      }
      lines.push('');
    });
  }

  // 项目经历
  const validProjects = form.projects.filter(p => p.name);
  if (validProjects.length > 0) {
    lines.push('## 项目经历');
    lines.push('');
    validProjects.forEach(proj => {
      const time = formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth);
      let header = `**${proj.name}**`;
      if (proj.link) header += ` [链接](${proj.link})`;
      if (time) header += ` | ${time}`;
      lines.push(header);
      
      if (proj.role) lines.push(proj.role);
      
      const validBullets = proj.bullets.filter(b => b.trim());
      if (validBullets.length > 0) {
        lines.push('');
        lines.push(validBullets.join(' '));
      }
      lines.push('');
    });
  }

  // 荣誉奖项
  const validAwards = form.awards?.filter(a => a.name) || [];
  if (validAwards.length > 0) {
    lines.push('## 荣誉奖项');
    lines.push('');
    validAwards.forEach(award => {
      let line = award.name;
      if (award.time) line += ` | ${award.time}`;
      lines.push(line);
    });
    lines.push('');
  }

  return lines.join('\n').trim();
}
