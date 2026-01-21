import { useNavigate } from 'react-router-dom';
import { useRef, useState, useCallback, useMemo } from 'react';
import { 
  FileText, User, GraduationCap, Lightbulb, Briefcase, 
  Rocket, Award, Save, Download, Sparkles, Undo2, FileEdit, Eye 
} from 'lucide-react';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { showToast } from '../../components';
import { api, handleAPIError } from '../../lib/api';
import { ResumePreview } from './ResumePreview';
import { EditablePreview } from './EditablePreview';
import { AwardTab, BasicTab, EducationTab, ProjectTab, SkillTab, WorkTab } from './tabs';
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
  useDragResize(isDraggingLeft, setLeftWidth, 260, 450, false, setIsDraggingLeft);
  useDragResize(isDraggingRight, setRightWidth, 220, 350, true, setIsDraggingRight);

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
    <div className="h-screen flex flex-col bg-[#0b0c10] text-gray-100">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-[#111318]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between flex-shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">ResumeBoost</span>
          </div>
          {hasDraft && (
            <button onClick={handleLoadDraft} className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5" /> 加载草稿
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canUndo && (
            <button 
              onClick={handleUndo} 
              className="px-3 py-1.5 text-xs text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" /> 撤销
            </button>
          )}
          <button 
            onClick={handleSaveDraft} 
            className="px-3 py-1.5 text-xs text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> 保存
          </button>
          <button 
            onClick={handleExportPDF} 
            className="px-3 py-1.5 text-xs text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> 导出
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-1.5 text-xs bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-lg hover:from-orange-600 hover:to-rose-700 transition-all font-medium shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/30 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI 优化
          </button>
        </div>
      </header>

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑区 */}
        <div className="flex-shrink-0 bg-[#111318] border-r border-white/[0.06] flex flex-col" style={{ width: leftWidth }}>
          {/* Tab 导航 */}
          <div className="flex border-b border-white/[0.06] bg-[#0f1116]">
            {[
              { id: 'basic' as EditTab, label: '基本', Icon: User },
              { id: 'edu' as EditTab, label: '教育', Icon: GraduationCap },
              { id: 'skill' as EditTab, label: '技能', Icon: Lightbulb },
              { id: 'work' as EditTab, label: '工作', Icon: Briefcase },
              { id: 'project' as EditTab, label: '项目', Icon: Rocket },
              { id: 'award' as EditTab, label: '奖项', Icon: Award },
            ].map(tab => {
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-2.5 text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    activeTab === tab.id 
                      ? 'bg-white/[0.04] text-orange-400 border-b-2 border-orange-400/70' 
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {activeTab === 'basic' && (
              <BasicTab
                basicInfo={form.basicInfo}
                photo={form.photo}
                photoInputRef={photoInputRef}
                onPhotoUpload={handlePhotoUpload}
                onPhotoClear={() => setPhoto('')}
                onUpdateBasicInfo={updateBasicInfo}
              />
            )}
            {activeTab === 'edu' && (
              <EducationTab
                education={form.education}
                onAdd={addEducation}
                onRemove={removeEducation}
                onUpdate={updateEducation}
                onResize={handleTextareaResize}
                onFocus={handleTextareaFocus}
              />
            )}
            {activeTab === 'skill' && (
              <SkillTab
                skills={form.skills}
                onUpdateSkills={updateSkills}
                onResize={handleTextareaResize}
                onFocus={handleTextareaFocus}
              />
            )}
            {activeTab === 'work' && (
              <WorkTab
                experience={form.experience}
                onAdd={addExperience}
                onRemove={removeExperience}
                onUpdate={updateExperience}
                onUpdateBullet={updateExperienceBullet}
                onAddBullet={addExperienceBullet}
                onRemoveBullet={removeExperienceBullet}
                onResize={handleTextareaResize}
                onFocus={handleTextareaFocus}
              />
            )}
            {activeTab === 'project' && (
              <ProjectTab
                projects={form.projects}
                onAdd={addProject}
                onRemove={removeProject}
                onUpdate={updateProject}
                onUpdateBullet={updateProjectBullet}
                onAddBullet={addProjectBullet}
                onRemoveBullet={removeProjectBullet}
                onResize={handleTextareaResize}
                onFocus={handleTextareaFocus}
              />
            )}
            {activeTab === 'award' && (
              <AwardTab
                awards={form.awards}
                onAdd={addAward}
                onRemove={removeAward}
                onUpdate={updateAward}
              />
            )}
          </div>
        </div>

        {/* 拖拽条 */}
        <div 
          className="w-1 bg-white/[0.06] hover:bg-orange-500/50 active:bg-orange-500 cursor-col-resize flex-shrink-0 transition-colors" 
          onMouseDown={() => setIsDraggingLeft(true)} 
        />

        {/* 中间：预览区 */}
        <div className="flex-1 min-w-0 bg-gradient-to-br from-[#1b1d22] to-[#121318] flex flex-col overflow-hidden">
          <div className="h-10 bg-[#101218]/85 backdrop-blur-sm px-4 flex items-center justify-between flex-shrink-0 border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-200">简历预览</span>
              </div>
              <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.08]">
                <button
                  onClick={() => setEditMode('preview')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                    editMode === 'preview' 
                      ? 'bg-orange-500/90 text-white shadow-[0_0_0_1px_rgba(249,115,22,0.45)]' 
                      : 'text-gray-500 hover:text-gray-200'
                  }`}
                >
                  <FileEdit className="w-3 h-3" /> 可编辑
                </button>
                <button
                  onClick={() => setEditMode('form')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                    editMode === 'form' 
                      ? 'bg-orange-500/90 text-white shadow-[0_0_0_1px_rgba(249,115,22,0.45)]' 
                      : 'text-gray-500 hover:text-gray-200'
                  }`}
                >
                  <Eye className="w-3 h-3" /> 只读
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOverflowing && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-md">
                  <span className="text-xs text-amber-400 font-medium animate-pulse">
                    ⚠️ 超过1页
                  </span>
                </div>
              )}
              <select 
                value={densityMode} 
                onChange={(e) => setDensityMode(e.target.value as DensityMode)} 
                className={`text-xs bg-white/[0.04] text-gray-200 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/60 transition-all ${
                  isOverflowing ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-white/[0.08]'
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
            className="w-1 bg-white/[0.06] hover:bg-orange-500/50 active:bg-orange-500 cursor-col-resize flex-shrink-0 transition-colors" 
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
