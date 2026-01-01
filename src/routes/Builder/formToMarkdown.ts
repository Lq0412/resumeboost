/**
 * 将表单数据转换为 Markdown 格式（Simple_V1 模板）
 */

import { BuilderFormState, processSkills } from '../../lib/validation';

export function formToMarkdown(form: BuilderFormState): string {
  const lines: string[] = [];

  // 姓名（如果有）
  if (form.basicInfo.name?.trim()) {
    lines.push(`# ${form.basicInfo.name.trim()}`);
    lines.push('');
  }

  // 联系方式
  const contactParts: string[] = [];
  if (form.basicInfo.phone.trim()) {
    contactParts.push(form.basicInfo.phone.trim());
  }
  if (form.basicInfo.email.trim()) {
    contactParts.push(form.basicInfo.email.trim());
  }
  if (form.basicInfo.city?.trim()) {
    contactParts.push(form.basicInfo.city.trim());
  }
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' | '));
    lines.push('');
  }

  // 技能
  const skills = processSkills(form.skills);
  if (skills.length > 0) {
    lines.push('## Skills');
    lines.push('');
    lines.push(skills.join(', '));
    lines.push('');
  }

  // 工作经历
  if (form.experience.length > 0) {
    lines.push('## Experience');
    lines.push('');
    
    for (const exp of form.experience) {
      if (!exp.company.trim()) continue;
      
      const header = [exp.company.trim(), exp.position.trim(), exp.timePeriod.trim()]
        .filter(Boolean)
        .join(' | ');
      lines.push(`### ${header}`);
      lines.push('');
      
      for (const bullet of exp.bullets) {
        if (bullet.trim()) {
          lines.push(`- ${bullet.trim()}`);
        }
      }
      lines.push('');
    }
  }

  // 项目经历
  if (form.projects.length > 0) {
    const validProjects = form.projects.filter((p) => p.name.trim());
    if (validProjects.length > 0) {
      lines.push('## Projects');
      lines.push('');
      
      for (const proj of validProjects) {
        const headerParts = [proj.name.trim()];
        if (proj.role?.trim()) headerParts.push(proj.role.trim());
        if (proj.timePeriod?.trim()) headerParts.push(proj.timePeriod.trim());
        
        lines.push(`### ${headerParts.join(' | ')}`);
        lines.push('');
        
        for (const bullet of proj.bullets) {
          if (bullet.trim()) {
            lines.push(`- ${bullet.trim()}`);
          }
        }
        lines.push('');
      }
    }
  }

  // 教育经历
  if (form.education.length > 0) {
    lines.push('## Education');
    lines.push('');
    
    for (const edu of form.education) {
      if (!edu.school.trim()) continue;
      
      const parts = [edu.school.trim()];
      if (edu.major?.trim()) parts.push(edu.major.trim());
      if (edu.degree?.trim()) parts.push(edu.degree.trim());
      if (edu.timePeriod.trim()) parts.push(edu.timePeriod.trim());
      
      lines.push(`- ${parts.join(' | ')}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
