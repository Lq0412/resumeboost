import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatTime, A4_WIDTH, A4_HEIGHT } from './utils';
import type { useBuilderForm } from './useBuilderForm';

type DensityMode = 'normal' | 'compact' | 'tight';
type FormData = ReturnType<typeof useBuilderForm>['form'];

const pdfStyles = {
  normal: { 
    padding: 40, 
    titleSize: 24, 
    sectionTitle: 15, 
    text: 14, 
    smallText: 13, 
    sectionGap: 20, 
    itemGap: 10, 
    lineHeight: 1.5, 
    photoW: 80, 
    photoH: 112, 
    h2Pb: 10 
  },
  compact: { 
    padding: 32, 
    titleSize: 20, 
    sectionTitle: 14, 
    text: 13, 
    smallText: 12, 
    sectionGap: 14, 
    itemGap: 8, 
    lineHeight: 1.4, 
    photoW: 72, 
    photoH: 100, 
    h2Pb: 8 
  },
  tight: { 
    padding: 24, 
    titleSize: 18, 
    sectionTitle: 12, 
    text: 12, 
    smallText: 11, 
    sectionGap: 10, 
    itemGap: 6, 
    lineHeight: 1.3, 
    photoW: 64, 
    photoH: 88, 
    h2Pb: 6 
  },
};

