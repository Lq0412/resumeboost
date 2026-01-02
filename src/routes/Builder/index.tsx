import { useNavigate, } from 'react-router-dom';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { mask } from '../../lib';
import { showToast, LoadingSkeleton } from '../../components';
import { api, handleAPIError } from '../../lib/api';
import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type DensityMode = 'normal' | 'compact' | 'tight';
type EditTab = 'basic' | 'edu' | 'skill' | 'work' | 'project' | 'award';

interface AIIssue {
  section: string;
  title: string;
  why: string;
  how: string;
}

interface AIResult {
  issues: AIIssue[];
  actions: string[];
}

export default function Builder() {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [densityMode, setDensityMode] = useState<DensityMode>('normal');
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem('resumeboost_draft'));
  
  // Cursor 风格：Tab 切换 + AI 侧边栏
  const [activeTab, setActiveTab] = useState<EditTab>('basic');
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  
  // 可拖拽调节宽度
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(280);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  const {
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
    loadForm,
  } = useBuilderForm();

  // 拖拽调节宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(260, Math.min(450, e.clientX)));
      }
      if (isDraggingRight) {
        setRightWidth(Math.max(220, Math.min(350, window.innerWidth - e.clientX)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  // AI 分析
  const handleAnalyze = async () => {
    const markdown = formToMarkdown(form);
    if (markdown.trim().length < 50) {
      showToast('请先填写简历内容', 'error');
      return;
    }
    setIsAnalyzing(true);
    try {
      const { masked } = mask(markdown);
      const result = await api.analyze({
        resume_text: masked,
        jd_text: jdText ? mask(jdText).masked : null,
        lang: 'auto',
        mask_enabled: true,
      });
      const mapSection = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('教育') || t.includes('学历')) return 'education';
        if (t.includes('技能') || t.includes('技术')) return 'skills';
        if (t.includes('工作') || t.includes('实习')) return 'experience';
        if (t.includes('项目')) return 'projects';
        if (t.includes('奖') || t.includes('荣誉')) return 'awards';
        return 'general';
      };
      setAiResult({
        issues: (result.issues || []).map((i: { title: string; why: string; how: string }) => ({ ...i, section: mapSection(i.title) })),
        actions: result.actions || [],
      });
      showToast('AI 分析完成', 'success');
    } catch (error) {
      handleAPIError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenAI = () => {
    const markdown = formToMarkdown(form);
    if (markdown.trim().length < 50) {
      showToast('请至少填写一些基本信息', 'error');
      return;
    }
    setShowAISidebar(true);
  };

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem('resumeboost_draft');
      console.log('Loading draft:', draft);
      if (draft) {
        const parsed = JSON.parse(draft);
        console.log('Parsed draft:', parsed);
        loadForm(parsed);
        showToast('草稿已加载', 'success');
        setHasDraft(false);
      }
    } catch (e) {
      console.error('Load draft error:', e);
      showToast('加载草稿失败', 'error');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('图片大小不能超过 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 保存草稿到本地存储
  const handleSaveDraft = () => {
    try {
      console.log('Saving draft:', form);
      localStorage.setItem('resumeboost_draft', JSON.stringify(form));
      showToast('草稿已保存', 'success');
    } catch (e) {
      console.error('Save draft error:', e);
      showToast('保存失败', 'error');
    }
  };

  // 导出 PDF - 创建独立渲染容器避免 oklch 颜色问题
  const handleExportPDF = async () => {
    const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);
    if (!hasContent) {
      showToast('请至少填写一些基本信息', 'error');
      return;
    }

    showToast('正在生成 PDF...', 'info');
    
    try {
      // 根据密度模式设置样式参数
      const pdfStyles = {
        normal: { padding: 40, titleSize: 24, sectionTitle: 15, text: 14, smallText: 13, sectionGap: 20, itemGap: 10, lineHeight: 1.5, photoW: 80, photoH: 112, h2Pb: 10 },
        compact: { padding: 32, titleSize: 20, sectionTitle: 14, text: 13, smallText: 12, sectionGap: 14, itemGap: 8, lineHeight: 1.4, photoW: 72, photoH: 100, h2Pb: 8 },
        tight: { padding: 24, titleSize: 18, sectionTitle: 12, text: 12, smallText: 11, sectionGap: 10, itemGap: 6, lineHeight: 1.3, photoW: 64, photoH: 88, h2Pb: 6 },
      };
      const s = pdfStyles[densityMode];

      // 创建独立的渲染容器，使用纯内联样式
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(container);
      
      const formatTime = (sy?: string, sm?: string, ey?: string, em?: string) => {
        if (!sy) return '';
        const start = sm ? `${sy}-${sm}` : sy;
        if (!ey) return start;
        if (ey === 'present') return `${start} ~ 至今`;
        return `${start} ~ ${ey}${em ? `-${em}` : ''}`;
      };

      // 构建纯 HTML 内容，所有样式内联（去掉 min-height 避免空白页）
      let html = `<div style="width:794px;padding:${s.padding}px;background:#fff;font-family:'Microsoft YaHei','PingFang SC',sans-serif;color:#374151;font-size:${s.text}px;line-height:${s.lineHeight};">`;
      
      // 头部
      html += `<div style="display:flex;margin-bottom:${s.sectionGap}px;">`;
      html += `<div style="flex:1;padding-right:16px;">`;
      if (form.basicInfo.name) html += `<h1 style="font-size:${s.titleSize}px;font-weight:bold;color:#111827;margin:0 0 4px 0;">${form.basicInfo.name}</h1>`;
      if (form.basicInfo.jobTitle) html += `<p style="font-size:${s.text}px;color:#374151;margin:0 0 4px 0;">求职意向：${form.basicInfo.jobTitle}</p>`;
      
      const contacts: string[] = [];
      if (form.basicInfo.phone) contacts.push(`📱 ${form.basicInfo.phone}`);
      if (form.basicInfo.email) contacts.push(`✉️ ${form.basicInfo.email}`);
      if (form.basicInfo.city) contacts.push(`📍 ${form.basicInfo.city}`);
      if (form.basicInfo.status) contacts.push(`🔵 ${form.basicInfo.status}`);
      if (form.basicInfo.birthYear) contacts.push(`🎂 ${form.basicInfo.birthYear}${form.basicInfo.birthMonth ? `-${form.basicInfo.birthMonth}` : ''}`);
      if (form.basicInfo.hometown) contacts.push(`🏠 ${form.basicInfo.hometown}`);
      if (form.basicInfo.github) contacts.push(`🔗 ${form.basicInfo.github}`);
      if (form.basicInfo.website) contacts.push(`🌐 ${form.basicInfo.website}`);
      
      if (contacts.length > 0) {
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;color:#4b5563;font-size:${s.smallText}px;">`;
        contacts.forEach(c => { html += `<span>${c}</span>`; });
        html += `</div>`;
      }
      html += `</div>`;
      if (form.photo) html += `<img src="${form.photo}" style="width:${s.photoW}px;height:${s.photoH}px;object-fit:cover;border-radius:4px;flex-shrink:0;" />`;
      html += `</div>`;

      // 教育经历
      const validEdu = form.education.filter(e => e.school);
      if (validEdu.length > 0) {
        html += `<div style="margin-bottom:${s.sectionGap}px;"><h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">教育经历</h2>`;
        validEdu.forEach(edu => {
          html += `<div style="margin-bottom:${s.itemGap}px;"><div style="display:flex;justify-content:space-between;"><span style="font-weight:600;">${edu.school}${edu.major ? `<span style="color:#4b5563;font-weight:normal;margin-left:12px;">${edu.major}</span>` : ''}${edu.degree ? `<span style="color:#6b7280;font-weight:normal;margin-left:8px;">${edu.degree}</span>` : ''}</span><span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}</span></div>`;
          if (edu.description) html += `<p style="color:#374151;font-size:${s.smallText}px;margin:4px 0 0 0;">${edu.description}</p>`;
          html += `</div>`;
        });
        html += `</div>`;
      }

      // 专业技能
      const validSkills = form.skillCategories?.filter(c => c.name) || [];
      if (validSkills.length > 0 || form.skills) {
        html += `<div style="margin-bottom:${s.sectionGap}px;"><h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">专业技能</h2>`;
        if (validSkills.length > 0) {
          validSkills.forEach(cat => {
            html += `<div style="margin-bottom:${s.itemGap - 2}px;"><span style="font-weight:600;">${cat.name}</span>`;
            if (cat.description) html += `<p style="color:#374151;margin:2px 0 0 0;font-size:${s.smallText}px;">${cat.description}</p>`;
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
        html += `<div style="margin-bottom:${s.sectionGap}px;"><h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 8px 0;">工作经历</h2>`;
        validExp.forEach(exp => {
          html += `<div style="margin-bottom:${s.itemGap}px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="display:flex;align-items:center;"><span style="font-weight:600;">${exp.company}</span>${exp.position ? `<span style="color:#4b5563;margin-left:8px;">${exp.position}</span>` : ''}${exp.location ? `<span style="color:#6b7280;margin-left:8px;">${exp.location}</span>` : ''}</span><span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}</span></div>`;
          const bullets = exp.bullets.filter(b => b && b.trim());
          if (bullets.length > 0) html += `<p style="color:#374151;margin:0;font-size:${s.smallText}px;">${bullets.join(' ')}</p>`;
          html += `</div>`;
        });
        html += `</div>`;
      }

      // 项目经历
      const validProj = form.projects.filter(p => p.name);
      if (validProj.length > 0) {
        html += `<div style="margin-bottom:${s.sectionGap}px;"><h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 8px 0;">项目经历</h2>`;
        validProj.forEach(proj => {
          html += `<div style="margin-bottom:${s.itemGap}px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="display:flex;align-items:center;"><span style="font-weight:600;">${proj.name}</span>${proj.role ? `<span style="color:#4b5563;margin-left:8px;">${proj.role}</span>` : ''}${proj.link ? ` <a href="${proj.link}" style="color:#2563eb;font-size:${s.smallText - 1}px;margin-left:8px;">${proj.link}</a>` : ''}</span><span style="color:#6b7280;font-size:${s.smallText}px;">${formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth)}</span></div>`;
          const bullets = proj.bullets.filter(b => b && b.trim());
          if (bullets.length > 0) {
            html += `<ul style="margin:0;padding-left:16px;">`;
            bullets.forEach(b => { html += `<li style="color:#374151;font-size:${s.smallText}px;margin-bottom:2px;">${b}</li>`; });
            html += `</ul>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      }

      // 荣誉奖项
      const validAwards = form.awards?.filter(a => a.name) || [];
      if (validAwards.length > 0) {
        html += `<div style="margin-bottom:${s.sectionGap}px;"><h2 style="font-size:${s.sectionTitle}px;font-weight:bold;color:#111827;border-bottom:2px solid #1f2937;padding-bottom:${s.h2Pb}px;margin:0 0 ${s.itemGap}px 0;">荣誉奖项</h2>`;
        validAwards.forEach(award => {
          html += `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:${s.smallText}px;">${award.name}</span>${award.time ? `<span style="color:#6b7280;font-size:${s.smallText}px;">${award.time}</span>` : ''}</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      container.innerHTML = html;

      // 使用 html2canvas 截图
      const canvas = await html2canvas(container.firstChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      document.body.removeChild(container);
      
      // 创建 PDF - 根据实际内容高度判断是否需要分页
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
      showToast('PDF 已下载', 'success');
    } catch (error) {
      console.error('PDF 生成失败:', error);
      showToast('PDF 生成失败，请重试', 'error');
    }
  };

  const handleSubmit = () => {
    handleOpenAI();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部工具栏 */}
      <header className="h-11 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>
            ResumeBoost
          </h1>
          {hasDraft && (
            <button onClick={handleLoadDraft} className="text-xs text-blue-600 hover:text-blue-800">📝 加载草稿</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 border border-gray-300 rounded">💾 保存</button>
          <button onClick={handleExportPDF} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 border border-gray-300 rounded">📄 导出</button>
          <button onClick={handleSubmit} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">✨ AI 优化</button>
        </div>
      </header>

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑区 */}
        <div className="flex-shrink-0 bg-white border-r border-gray-200 flex flex-col" style={{ width: leftWidth }}>
          {/* Tab 导航 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'basic' as EditTab, label: '基本', icon: '👤' },
              { id: 'edu' as EditTab, label: '教育', icon: '🎓' },
              { id: 'skill' as EditTab, label: '技能', icon: '💡' },
              { id: 'work' as EditTab, label: '工作', icon: '💼' },
              { id: 'project' as EditTab, label: '项目', icon: '🚀' },
              { id: 'award' as EditTab, label: '奖项', icon: '🏆' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-1 py-1.5 text-xs transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* 基本信息 */}
            {activeTab === 'basic' && (
              <div className="space-y-3">
                {/* 照片区域 - 顶部居中 */}
                <div className="flex justify-center">
                  <div className="text-center">
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <div onClick={() => photoInputRef.current?.click()} className="w-16 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden mx-auto">
                      {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-lg">📷</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{form.photo ? <button onClick={() => setPhoto('')} className="text-red-500 hover:text-red-600">删除照片</button> : '点击上传'}</p>
                  </div>
                </div>
                {/* 基本信息表单 */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <CompactInput label="姓名" value={form.basicInfo.name || ''} onChange={(v) => updateBasicInfo('name', v)} placeholder="张三" />
                    <CompactInput label="求职意向" value={form.basicInfo.jobTitle || ''} onChange={(v) => updateBasicInfo('jobTitle', v)} placeholder="Java开发" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <CompactInput label="手机" value={form.basicInfo.phone} onChange={(v) => updateBasicInfo('phone', v)} placeholder="138xxxx" />
                    <CompactInput label="邮箱" value={form.basicInfo.email} onChange={(v) => updateBasicInfo('email', v)} placeholder="email" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <CompactInput label="状态" value={form.basicInfo.status || ''} onChange={(v) => updateBasicInfo('status', v)} placeholder="在职/应届" />
                    <CompactInput label="城市" value={form.basicInfo.city || ''} onChange={(v) => updateBasicInfo('city', v)} placeholder="北京" />
                  </div>
                </div>
                <details className="text-xs" open>
                  <summary className="text-blue-600 cursor-pointer hover:text-blue-800">+ 更多信息</summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-gray-100">
                    <CompactInput label="GitHub" value={form.basicInfo.github || ''} onChange={(v) => updateBasicInfo('github', v)} placeholder="github.com/xxx" />
                    <CompactInput label="网站" value={form.basicInfo.website || ''} onChange={(v) => updateBasicInfo('website', v)} placeholder="yoursite.com" />
                    <CompactInput label="籍贯" value={form.basicInfo.hometown || ''} onChange={(v) => updateBasicInfo('hometown', v)} placeholder="广东" />
                  </div>
                </details>
              </div>
            )}

            {/* 教育经历 */}
            {activeTab === 'edu' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">教育经历</span><button onClick={addEducation} className="text-xs text-blue-600">+ 添加</button></div>
                {form.education.map((edu, idx) => (
                  <div key={edu.id} className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1.5">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">#{idx + 1}</span>{form.education.length > 1 && <button onClick={() => removeEducation(edu.id)} className="text-xs text-red-500">删除</button>}</div>
                    <CompactInput value={edu.school} onChange={(v) => updateEducation(edu.id, 'school', v)} placeholder="学校" />
                    <div className="flex gap-1"><CompactInput value={edu.major || ''} onChange={(v) => updateEducation(edu.id, 'major', v)} placeholder="专业" /><CompactInput value={edu.degree || ''} onChange={(v) => updateEducation(edu.id, 'degree', v)} placeholder="学历" /></div>
                    <CompactDateRange startYear={edu.startYear} startMonth={edu.startMonth} endYear={edu.endYear} endMonth={edu.endMonth} onStartChange={(y, m) => { updateEducation(edu.id, 'startYear', y); updateEducation(edu.id, 'startMonth', m); }} onEndChange={(y, m) => { updateEducation(edu.id, 'endYear', y); updateEducation(edu.id, 'endMonth', m); }} />
                    <textarea value={edu.description || ''} onChange={(e) => { updateEducation(edu.id, 'description', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onFocus={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="w-full px-2 py-1 text-xs border border-gray-200 rounded resize-none min-h-[32px]" placeholder="校园经历" />
                  </div>
                ))}
              </div>
            )}

            {/* 专业技能 */}
            {activeTab === 'skill' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">专业技能</span><button onClick={addSkillCategory} className="text-xs text-blue-600">+ 添加</button></div>
                {form.skillCategories?.map((cat, idx) => (
                  <div key={cat.id} className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1.5">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">#{idx + 1}</span>{form.skillCategories!.length > 1 && <button onClick={() => removeSkillCategory(cat.id)} className="text-xs text-red-500">删除</button>}</div>
                    <CompactInput value={cat.name} onChange={(v) => updateSkillCategory(cat.id, 'name', v)} placeholder="技能名称" />
                    <textarea value={cat.description} onChange={(e) => updateSkillCategory(cat.id, 'description', e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-200 rounded resize-none" rows={2} placeholder="描述" />
                  </div>
                ))}
                {(!form.skillCategories || form.skillCategories.length === 0) && <textarea value={form.skills} onChange={(e) => updateSkills(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded" rows={4} placeholder="技能列表..." />}
              </div>
            )}

            {/* 工作经历 */}
            {activeTab === 'work' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">工作经历</span><button onClick={addExperience} className="text-xs text-blue-600">+ 添加</button></div>
                {form.experience.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">暂无</p>}
                {form.experience.map((exp, idx) => (
                  <div key={exp.id} className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1.5">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">#{idx + 1}</span><button onClick={() => removeExperience(exp.id)} className="text-xs text-red-500">删除</button></div>
                    <div className="flex gap-1"><CompactInput value={exp.company} onChange={(v) => updateExperience(exp.id, 'company', v)} placeholder="公司" /><CompactInput value={exp.position} onChange={(v) => updateExperience(exp.id, 'position', v)} placeholder="职位" /></div>
                    <CompactInput value={exp.location || ''} onChange={(v) => updateExperience(exp.id, 'location', v)} placeholder="地点" />
                    <CompactDateRange startYear={exp.startYear} startMonth={exp.startMonth} endYear={exp.endYear} endMonth={exp.endMonth} onStartChange={(y, m) => { updateExperience(exp.id, 'startYear', y); updateExperience(exp.id, 'startMonth', m); }} onEndChange={(y, m) => { updateExperience(exp.id, 'endYear', y); updateExperience(exp.id, 'endMonth', m); }} showPresent />
                    <textarea value={exp.bullets.join('\n')} onChange={(e) => { const lines = e.target.value.split('\n'); lines.forEach((line, i) => { if (i < exp.bullets.length) updateExperienceBullet(exp.id, i, line); }); }} className="w-full px-2 py-1 text-xs border border-gray-200 rounded resize-none" rows={3} placeholder="工作内容" />
                  </div>
                ))}
              </div>
            )}

            {/* 项目经历 */}
            {activeTab === 'project' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">项目经历</span><button onClick={addProject} className="text-xs text-blue-600">+ 添加</button></div>
                {form.projects.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">暂无</p>}
                {form.projects.map((proj, idx) => (
                  <div key={proj.id} className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1.5">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">#{idx + 1}</span><button onClick={() => removeProject(proj.id)} className="text-xs text-red-500">删除</button></div>
                    <div className="flex gap-1"><CompactInput value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} placeholder="项目名" /><CompactInput value={proj.role || ''} onChange={(v) => updateProject(proj.id, 'role', v)} placeholder="角色" /></div>
                    <CompactInput value={proj.link || ''} onChange={(v) => updateProject(proj.id, 'link', v)} placeholder="链接" />
                    <CompactDateRange startYear={proj.startYear} startMonth={proj.startMonth} endYear={proj.endYear} endMonth={proj.endMonth} onStartChange={(y, m) => { updateProject(proj.id, 'startYear', y); updateProject(proj.id, 'startMonth', m); }} onEndChange={(y, m) => { updateProject(proj.id, 'endYear', y); updateProject(proj.id, 'endMonth', m); }} />
                    {proj.bullets.map((b, bi) => (<div key={bi} className="flex gap-1"><input value={b} onChange={(e) => updateProjectBullet(proj.id, bi, e.target.value)} className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded" placeholder="描述" />{proj.bullets.length > 1 && <button onClick={() => removeProjectBullet(proj.id, bi)} className="text-red-400 text-xs">×</button>}</div>))}
                    {proj.bullets.length < 5 && <button onClick={() => addProjectBullet(proj.id)} className="text-xs text-blue-600">+ 描述</button>}
                  </div>
                ))}
              </div>
            )}

            {/* 荣誉奖项 */}
            {activeTab === 'award' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">荣誉奖项</span><button onClick={addAward} className="text-xs text-blue-600">+ 添加</button></div>
                {(!form.awards || form.awards.length === 0) && <p className="text-xs text-gray-400 py-4 text-center">暂无</p>}
                {form.awards?.map((a) => (<div key={a.id} className="flex gap-1 items-center"><CompactInput value={a.name} onChange={(v) => updateAward(a.id, 'name', v)} placeholder="奖项" /><input value={a.time || ''} onChange={(e) => updateAward(a.id, 'time', e.target.value)} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded" placeholder="时间" /><button onClick={() => removeAward(a.id)} className="text-red-400 text-xs">×</button></div>))}
              </div>
            )}
          </div>
        </div>

        {/* 拖拽条 */}
        <div className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0" onMouseDown={() => setIsDraggingLeft(true)} />

        {/* 中间：预览区 */}
        <div className="flex-1 min-w-0 bg-gray-500 flex flex-col overflow-hidden">
          <div className="h-8 bg-gray-600 px-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-200">📄 预览</span>
            <select value={densityMode} onChange={(e) => setDensityMode(e.target.value as DensityMode)} className="text-xs bg-gray-500 text-gray-200 border border-gray-400 rounded px-1 py-0.5">
              <option value="normal">标准</option><option value="compact">紧凑</option><option value="tight">极简</option>
            </select>
          </div>
          <div className="flex-1 overflow-auto p-2 flex justify-center items-start">
            <ResumePreview form={form} densityMode={densityMode} previewRef={previewRef} />
          </div>
        </div>

        {/* AI 侧边栏 */}
        {showAISidebar && <div className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0" onMouseDown={() => setIsDraggingRight(true)} />}
        {showAISidebar && (
          <div className="flex-shrink-0 bg-white border-l border-gray-200 flex flex-col" style={{ width: rightWidth }}>
            <div className="h-8 bg-gray-50 px-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
              <span className="text-xs font-medium text-gray-700">✨ AI</span>
              <button onClick={() => setShowAISidebar(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} className="w-full h-14 px-2 py-1 text-xs border border-gray-200 rounded resize-none mb-2" placeholder="JD（可选）" />
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-2">{isAnalyzing ? '分析中...' : '🚀 分析'}</button>
              {isAnalyzing && <LoadingSkeleton lines={3} />}
              {!isAnalyzing && !aiResult && <div className="text-center py-4 text-gray-400"><div className="text-xl mb-1">🤖</div><p className="text-xs">点击分析</p></div>}
              {!isAnalyzing && aiResult && (
                <div className="space-y-2">
                  {aiResult.issues.length > 0 ? aiResult.issues.map((issue, i) => (<div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs"><p className="font-medium text-amber-800">{issue.title}</p><p className="text-amber-700">{issue.why}</p><p className="text-gray-600">💡 {issue.how}</p></div>)) : <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-center text-green-700">✓ 良好</div>}
                  {aiResult.actions.length > 0 && <div className="pt-2 border-t border-gray-200"><p className="text-xs font-medium text-gray-600 mb-1">建议</p>{aiResult.actions.map((a, i) => <p key={i} className="text-xs text-gray-500">✓ {a}</p>)}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A4 纸张尺寸常量 (mm -> px, 96dpi)
const A4_WIDTH = 210 * 3.78; // ~794px
const A4_HEIGHT = 297 * 3.78; // ~1123px

// 密度模式样式配置
const densityStyles = {
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

// 简历预览组件 - A4纸张模拟
function ResumePreview({ form, densityMode = 'normal', previewRef }: { 
  form: ReturnType<typeof useBuilderForm>['form']; 
  densityMode?: DensityMode;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [contentHeight, setContentHeight] = useState(0);
  
  const styles = densityStyles[densityMode];

  // 计算内容高度和页数
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [form, densityMode]);

  // 根据容器宽度自动调整缩放
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32; // 减去padding
        const newScale = Math.min(containerWidth / A4_WIDTH, 0.75);
        setScale(Math.max(newScale, 0.5));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const usedPercent = Math.min(100, Math.round((contentHeight / (A4_HEIGHT - styles.padding * 2)) * 100));
  const isOverflow = contentHeight > (A4_HEIGHT - styles.padding * 2);
  const pages = Math.ceil(contentHeight / (A4_HEIGHT - styles.padding * 2));

  const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);

  const formatTime = (startYear?: string, startMonth?: string, endYear?: string, endMonth?: string) => {
    if (!startYear) return '';
    const start = startMonth ? `${startYear}-${startMonth}` : startYear;
    if (!endYear) return start;
    if (endYear === 'present') return `${start} ~ 至今`;
    const end = endMonth ? `${endYear}-${endMonth}` : endYear;
    return `${start} ~ ${end}`;
  };

  if (!hasContent) {
    return (
      <div 
        ref={containerRef}
        className="w-full flex flex-col items-center"
      >
        <div 
          className="bg-white shadow-2xl flex items-center justify-center"
          style={{ 
            width: A4_WIDTH * scale, 
            height: A4_HEIGHT * scale,
          }}
        >
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-base">开始填写左侧表单</p>
            <p className="text-sm mt-1">简历将在这里实时显示</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 页面使用情况指示器 */}
      <div className="w-full max-w-md mb-3">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>页面使用: {usedPercent}%</span>
          <span>{isOverflow ? `⚠️ 约 ${pages} 页` : '✓ 1 页内'}</span>
        </div>
        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${isOverflow ? 'bg-amber-500' : usedPercent > 85 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        {isOverflow && (
          <p className="text-amber-400 text-xs mt-1">建议精简内容至 1 页，提高简历通过率</p>
        )}
      </div>

      {/* A4 纸张 */}
      <div 
        className="bg-white shadow-2xl relative overflow-hidden"
        style={{ 
          width: A4_WIDTH * scale, 
          height: A4_HEIGHT * scale,
        }}
      >
        {/* 内容区域 */}
        <div 
          ref={previewRef}
          className={styles.lineHeight}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: A4_WIDTH,
            minHeight: A4_HEIGHT,
            padding: styles.padding,
            fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
            backgroundColor: '#ffffff',
          }}
        >
          <div ref={contentRef}>
            {/* 头部 */}
            <div className={`${styles.sectionGap} flex`}>
              <div className="flex-1 pr-4">
                {form.basicInfo.name && <h1 className={`${styles.titleSize} font-bold text-gray-900 mb-1`}>{form.basicInfo.name}</h1>}
                {form.basicInfo.jobTitle && <p className={`${styles.textSize} text-gray-700 mb-1`}>求职意向：{form.basicInfo.jobTitle}</p>}
                <div className={`grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600 ${styles.textSize}`}>
                  {form.basicInfo.phone && <span>📱 {form.basicInfo.phone}</span>}
                  {form.basicInfo.email && <span>✉️ {form.basicInfo.email}</span>}
                  {form.basicInfo.city && <span>📍 {form.basicInfo.city}</span>}
                  {form.basicInfo.status && <span>🔵 {form.basicInfo.status}</span>}
                  {form.basicInfo.birthYear && (
                    <span>🎂 {form.basicInfo.birthYear}{form.basicInfo.birthMonth && `-${form.basicInfo.birthMonth}`}</span>
                  )}
                  {form.basicInfo.hometown && <span>🏠 {form.basicInfo.hometown}</span>}
                  {form.basicInfo.github && (
                    <a href={form.basicInfo.github.startsWith('http') ? form.basicInfo.github : `https://${form.basicInfo.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      🔗 {form.basicInfo.github}
                    </a>
                  )}
                  {form.basicInfo.website && (
                    <a href={form.basicInfo.website.startsWith('http') ? form.basicInfo.website : `https://${form.basicInfo.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      🌐 {form.basicInfo.website}
                    </a>
                  )}
                </div>
              </div>
              {form.photo && <img src={form.photo} alt="照片" className={`${densityMode === 'tight' ? 'w-16 h-22' : 'w-20 h-28'} object-cover rounded flex-shrink-0`} />}
            </div>

            {/* 教育经历 */}
            {form.education.some(e => e.school) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>教育经历</h2>
                {form.education.filter(e => e.school).map((edu) => (
                  <div key={edu.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="font-semibold">{edu.school}</span>{edu.major && <span className="text-gray-600 ml-3">{edu.major}</span>}{edu.degree && <span className="text-gray-500 ml-2">{edu.degree}</span>}</span>
                      <span className={`text-gray-500 ${styles.textSize}`}>{formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}</span>
                    </div>
                    {edu.description && <p className={`text-gray-700 ${styles.textSize} mt-1`}>{edu.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* 专业技能 */}
            {(form.skillCategories?.some(c => c.name) || form.skills) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>专业技能</h2>
                {form.skillCategories?.filter(c => c.name).map((cat) => (
                  <div key={cat.id} className={styles.itemGap}><span className="font-semibold">{cat.name}</span>{cat.description && <p className={`text-gray-700 mt-0.5 ${styles.textSize}`}>{cat.description}</p>}</div>
                ))}
                {!form.skillCategories?.length && form.skills && <p className={`text-gray-700 ${styles.textSize}`}>{form.skills}</p>}
              </div>
            )}

            {/* 工作经历 */}
            {form.experience.some(e => e.company) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>工作经历</h2>
                {form.experience.filter(e => e.company).map((exp) => (
                  <div key={exp.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center"><span className="font-semibold">{exp.company}</span>{exp.position && <span className="text-gray-600 ml-2">{exp.position}</span>}{exp.location && <span className="text-gray-500 ml-2">{exp.location}</span>}</span>
                      <span className={`text-gray-500 ${styles.textSize}`}>{formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}</span>
                    </div>
                    {exp.bullets.filter(b => b && b.trim()).length > 0 && <p className={`text-gray-700 ${styles.textSize}`}>{exp.bullets.filter(b => b && b.trim()).join(' ')}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* 项目经历 */}
            {form.projects.some(p => p.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>项目经历</h2>
                {form.projects.filter(p => p.name).map((proj) => (
                  <div key={proj.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center"><span className="font-semibold">{proj.name}</span>{proj.role && <span className="text-gray-600 ml-2">{proj.role}</span>}{proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className={`text-blue-600 ${styles.textSize} ml-2 hover:underline`}>{proj.link}</a>}</span>
                      <span className={`text-gray-500 ${styles.textSize}`}>{formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth)}</span>
                    </div>
                    {proj.bullets.filter(b => b && b.trim()).length > 0 && (
                      <ul className="space-y-0">{proj.bullets.filter(b => b && b.trim()).map((bullet, i) => (<li key={i} className={`text-gray-700 ${styles.textSize} flex`}><span className="mr-1">•</span><span>{bullet}</span></li>))}</ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 荣誉奖项 */}
            {form.awards?.some(a => a.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>荣誉奖项</h2>
                {form.awards.filter(a => a.name).map((award) => (<div key={award.id} className={`flex justify-between ${styles.itemGap}`}><span className={styles.textSize}>{award.name}</span>{award.time && <span className={`text-gray-500 ${styles.textSize}`}>{award.time}</span>}</div>))}
              </div>
            )}
          </div>
        </div>

        {/* 页面分割线指示 */}
        {isOverflow && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 pointer-events-none"
            style={{ top: (A4_HEIGHT - styles.padding) * scale }}
          >
            <span className="absolute right-2 -top-5 text-xs text-red-500 bg-white px-1">第1页结束</span>
          </div>
        )}
      </div>
    </div>
  );
}



// 紧凑输入框
function CompactInput({ label, value, onChange, placeholder }: { 
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex-1">
      {label && <label className="block text-xs text-gray-500 mb-0.5">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}

// 紧凑日期范围选择器
function CompactDateRange({ startYear, startMonth, endYear, endMonth, onStartChange, onEndChange, showPresent }: {
  startYear?: string; startMonth?: string; endYear?: string; endMonth?: string;
  onStartChange: (y: string, m: string) => void;
  onEndChange: (y: string, m: string) => void;
  showPresent?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const years = [...Array.from({ length: 5 }, (_, i) => String(currentYear + 5 - i)), ...Array.from({ length: 25 }, (_, i) => String(currentYear - i))];
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const sel = "px-1 py-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 min-w-0";
  
  return (
    <div className="flex items-center gap-1 text-xs flex-wrap">
      <div className="flex gap-0.5 flex-1 min-w-[90px]">
        <select value={startYear || ''} onChange={(e) => onStartChange(e.target.value, startMonth || '')} className={`${sel} flex-1`}>
          <option value="">年</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={startMonth || ''} onChange={(e) => onStartChange(startYear || '', e.target.value)} className={`${sel} w-10`}>
          <option value="">月</option>
          {months.map(m => <option key={m} value={m}>{parseInt(m)}</option>)}
        </select>
      </div>
      <span className="text-gray-400 flex-shrink-0">~</span>
      <div className="flex gap-0.5 flex-1 min-w-[90px]">
        <select value={endYear || ''} onChange={(e) => onEndChange(e.target.value, e.target.value === 'present' ? '' : (endMonth || ''))} className={`${sel} flex-1`}>
          <option value="">年</option>
          {showPresent && <option value="present">至今</option>}
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {endYear !== 'present' && (
          <select value={endMonth || ''} onChange={(e) => onEndChange(endYear || '', e.target.value)} className={`${sel} w-10`}>
            <option value="">月</option>
            {months.map(m => <option key={m} value={m}>{parseInt(m)}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
