/*  */import { useNavigate } from 'react-router-dom';
import { useRef, useState, useCallback, useMemo } from 'react';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { showToast } from '../../components';
import { api, handleAPIError } from '../../lib/api';
import { ResumePreview } from './ResumePreview';
import { EditablePreview } from './EditablePreview';
import { CompactInput, CompactDateRange } from './FormInputs';
import { useAutoResizeTextarea, useDragResize } from './hooks';
import { exportToPDF } from './pdfExport';
import { MAX_PHOTO_SIZE, MIN_RESUME_LENGTH } from './utils';
import { AISuggestionPanel } from './AISuggestionPanel';
import { useUndoStack } from './useUndoStack';
import type { AISuggestion, EditSuggestion } from './types';

type DensityMode = 'normal' | 'compact' | 'tight';
type EditTab = 'basic' | 'edu' | 'skill' | 'work' | 'project' | 'award';

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
  
  // AI 智能改写建议
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  
  // 可拖拽调节宽度
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(280);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const { handleResize: handleTextareaResize, handleFocus: handleTextareaFocus } = useAutoResizeTextarea();
  
  // 撤销栈
  const { pushState, popState, canUndo } = useUndoStack<typeof form>();
  
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
    loadForm,
  } = useBuilderForm();

  // 拖拽调节宽度
  useDragResize(isDraggingLeft, setLeftWidth, 260, 450);
  useDragResize(isDraggingRight, setRightWidth, 220, 350, true);

  // 解析 AI 返回的 path，获取 section 信息
  const parseSuggestionPath = useCallback((path: string): Pick<AISuggestion, 'section' | 'sectionLabel' | 'itemIndex' | 'bulletIndex' | 'field'> => {
    const parts = path.split('.');
    const sectionMap: Record<string, { section: AISuggestion['section']; label: string }> = {
      'experience': { section: 'work', label: '工作经历' },
      'projects': { section: 'project', label: '项目经历' },
      'education': { section: 'edu', label: '教育经历' },
      'skillCategories': { section: 'skill', label: '专业技能' },
      'basicInfo': { section: 'basic', label: '基本信息' },
    };
    
    const sectionKey = parts[0];
    const sectionInfo = sectionMap[sectionKey] || { section: 'basic' as const, label: '其他' };
    
    return {
      section: sectionInfo.section,
      sectionLabel: sectionInfo.label,
      itemIndex: parts[1] ? parseInt(parts[1]) : undefined,
      bulletIndex: parts[3] ? parseInt(parts[3]) : undefined,
      field: parts[2] || undefined,
    };
  }, []);

  const normalizeForCompare = useCallback((text: string) => text.replace(/\s+/g, ' ').trim(), []);
  const getChatAISuggestionId = useCallback((chatSuggestionId: string) => `chat-suggestion-${chatSuggestionId}`, []);

  const upsertChatSuggestionToAISuggestions = useCallback((suggestion: EditSuggestion, status: AISuggestion['status']) => {
    const originalNorm = normalizeForCompare(suggestion.original);
    const suggestedNorm = normalizeForCompare(suggestion.suggested);
    if (!originalNorm || !suggestedNorm || originalNorm === suggestedNorm) return;

    const id = getChatAISuggestionId(suggestion.id);
    const aiSuggestion: AISuggestion = {
      id,
      path: suggestion.path,
      ...parseSuggestionPath(suggestion.path),
      original: suggestion.original,
      suggested: suggestion.suggested,
      reason: suggestion.reason,
      status,
    };

    setAiSuggestions(prev => {
      const withoutSamePathPending = prev.filter(s => !(s.status === 'pending' && s.path === aiSuggestion.path && s.id !== id));
      const existingIndex = withoutSamePathPending.findIndex(s => s.id === id);

      if (existingIndex === -1) {
        return [aiSuggestion, ...withoutSamePathPending];
      }

      const next = [...withoutSamePathPending];
      next[existingIndex] = { ...next[existingIndex], ...aiSuggestion };
      return next;
    });
  }, [getChatAISuggestionId, normalizeForCompare, parseSuggestionPath]);

  const handleRegisterChatSuggestion = useCallback((suggestion: EditSuggestion) => {
    upsertChatSuggestionToAISuggestions(suggestion, 'pending');
  }, [upsertChatSuggestionToAISuggestions]);

  const handleRejectChatSuggestion = useCallback((suggestionId: string) => {
    const id = getChatAISuggestionId(suggestionId);
    setAiSuggestions(prev => prev.map(s => (s.id === id ? { ...s, status: 'rejected' as const } : s)));
  }, [getChatAISuggestionId]);

  type ResolvedEditTarget =
    | { kind: 'experienceBullet'; id: string; bulletIndex: number }
    | { kind: 'projectBullet'; id: string; bulletIndex: number }
    | { kind: 'experiencePosition'; id: string }
    | { kind: 'projectName'; id: string }
    | { kind: 'projectRole'; id: string }
    | { kind: 'educationDescription'; id: string }
    | { kind: 'skillCategoryDescription'; id: string }
    | { kind: 'basicInfoJobTitle' };

  const resolveSuggestionTarget = useCallback((suggestion: { path: string; original: string }): ResolvedEditTarget | null => {
    const parts = suggestion.path.split('.');
    const sectionKey = parts[0];
    const itemIndex = parts[1] ? parseInt(parts[1], 10) : undefined;
    const field = parts[2];
    const bulletIndex = parts[3] ? parseInt(parts[3], 10) : undefined;

    const findBulletIndex = (bullets: string[], preferredIndex: number | undefined): number | null => {
      if (preferredIndex !== undefined && !Number.isNaN(preferredIndex) && preferredIndex >= 0 && preferredIndex < bullets.length) {
        const preferred = bullets[preferredIndex] ?? '';
        if (preferred === suggestion.original) return preferredIndex;
        if (normalizeForCompare(preferred) === normalizeForCompare(suggestion.original)) return preferredIndex;
      }

      const exactIndex = bullets.findIndex(b => b === suggestion.original);
      if (exactIndex !== -1) return exactIndex;

      const originalNorm = normalizeForCompare(suggestion.original);
      if (!originalNorm) return null;

      const normalizedMatches = bullets
        .map((b, i) => ({ i, norm: normalizeForCompare(b) }))
        .filter((m) => m.norm === originalNorm);

      if (normalizedMatches.length === 1) return normalizedMatches[0].i;
      return null;
    };

    const matchesField = (current: string | undefined): boolean => {
      if (current === undefined) return false;
      if (current === suggestion.original) return true;
      return normalizeForCompare(current) === normalizeForCompare(suggestion.original);
    };

    if (sectionKey === 'experience') {
      if (itemIndex === undefined || Number.isNaN(itemIndex)) return null;
      const exp = form.experience[itemIndex];
      if (!exp) return null;

      if (field === 'bullets') {
        const resolvedBulletIndex = findBulletIndex(exp.bullets, bulletIndex);
        if (resolvedBulletIndex === null) return null;
        return { kind: 'experienceBullet', id: exp.id, bulletIndex: resolvedBulletIndex };
      }

      if (field === 'position' && matchesField(exp.position)) {
        return { kind: 'experiencePosition', id: exp.id };
      }

      return null;
    }

    if (sectionKey === 'projects') {
      if (itemIndex === undefined || Number.isNaN(itemIndex)) return null;
      const proj = form.projects[itemIndex];
      if (!proj) return null;

      if (field === 'bullets') {
        const resolvedBulletIndex = findBulletIndex(proj.bullets, bulletIndex);
        if (resolvedBulletIndex === null) return null;
        return { kind: 'projectBullet', id: proj.id, bulletIndex: resolvedBulletIndex };
      }

      if (field === 'name' && matchesField(proj.name)) {
        return { kind: 'projectName', id: proj.id };
      }

      if (field === 'role' && matchesField(proj.role || '')) {
        return { kind: 'projectRole', id: proj.id };
      }

      return null;
    }

    if (sectionKey === 'education') {
      if (itemIndex === undefined || Number.isNaN(itemIndex)) return null;
      const edu = form.education[itemIndex];
      if (!edu) return null;

      if (field === 'description' && matchesField(edu.description || '')) {
        return { kind: 'educationDescription', id: edu.id };
      }

      return null;
    }

    if (sectionKey === 'skillCategories') {
      if (itemIndex === undefined || Number.isNaN(itemIndex)) return null;
      const category = form.skillCategories?.[itemIndex];
      if (!category) return null;

      if (field === 'description' && matchesField(category.description)) {
        return { kind: 'skillCategoryDescription', id: category.id };
      }

      return null;
    }

    if (sectionKey === 'basicInfo' && field === 'jobTitle' && matchesField(form.basicInfo.jobTitle || '')) {
      return { kind: 'basicInfoJobTitle' };
    }

    return null;
  }, [form, normalizeForCompare]);

  const applyResolvedTarget = useCallback((target: ResolvedEditTarget, suggested: string): void => {
    if (target.kind === 'experienceBullet') {
      updateExperienceBullet(target.id, target.bulletIndex, suggested);
      return;
    }
    if (target.kind === 'projectBullet') {
      updateProjectBullet(target.id, target.bulletIndex, suggested);
      return;
    }
    if (target.kind === 'experiencePosition') {
      updateExperience(target.id, 'position', suggested);
      return;
    }
    if (target.kind === 'projectName') {
      updateProject(target.id, 'name', suggested);
      return;
    }
    if (target.kind === 'projectRole') {
      updateProject(target.id, 'role', suggested);
      return;
    }
    if (target.kind === 'educationDescription') {
      updateEducation(target.id, 'description', suggested);
      return;
    }
    if (target.kind === 'skillCategoryDescription') {
      updateSkillCategory(target.id, 'description', suggested);
      return;
    }
    if (target.kind === 'basicInfoJobTitle') {
      updateBasicInfo('jobTitle', suggested);
    }
  }, [updateEducation, updateBasicInfo, updateExperience, updateExperienceBullet, updateProject, updateProjectBullet, updateSkillCategory]);

  // AI 智能改写分析
  const handleAnalyze = async () => {
    const markdown = formToMarkdown(form);
    if (markdown.trim().length < MIN_RESUME_LENGTH) {
      showToast('请先填写简历内容', 'error');
      return;
    }
    setIsAnalyzing(true);
    setAiSuggestions([]); // 清空之前的建议
    
    try {
      // 构建结构化的简历数据，保留原始索引以便正确匹配
      const resumeData = {
        basicInfo: {
          name: form.basicInfo.name || '',
          jobTitle: form.basicInfo.jobTitle || '',
        },
        experience: form.experience
          .map((exp, expIndex) => ({
            index: expIndex,
            company: exp.company,
            position: exp.position,
            bullets: exp.bullets.map(b => b ?? ''),
          })),
        projects: form.projects
          .map((proj, projIndex) => ({
            index: projIndex,
            name: proj.name,
            role: proj.role || '',
            bullets: proj.bullets.map(b => b ?? ''),
          })),
        education: form.education
          .map((edu, eduIndex) => ({
            index: eduIndex,
            school: edu.school,
            major: edu.major || '',
            degree: edu.degree || '',
            description: edu.description || '',
          })),
        skillCategories: form.skillCategories?.map((cat, idx) => ({
          index: idx,
          name: cat.name,
          description: cat.description,
        })) || [],
      };

      const result = await api.rewriteSuggestions({
        resume_data: resumeData,
        jd_text: jdText || null,
      });
      
      // 转换为 AISuggestion 格式
      const now = Date.now();
      const seen = new Set<string>();
      const suggestions: AISuggestion[] = (result.suggestions || [])
        .filter((s) => normalizeForCompare(s.original) && normalizeForCompare(s.suggested))
        .filter((s) => normalizeForCompare(s.original) !== normalizeForCompare(s.suggested))
        .filter((s) => {
          const key = `${s.path}|${normalizeForCompare(s.suggested)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((s, index) => ({
          id: `suggestion-${index}-${now}`,
          path: s.path,
          ...parseSuggestionPath(s.path),
          original: s.original,
          suggested: s.suggested,
          reason: s.reason,
          status: 'pending' as const,
        }));
      
      setAiSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        showToast(`AI 找到 ${suggestions.length} 条改进建议`, 'success');
      } else {
        showToast('简历内容已经很好，暂无改进建议', 'success');
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 接受单条建议
  const handleAcceptSuggestion = useCallback((id: string) => {
    const suggestion = aiSuggestions.find(s => s.id === id);
    if (!suggestion || suggestion.status !== 'pending') return;
    
    const target = resolveSuggestionTarget(suggestion);
    if (!target) {
      showToast('无法应用修改：对应内容已变更，请重新生成建议', 'error');
      return;
    }

    applyResolvedTarget(target, suggestion.suggested);
    
    // 更新建议状态
    setAiSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'accepted' as const } : s
    ));
    
    showToast('已应用修改', 'success');
  }, [aiSuggestions, applyResolvedTarget, resolveSuggestionTarget]);

  // 拒绝单条建议
  const handleRejectSuggestion = useCallback((id: string) => {
    setAiSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'rejected' as const } : s
    ));
  }, []);

  // 全部接受
  const handleAcceptAll = useCallback(() => {
    aiSuggestions.filter(s => s.status === 'pending').forEach(s => {
      handleAcceptSuggestion(s.id);
    });
  }, [aiSuggestions, handleAcceptSuggestion]);

  // 全部拒绝
  const handleRejectAll = useCallback(() => {
    setAiSuggestions(prev => prev.map(s => 
      s.status === 'pending' ? { ...s, status: 'rejected' as const } : s
    ));
  }, []);

  // 构建简历数据上下文（用于 AI 对话）
  const resumeData = useMemo(() => ({
    experience: form.experience
      .map((exp, expIndex) => ({
        index: expIndex,
        company: exp.company,
        position: exp.position,
        bullets: exp.bullets.map(b => b ?? ''),
      })),
    projects: form.projects
      .map((proj, projIndex) => ({
        index: projIndex,
        name: proj.name,
        role: proj.role || '',
        bullets: proj.bullets.map(b => b ?? ''),
      })),
    education: form.education
      .map((edu, eduIndex) => ({
        index: eduIndex,
        school: edu.school,
        major: edu.major || '',
        degree: edu.degree || '',
        description: edu.description || '',
      })),
    skillCategories: form.skillCategories?.map((cat, idx) => ({
      index: idx,
      name: cat.name,
      description: cat.description,
    })) || [],
    basicInfo: {
      name: form.basicInfo.name || '',
      jobTitle: form.basicInfo.jobTitle || '',
    },
  }), [form]);

  // 应用对话建议
  const handleApplyChatSuggestion = useCallback((suggestion: EditSuggestion) => {
    // 同步到 AI 建议列表，确保中间预览可以定位并高亮
    upsertChatSuggestionToAISuggestions(suggestion, 'pending');

    const target = resolveSuggestionTarget(suggestion);
    if (!target) {
      showToast('无法应用修改：对应内容已变更，请重新生成建议', 'error');
      return;
    }

    // 保存当前状态到撤销栈
    pushState(form);
    applyResolvedTarget(target, suggestion.suggested);
    upsertChatSuggestionToAISuggestions(suggestion, 'accepted');
    showToast('已应用修改', 'success');
  }, [applyResolvedTarget, form, pushState, resolveSuggestionTarget, upsertChatSuggestionToAISuggestions]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    const previousState = popState();
    if (previousState) {
      loadForm(previousState);
      showToast('已撤销', 'success');
    }
  }, [popState, loadForm]);

  // 定位到建议对应的位置
  const handleLocateSuggestion = useCallback((suggestion: AISuggestion) => {
    setActiveTab(suggestion.section);
  }, []);

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
          {canUndo && (
            <button 
              onClick={handleUndo} 
              className="px-3 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all shadow-sm hover:shadow"
            >
              ↩️ 撤销
            </button>
          )}
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
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-1">
                        <textarea 
                          value={b} 
                          onChange={(e) => { updateExperienceBullet(exp.id, bi, e.target.value); handleTextareaResize(e); }}
                          onFocus={handleTextareaFocus}
                          className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                          placeholder={`工作内容 ${bi + 1}`} 
                        />
                        {exp.bullets.length > 1 && <button onClick={() => removeExperienceBullet(exp.id, bi)} className="text-red-400 text-xs px-1">×</button>}
                      </div>
                    ))}
                    {exp.bullets.length < 5 && <button onClick={() => addExperienceBullet(exp.id)} className="text-xs text-blue-600">+ 描述</button>}
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
                    {proj.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-1">
                        <textarea 
                          value={b} 
                          onChange={(e) => { updateProjectBullet(proj.id, bi, e.target.value); handleTextareaResize(e); }}
                          onFocus={handleTextareaFocus}
                          className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-md resize-none min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400" 
                          placeholder={`描述 ${bi + 1}`} 
                        />
                        {proj.bullets.length > 1 && <button onClick={() => removeProjectBullet(proj.id, bi)} className="text-red-400 text-xs px-1">×</button>}
                      </div>
                    ))}
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
                aiSuggestions={aiSuggestions}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
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
          <div className="flex-shrink-0" style={{ width: rightWidth }}>
            <AISuggestionPanel
              suggestions={aiSuggestions}
              isLoading={isAnalyzing}
              jdText={jdText}
              onJdChange={setJdText}
              onAnalyze={handleAnalyze}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onAcceptAll={handleAcceptAll}
              onRejectAll={handleRejectAll}
              onLocate={handleLocateSuggestion}
              onClose={() => setShowAISidebar(false)}
              resumeData={resumeData}
              onApplyChatSuggestion={handleApplyChatSuggestion}
              onRegisterChatSuggestion={handleRegisterChatSuggestion}
              onRejectChatSuggestion={handleRejectChatSuggestion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
