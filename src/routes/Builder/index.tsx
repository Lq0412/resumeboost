import { useNavigate } from 'react-router-dom';
import { useRef, useState, useCallback, useMemo } from 'react';
import { 
  FileText, User, GraduationCap, Lightbulb, Briefcase, 
  Rocket, Award, Save, Download, Sparkles, Undo2, FileEdit, Eye, CheckCircle 
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
  const [editMode, setEditMode] = useState<'form' | 'preview'>('preview');

  // 处理预览区点击，跳转到对应的表单 Tab
  const handlePreviewSectionClick = (section: EditTab) => {
    setActiveTab(section);
  };
  
  // 简历创建流程状态
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

  // 计算完成进度
  const calculateProgress = () => {
    let completed = 0;
    const total = 6;
    
    if (form.basicInfo.name && form.basicInfo.phone) completed++;
    if (form.education.length > 0) completed++;
    if (form.skills || (form.skillCategories && form.skillCategories.length > 0)) completed++;
    if (form.experience.length > 0) completed++;
    if (form.projects.length > 0) completed++;
    if (form.awards && form.awards.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  // 步骤配置
  const steps = [
    { id: 'basic' as EditTab, label: '基本信息', icon: User, desc: '姓名、联系方式' },
    { id: 'edu' as EditTab, label: '教育背景', icon: GraduationCap, desc: '学历、专业' },
    { id: 'skill' as EditTab, label: '专业技能', icon: Lightbulb, desc: '技术栈、工具' },
    { id: 'work' as EditTab, label: '工作经历', icon: Briefcase, desc: '职位、成就' },
    { id: 'project' as EditTab, label: '项目经验', icon: Rocket, desc: '项目、贡献' },
    { id: 'award' as EditTab, label: '荣誉奖项', icon: Award, desc: '证书、奖励' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* 精致的背景装饰 */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* 顶部导航栏 - 更简洁专业 */}
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：Logo + 进度 */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-900/30 group-hover:scale-105">
                  <FileText className="w-5.5 h-5.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-bold text-xl text-slate-900 tracking-tight leading-none">ResumeBoost</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">智能简历构建器</div>
                </div>
              </div>
              
              {/* 进度指示器 */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-900 to-slate-700 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{progress}%</span>
                </div>
              </div>

              {hasDraft && (
                <button 
                  onClick={handleLoadDraft} 
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-all flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 cursor-pointer shadow-sm hover:shadow"
                >
                  <FileEdit className="w-3.5 h-3.5" /> 恢复草稿
                </button>
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              {canUndo && (
                <button 
                  onClick={handleUndo} 
                  className="px-4 py-2.5 text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow cursor-pointer font-medium"
                >
                  <Undo2 className="w-4 h-4" /> 撤销
                </button>
              )}
              <button 
                onClick={handleSaveDraft} 
                className="px-4 py-2.5 text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow cursor-pointer font-medium"
              >
                <Save className="w-4 h-4" /> 保存草稿
              </button>
              <button 
                onClick={handleExportPDF} 
                className="px-4 py-2.5 text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow cursor-pointer font-medium"
              >
                <Download className="w-4 h-4" /> 导出 PDF
              </button>
              <button 
                onClick={handleSubmit} 
                className="px-6 py-2.5 text-sm bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all duration-200 font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> AI 智能优化
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 - 全新布局 */}
      <main className="py-6 px-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex gap-6" style={{ height: 'calc(100vh - 160px)' }}>
            {/* 左侧：步骤导航 + 表单 */}
            <div className="flex-shrink-0 flex flex-col gap-6" style={{ width: leftWidth }}>
              {/* 步骤导航卡片 */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">创建流程</h3>
                  <p className="text-xs text-slate-500 mt-1">按步骤完善你的简历</p>
                </div>
                <div className="p-3">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = activeTab === step.id;
                    const isCompleted = (() => {
                      if (step.id === 'basic') return form.basicInfo.name && form.basicInfo.phone;
                      if (step.id === 'edu') return form.education.length > 0;
                      if (step.id === 'skill') return form.skills || (form.skillCategories && form.skillCategories.length > 0);
                      if (step.id === 'work') return form.experience.length > 0;
                      if (step.id === 'project') return form.projects.length > 0;
                      if (step.id === 'award') return form.awards && form.awards.length > 0;
                      return false;
                    })();

                    return (
                      <button
                        key={step.id}
                        onClick={() => setActiveTab(step.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer mb-1.5 group ${
                          isActive 
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          isActive 
                            ? 'bg-white/20' 
                            : isCompleted 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}>
                          {isCompleted && !isActive ? (
                            <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                          ) : (
                            <Icon className="w-5 h-5" strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {step.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                            {step.desc}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-8 bg-white/30 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 表单内容卡片 */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {steps.find(s => s.id === activeTab)?.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {steps.find(s => s.id === activeTab)?.desc}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
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
            </div>

            {/* 拖拽条 */}
            {!showAISidebar && (
              <div 
                className="w-1.5 bg-slate-200/60 hover:bg-slate-400 active:bg-slate-900 cursor-col-resize flex-shrink-0 transition-all rounded-full" 
                onMouseDown={() => setIsDraggingLeft(true)} 
              />
            )}

            {/* 中间：简历预览 */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* 预览卡片 */}
              <div className="h-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                {/* 预览工具栏 */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                        <FileText className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 tracking-tight leading-none">实时预览</div>
                        <div className="text-xs text-slate-500 mt-0.5">所见即所得</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
                      <button
                        onClick={() => setEditMode('preview')}
                        className={`px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                          editMode === 'preview' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileEdit className="w-3.5 h-3.5" /> 可编辑
                      </button>
                      <button
                        onClick={() => setEditMode('form')}
                        className={`px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                          editMode === 'form' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> 只读
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isOverflowing && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl shadow-sm">
                        <span className="text-xs text-amber-700 font-bold">
                          ⚠️ 内容超过1页
                        </span>
                      </div>
                    )}
                    <select 
                      value={densityMode} 
                      onChange={(e) => setDensityMode(e.target.value as DensityMode)} 
                      className={`text-xs bg-white text-slate-700 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-bold cursor-pointer shadow-sm ${
                        isOverflowing ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/60'
                      }`}
                    >
                      <option value="normal">标准密度</option>
                      <option value="compact">紧凑模式</option>
                      <option value="tight">极简模式</option>
                    </select>
                  </div>
                </div>

                {/* 预览内容 */}
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar bg-gradient-to-b from-slate-50/30 to-white">
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
            </div>

            {/* AI 优化侧边栏 */}
            {showAISidebar && (
              <>
                <div 
                  className="w-1.5 bg-slate-200/60 hover:bg-slate-400 active:bg-slate-900 cursor-col-resize flex-shrink-0 transition-all rounded-full" 
                  onMouseDown={() => setIsDraggingRight(true)} 
                />
                <div className="flex-shrink-0" style={{ width: rightWidth }}>
                  <div className="h-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
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
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
