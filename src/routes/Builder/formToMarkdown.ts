/**
 * 将表单数据转换为 Markdown 格式的简历
 */

import type { BuilderFormState } from './useBuilderForm';

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
  if (form.basicInfo.status) contactParts.push(`🔵 ${form.basicInfo.status}`);
  if (form.basicInfo.jobTitle) contactParts.push(`💼 ${form.basicInfo.jobTitle}`);
  
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
      let line = `**${edu.school}**`;
      if (edu.major) line += ` ${edu.major}`;
      if (edu.timePeriod) line += ` | ${edu.timePeriod}`;
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
      let header = `**${exp.company}**`;
      if (exp.timePeriod) header += ` | ${exp.timePeriod}`;
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
      let header = `**${proj.name}**`;
      if (proj.timePeriod) header += ` | ${proj.timePeriod}`;
      lines.push(header);
      
      const subLine: string[] = [];
      if (proj.role) subLine.push(proj.role);
      if (proj.location) subLine.push(proj.location);
      if (subLine.length > 0) lines.push(subLine.join(' · '));
      
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