function buildResumeHTML(form: FormData, densityMode: DensityMode): string {
  const s = pdfStyles[densityMode];
  let html = `<div style="width:794px;padding:${s.padding}px;background:#fff;font-family:'Microsoft YaHei','PingFang SC',sans-serif;color:#374151;font-size:${s.text}px;line-height:${s.lineHeight};">`;
  
  // 头部
  html += `<div style="display:flex;margin-bottom:${s.sectionGap}px;">`;
  html += `<div style="flex:1;padding-right:16px;">`;
  if (form.basicInfo.name) {
    html += `<h1 style="font-size:${s.titleSize}px;font-weight:bold;color:#111827;margin:0 0 4px 0;">${form.basicInfo.name}</h1>`;
  }
  if (form.basicInfo.jobTitle) {
    html += `<p style="font-size:${s.text}px;color:#374151;margin:0 0 4px 0;">求职意向：${form.basicInfo.jobTitle}</p>`;
  }
  
  const contacts: string[] = [];
  if (form.basicInfo.phone) contacts.push(`📱 ${form.basicInfo.phone}`);
  if (form.basicInfo.email) contacts.push(`✉️ ${form.basicInfo.email}`);
  if (form.basicInfo.city) contacts.push(`📍 ${form.basicInfo.city}`);
  if (form.basicInfo.status) contacts.push(`🔵 ${form.basicInfo.status}`);
  if (form.basicInfo.birthYear) {
    contacts.push(`🎂 ${form.basicInfo.birthYear}${form.basicInfo.birthMonth ? `-${form.basicInfo.birthMonth}` : ''}`);
  }
  if (form.basicInfo.hometown) contacts.push(`🏠 ${form.basicInfo.hometown}`);
  if (form.basicInfo.github) contacts.push(`🔗 ${form.basicInfo.github}`);
  if (form.basicInfo.website) contacts.push(`🌐 ${form.basicInfo.website}`);
  
  if (contacts.length > 0) {
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;color:#4b5563;font-size:${s.smallText}px;">`;
    contacts.forEach(c => { html += `<span>${c}</span>`; });
    html += `</div>`;
  }
  html += `</div>`;
  if (form.photo) {
    html += `<img src="${form.photo}" style="width:${s.photoW}px;height:${s.photoH}px;object-fit:cover;border-radius:4px;flex-shrink:0;" />`;
  }
  html += `</div>`;

  // 教育经历
  const validEdu = form.education.filter(e => e.school);
  if (validEdu.length > 0) {
    html += `<div style="margin-bottom:${s.sectionGap}px;">`;
    html += `<h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">教育经历</h2>`;
    validEdu.forEach(edu => {
      html += `<div style="margin-bottom:${s.itemGap}px;">`;
      html += `<div style="display:flex;justify-content:space-between;">`;
      html += `<span style="font-weight:600;">${edu.school}`;
      if (edu.major) html += `<span style="color:#4b5563;font-weight:normal;margin-left:12px;">${edu.major}</span>`;
      if (edu.degree) html += `<span style="color:#6b7280;font-weight:normal;margin-left:8px;">${edu.degree}</span>`;
      html += `</span>`;
      html += `<span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}</span>`;
      html += `</div>`;
      if (edu.description) {
        html += `<p style="color:#374151;font-size:${s.smallText}px;margin:4px 0 0 0;">${edu.description}</p>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // 专业技能
  const validSkills = form.skillCategories?.filter(c => c.name) || [];
  if (validSkills.length > 0 || form.skills) {
    html += `<div style="margin-bottom:${s.sectionGap}px;">`;
    html += `<h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">专业技能</h2>`;
    if (validSkills.length > 0) {
      validSkills.forEach(cat => {
        html += `<div style="margin-bottom:${s.itemGap - 2}px;">`;
        html += `<span style="font-weight:600;">${cat.name}</span>`;
        if (cat.description) {
          html += `<p style="color:#374151;margin:2px 0 0 0;font-size:${s.smallText}px;">${cat.description}</p>`;
        }
        html += `</div>`;
      });
    } else if (form.skills) {
      html += `<p style="color:#374151;margin:0;font-size:${s.smallText}px;">${form.skills}</p>`;
    }
    html += `</div>`;
  }

  // 工作经历
  const validExp = form.experience.filter(e => e.company);
  if (validExp.length > 0) {
    html += `<div style="margin-bottom:${s.sectionGap}px;">`;
    html += `<h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 8px 0;">工作经历</h2>`;
    validExp.forEach(exp => {
      html += `<div style="margin-bottom:${s.itemGap}px;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
      html += `<span style="display:flex;align-items:center;">`;
      html += `<span style="font-weight:600;">${exp.company}</span>`;
      if (exp.position) html += `<span style="color:#4b5563;margin-left:8px;">${exp.position}</span>`;
      if (exp.location) html += `<span style="color:#6b7280;margin-left:8px;">${exp.location}</span>`;
      html += `</span>`;
      html += `<span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}</span>`;
      html += `</div>`;
      const bullets = exp.bullets.filter(b => b && b.trim());
      if (bullets.length > 0) {
        html += `<p style="color:#374151;margin:0;font-size:${s.smallText}px;">${bullets.join(' ')}</p>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // 项目经历
  const validProj = form.projects.filter(p => p.name);
  if (validProj.length > 0) {
    html += `<div style="margin-bottom:${s.sectionGap}px;">`;
    html += `<h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 8px 0;">项目经历</h2>`;
    validProj.forEach(proj => {
      html += `<div style="margin-bottom:${s.itemGap}px;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
      html += `<span style="display:flex;align-items:center;">`;
      html += `<span style="font-weight:600;">${proj.name}</span>`;
      if (proj.role) html += `<span style="color:#4b5563;margin-left:8px;">${proj.role}</span>`;
      if (proj.link) {
        html += ` <a href="${proj.link}" style="color:#2563eb;font-size:${s.smallText - 1}px;margin-left:8px;">${proj.link}</a>`;
      }
      html += `</span>`;
      html += `<span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth)}</span>`;
      html += `</div>`;
      const bullets = proj.bullets.filter(b => b && b.trim());
      if (bullets.length > 0) {
        html += `<ul style="margin:0;padding-left:16px;">`;
        bullets.forEach(b => {
          html += `<li style="color:#374151;font-size:${s.smallText}px;margin-bottom:2px;">${b}</li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // 荣誉奖项
  const validAwards = form.awards?.filter(a => a.name) || [];
  if (validAwards.length > 0) {
    html += `<div style="margin-bottom:${s.sectionGap}px;">`;
    html += `<h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">荣誉奖项</h2>`;
    validAwards.forEach(award => {
      html += `<div style="display:flex;justify-content:space-between;margin-bottom:4px;">`;
      html += `<span style="font-size:${s.smallText}px;">${award.name}</span>`;
      if (award.time) {
        html += `<span style="color:#6b7280;font-size:${s.smallText}px;">${award.time}</span>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

export async function exportToPDF(form: FormData, densityMode: DensityMode): Promise<void> {
  // 创建独立的渲染容器
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(container);
  
  try {
    const html = buildResumeHTML(form, densityMode);
    container.innerHTML = html;

    // 使用 html2canvas 截图
    const canvas = await html2canvas(container.firstChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });
    
    // 创建 PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // 只有当内容真正超过一页时才分页
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // 多页处理
      const pageCount = Math.ceil(imgHeight / pdfHeight);
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();
        const srcY = i * pdfHeight * (canvas.width / pdfWidth);
        const srcH = Math.min(pdfHeight * (canvas.width / pdfWidth), canvas.height - srcY);
        const destH = srcH * (pdfWidth / canvas.width);
        
        // 创建临时 canvas 裁剪当前页
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        const ctx = pageCanvas.getContext('2d');
        ctx?.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, destH);
      }
    }
    
    pdf.save(`${form.basicInfo.name || '简历'}_ResumeBoost.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
