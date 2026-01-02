import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { mask } from '../../lib';
import { showToast, LoadingSkeleton } from '../../components';
import { api, handleAPIError } from '../../lib/api';
import { ResumePreview } from './ResumePreview';
import { EditablePreview } from './EditablePreview';
import { CompactInput, CompactDateRange } from './FormInputs';
import { useAutoResizeTextarea, useDragResize } from './hooks';
import { exportToPDF } from './pdfExport';
import { mapSectionFromTitle, MAX_PHOTO_SIZE, MIN_RESUME_LENGTH } from './utils';

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
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [editMode, setEditMode] = useState<'form' | 'preview'>('preview'); // 默认使用可编辑预览

  // 处理预览区点击，跳转到对应的表单 Tab
  const handlePreviewSectionClick = (section: EditTab) => {
    setActiveTab(section);
  };
  
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

  const { handleResize: handleTextareaResize, handleFocus: handleTextareaFocus } = useAutoResizeTextarea();
  
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
  useDragResize(isDraggingLeft, setLeftWidth, 260, 450);
  useDragResize(isDraggingRight, setRightWidth, 220, 350, true);

  // AI 分析
  const handleAnalyze = async () => {
    const markdown = formToMarkdown(form);
    if (markdown.trim().length < MIN_RESUME_LENGTH) {
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
      setAiResult({
        issues: (result.issues || []).map((i: { title: string; why: string; how: string }) => ({ 
          ...i, 
          section: mapSectionFromTitle(i.title) 
        })),
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
    if (markdown.trim().length < MIN_RESUME_LENGTH) {
      showToast('请至少填写一些基本信息', 'error');
      return;
    }
    setShowAISidebar(true);
  };

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem('resumeboost_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
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
    if (file.size > MAX_PHOTO_SIZE) {
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
      localStorage.setItem('resumeboost_draft', JSON.stringify(form));
      showToast('草稿已保存', 'success');
    } catch (e) {
      console.error('Save draft error:', e);
      showToast('保存失败', 'error');
    }
  };

  // 导出 PDF
  const handleExportPDF = async () => {
    const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);
    if (!hasContent) {
      showToast('请至少填写一些基本信息', 'error');
      return;
    }

    showToast('正在生成 PDF...', 'info');
    
    try {
      await exportToPDF(form, densityMode);
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
      <header className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>
            ResumeBoost
          </h1>
          {hasDraft && (
            <button onClick={handleLoadDraft} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
              📝 加载草稿
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveDraft} 
            className="px-3 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all shadow-sm hover:shadow"
          >
            💾 保存
          </button>
          <button 
            onClick={handleExportPDF} 
            className="px-3 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all shadow-sm hover:shadow"
          >
            📄 导出
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm hover:shadow font-medium"
          >
            ✨ AI 优化
          </button>
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
                className={`flex-1 px-2 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="block text-sm mb-0.5">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {/* 基本信息 */}
            {activeTab === 'basic' && (
              <div className="space-y-3">
                {/* 照片区域 - 顶部居中 */}
                <div className="flex justify-center">
                  <div className="text-center">
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <div 
                      onClick={() => photoInputRef.current?.click()} 
                      className="w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all overflow-hidden mx-auto group"
                    >
                      {form.photo ? (
                        <img src={form.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <span className="text-gray-400 text-2xl group-hover:text-blue-500 transition-colors">📷</span>
                          <p className="text-xs text-gray-400 mt-1">上传照片</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {form.photo ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPhoto(''); }} 
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          删除照片
                        </button>
                      ) : (
                        '支持 JPG、PNG，不超过 2MB'
                      )}
                    </p>
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
                <details className="text-xs">
                  <summary className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium py-1">+ 更多信息</summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-gray-200">
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
                    <textarea 
                      value={edu.description || ''} 
                      onChange={(e) => { 
                        updateEducation(edu.id, 'description', e.target.value); 
                        handleTextareaResize(e);
                      }} 
                      onFocus={handleTextareaFocus}
                      className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                      placeholder="校园经历、获奖情况等" 
                    />
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
                    <textarea 
                      value={cat.description} 
                      onChange={(e) => { 
                        updateSkillCategory(cat.id, 'description', e.target.value); 
                        handleTextareaResize(e);
                      }} 
                      onFocus={handleTextareaFocus}
                      className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                      placeholder="技能详细描述" 
                    />
                  </div>
                ))}
                {(!form.skillCategories || form.skillCategories.length === 0) && (
                  <textarea 
                    value={form.skills} 
                    onChange={(e) => { 
                      updateSkills(e.target.value); 
                      handleTextareaResize(e);
                    }} 
                    onFocus={handleTextareaFocus}
                    className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                    placeholder="技能列表..." 
                  />
                )}
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
                    <textarea 
                      value={exp.bullets.join('\n')} 
                      onChange={(e) => { 
                        const lines = e.target.value.split('\n'); 
                        lines.forEach((line, i) => { 
                          if (i < exp.bullets.length) updateExperienceBullet(exp.id, i, line); 
                        }); 
                        handleTextareaResize(e);
                      }} 
                      onFocus={handleTextareaFocus}
                      className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                      placeholder="工作内容和成果（每行一条）" 
                    />
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
        <div 
          className="w-1 bg-gray-300 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize flex-shrink-0 transition-colors" 
          onMouseDown={() => setIsDraggingLeft(true)} 
        />

        {/* 中间：预览区 */}
        <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-500 to-gray-600 flex flex-col overflow-hidden">
          <div className="h-10 bg-gray-700 px-4 flex items-center justify-between flex-shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-100">📄 简历预览</span>
              <div className="flex items-center bg-gray-600 rounded-md p-0.5">
                <button
                  onClick={() => setEditMode('preview')}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    editMode === 'preview' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ✏️ 可编辑
                </button>
                <button
                  onClick={() => setEditMode('form')}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    editMode === 'form' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  👁️ 只读
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOverflowing && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-400/50 rounded-md">
                  <span className="text-xs text-amber-300 font-medium animate-pulse">
                    ⚠️ 超过1页
                  </span>
                </div>
              )}
              <select 
                value={densityMode} 
                onChange={(e) => setDensityMode(e.target.value as DensityMode)} 
                className={`text-xs bg-gray-600 text-gray-100 border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isOverflowing ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-gray-500'
                }`}
              >
                <option value="normal">标准</option>
                <option value="compact">紧凑</option>
                <option value="tight">极简</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start custom-scrollbar">
            {editMode === 'preview' ? (
              <EditablePreview 
                form={form} 
                densityMode={densityMode} 
                previewRef={previewRef} 
                onOverflowChange={setIsOverflowing}
                onSectionClick={handlePreviewSectionClick}
                onUpdateBasicInfo={updateBasicInfo}
                onUpdateEducation={updateEducation}
                onUpdateExperience={updateExperience}
                onUpdateExperienceBullet={updateExperienceBullet}
                onUpdateProject={updateProject}
                onUpdateProjectBullet={updateProjectBullet}
                onUpdateSkillCategory={updateSkillCategory}
                onUpdateSkills={updateSkills}
                onUpdateAward={updateAward}
              />
            ) : (
              <ResumePreview 
                form={form} 
                densityMode={densityMode} 
                previewRef={previewRef} 
                onOverflowChange={setIsOverflowing}
              />
            )}
          </div>
        </div>

        {/* AI 侧边栏 */}
        {showAISidebar && (
          <div 
            className="w-1 bg-gray-300 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize flex-shrink-0 transition-colors" 
            onMouseDown={() => setIsDraggingRight(true)} 
          />
        )}
        {showAISidebar && (
          <div className="flex-shrink-0 bg-white border-l border-gray-200 flex flex-col" style={{ width: rightWidth }}>
            <div className="h-10 bg-gradient-to-r from-blue-50 to-purple-50 px-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-800">✨ AI 助手</span>
              <button 
                onClick={() => setShowAISidebar(false)} 
                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">职位描述（可选）</label>
                <textarea 
                  value={jdText} 
                  onChange={(e) => { 
                    setJdText(e.target.value); 
                    handleTextareaResize(e);
                  }} 
                  onFocus={handleTextareaFocus}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px] placeholder:text-gray-400" 
                  placeholder="粘贴目标职位的 JD，AI 将提供针对性建议" 
                />
              </div>
              <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing} 
                className="w-full py-2.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-medium"
              >
                {isAnalyzing ? '🔄 分析中...' : '🚀 开始分析'}
              </button>
              {isAnalyzing && <LoadingSkeleton lines={3} />}
              {!isAnalyzing && !aiResult && (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-2xl mb-2">🤖</div>
                  <p className="text-xs">点击上方按钮开始分析</p>
                </div>
              )}
              {!isAnalyzing && aiResult && (
                <div className="space-y-3">
                  {aiResult.issues.length > 0 ? (
                    aiResult.issues.map((issue, i) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                        <p className="font-semibold text-amber-900 mb-1">{issue.title}</p>
                        <p className="text-amber-800 mb-2">{issue.why}</p>
                        <div className="text-gray-700 bg-white p-2 rounded border border-amber-100">
                          💡 {issue.how}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-center">
                      <span className="text-green-700 font-medium">✓ 简历质量良好</span>
                    </div>
                  )}
                  {aiResult.actions.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-800 mb-2">优化建议</p>
                      <div className="space-y-1.5">
                        {aiResult.actions.map((a, i) => (
                          <div key={i} className="flex gap-2 text-xs text-gray-600">
                            <span className="text-green-600 flex-shrink-0">✓</span>
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
