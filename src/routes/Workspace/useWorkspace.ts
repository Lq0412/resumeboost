/**
 * Workspace 状态管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { AppliedRewrite, MaskingMap } from '../../lib';
import { 
  loadSession, 
  saveSession, 
  clearSession,
  mask,
  unmask,
  createEmptyMap,
} from '../../lib';
import type {
  AnalyzeResponse,
  MatchResponse,
  FinalizeResponse,
} from '../../lib/api';
import { 
  api, 
  handleAPIError,
} from '../../lib/api';
import { validateResumeText, validateJDText, validateSourceText } from '../../lib/validation';
import { showToast } from '../../components';

export type TabId = 'diagnosis' | 'match' | 'rewrite' | 'finalize';

export interface RewriteResult {
  sourceText: string;
  conservative: { text: string; cautions: string[] } | null;
  strong: { text: string; cautions: string[] } | null;
}

export interface WorkspaceState {
  resumeText: string;
  jdText: string;
  maskEnabled: boolean;
  activeTab: TabId;
  appliedRewrites: AppliedRewrite[];
  maskingMap: MaskingMap;
  // Results
  diagnosisResult: AnalyzeResponse | null;
  matchResult: MatchResponse | null;
  rewriteResult: RewriteResult | null;
  finalResult: FinalizeResponse | null;
  // Loading states
  isAnalyzing: boolean;
  isMatching: boolean;
  isRewriting: boolean;
  isFinalizing: boolean;
  // Rewrite input
  rewriteSourceText: string;
}

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState>({
    resumeText: '',
    jdText: '',
    maskEnabled: true,
    activeTab: 'diagnosis',
    appliedRewrites: [],
    maskingMap: createEmptyMap(),
    diagnosisResult: null,
    matchResult: null,
    rewriteResult: null,
    finalResult: null,
    isAnalyzing: false,
    isMatching: false,
    isRewriting: false,
    isFinalizing: false,
    rewriteSourceText: '',
  });

  // 从 sessionStorage 恢复数据
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setState((prev) => ({
        ...prev,
        resumeText: session.resumeText || '',
        jdText: session.jdText || '',
        appliedRewrites: session.appliedRewrites || [],
        maskingMap: session.maskingMap || createEmptyMap(),
      }));
    }
  }, []);

  // 获取显示文本（根据脱敏开关）
  const getDisplayText = useCallback((text: string): string => {
    if (state.maskEnabled) {
      const { masked } = mask(text);
      return masked;
    }
    return text;
  }, [state.maskEnabled]);

  // 更新简历文本
  const setResumeText = useCallback((text: string) => {
    const { map } = mask(text);
    setState((prev) => ({
      ...prev,
      resumeText: text,
      maskingMap: map,
    }));
    saveSession({ resumeText: text, maskingMap: map });
  }, []);

  // 更新 JD 文本
  const setJdText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, jdText: text }));
    saveSession({ jdText: text });
  }, []);

  // 切换脱敏开关
  const toggleMask = useCallback(() => {
    setState((prev) => ({ ...prev, maskEnabled: !prev.maskEnabled }));
  }, []);

  // 切换 Tab
  const setActiveTab = useCallback((tab: TabId) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // 清空所有数据
  const clearAll = useCallback(() => {
    clearSession();
    setState({
      resumeText: '',
      jdText: '',
      maskEnabled: true,
      activeTab: 'diagnosis',
      appliedRewrites: [],
      maskingMap: createEmptyMap(),
      diagnosisResult: null,
      matchResult: null,
      rewriteResult: null,
      finalResult: null,
      isAnalyzing: false,
      isMatching: false,
      isRewriting: false,
      isFinalizing: false,
      rewriteSourceText: '',
    });
    showToast('已清空所有数据', 'info');
  }, []);

  // 诊断分析
  const analyze = useCallback(async () => {
    const validation = validateResumeText(state.resumeText);
    if (!validation.valid) {
      showToast(validation.error!, 'error');
      return;
    }

    setState((prev) => ({ ...prev, isAnalyzing: true }));
    try {
      const { masked } = mask(state.resumeText);
      const result = await api.analyze({
        resume_text: masked,
        jd_text: state.jdText ? mask(state.jdText).masked : null,
        lang: 'auto',
        mask_enabled: true,
      });
      setState((prev) => ({ ...prev, diagnosisResult: result, activeTab: 'diagnosis' }));
      showToast('诊断完成', 'success');
    } catch (error) {
      handleAPIError(error);
    } finally {
      setState((prev) => ({ ...prev, isAnalyzing: false }));
    }
  }, [state.resumeText, state.jdText]);

  // JD 匹配
  const matchJD = useCallback(async () => {
    const resumeValidation = validateResumeText(state.resumeText);
    if (!resumeValidation.valid) {
      showToast(resumeValidation.error!, 'error');
      return;
    }

    const jdValidation = validateJDText(state.jdText);
    if (!jdValidation.valid) {
      showToast(jdValidation.error!, 'error');
      return;
    }

    setState((prev) => ({ ...prev, isMatching: true }));
    try {
      const result = await api.match({
        resume_text: mask(state.resumeText).masked,
        jd_text: mask(state.jdText).masked,
        lang: 'auto',
      });
      setState((prev) => ({ ...prev, matchResult: result, activeTab: 'match' }));
      showToast('匹配分析完成', 'success');
    } catch (error) {
      handleAPIError(error);
    } finally {
      setState((prev) => ({ ...prev, isMatching: false }));
    }
  }, [state.resumeText, state.jdText]);

  // 设置改写源文本
  const setRewriteSourceText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, rewriteSourceText: text }));
  }, []);

  // 生成改写
  const rewrite = useCallback(async () => {
    const validation = validateSourceText(state.rewriteSourceText);
    if (!validation.valid) {
      showToast(validation.error!, 'error');
      return;
    }

    if (!state.rewriteSourceText.trim()) {
      showToast('请输入待改写的文本', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isRewriting: true }));
    try {
      const maskedSource = mask(state.rewriteSourceText).masked;
      const maskedJd = state.jdText ? mask(state.jdText).masked : null;

      const [conservativeResult, strongResult] = await Promise.all([
        api.rewrite({
          source_text: maskedSource,
          jd_text: maskedJd,
          style: 'conservative',
          lang: 'auto',
          constraints: { no_new_facts: true, ats_friendly: true, keep_bullets: true },
        }),
        api.rewrite({
          source_text: maskedSource,
          jd_text: maskedJd,
          style: 'strong',
          lang: 'auto',
          constraints: { no_new_facts: true, ats_friendly: true, keep_bullets: true },
        }),
      ]);

      setState((prev) => ({
        ...prev,
        rewriteResult: {
          sourceText: state.rewriteSourceText,
          conservative: { text: conservativeResult.rewritten_text, cautions: conservativeResult.cautions },
          strong: { text: strongResult.rewritten_text, cautions: strongResult.cautions },
        },
      }));
      showToast('改写完成', 'success');
    } catch (error) {
      handleAPIError(error);
    } finally {
      setState((prev) => ({ ...prev, isRewriting: false }));
    }
  }, [state.rewriteSourceText, state.jdText]);

  // 采用改写
  const applyRewrite = useCallback((style: 'conservative' | 'strong') => {
    if (!state.rewriteResult) return;

    const result = style === 'conservative' ? state.rewriteResult.conservative : state.rewriteResult.strong;
    if (!result) return;

    const newRewrite: AppliedRewrite = {
      id: Math.random().toString(36).substring(2, 9),
      before_text: state.rewriteResult.sourceText,
      after_text: result.text,
      style,
    };

    const newRewrites = [...state.appliedRewrites, newRewrite];
    setState((prev) => ({ ...prev, appliedRewrites: newRewrites }));
    saveSession({ appliedRewrites: newRewrites });
    showToast('已采用改写', 'success');
  }, [state.rewriteResult, state.appliedRewrites]);

  // 移除已采用的改写
  const removeAppliedRewrite = useCallback((id: string) => {
    const newRewrites = state.appliedRewrites.filter((r) => r.id !== id);
    setState((prev) => ({ ...prev, appliedRewrites: newRewrites }));
    saveSession({ appliedRewrites: newRewrites });
    showToast('已移除改写', 'info');
  }, [state.appliedRewrites]);

  // 生成终稿
  const finalize = useCallback(async () => {
    const validation = validateResumeText(state.resumeText);
    if (!validation.valid) {
      showToast(validation.error!, 'error');
      return;
    }

    setState((prev) => ({ ...prev, isFinalizing: true }));
    try {
      const result = await api.finalize({
        resume_text: mask(state.resumeText).masked,
        applied_rewrites: state.appliedRewrites.map((r) => ({
          ...r,
          before_text: mask(r.before_text).masked,
          after_text: mask(r.after_text).masked,
        })),
        lang: 'auto',
        template: 'simple_v1',
        mask_enabled: true,
      });

      // 如果脱敏关闭，还原敏感信息
      let finalResult = result;
      if (!state.maskEnabled) {
        finalResult = {
          final_markdown: unmask(result.final_markdown, state.maskingMap),
          final_html: unmask(result.final_html, state.maskingMap),
        };
      }

      setState((prev) => ({ ...prev, finalResult, activeTab: 'finalize' }));
      showToast('终稿生成完成', 'success');
    } catch (error) {
      handleAPIError(error);
    } finally {
      setState((prev) => ({ ...prev, isFinalizing: false }));
    }
  }, [state.resumeText, state.appliedRewrites, state.maskEnabled, state.maskingMap]);

  // 打印
  const print = useCallback(() => {
    window.print();
  }, []);

  return {
    state,
    getDisplayText,
    setResumeText,
    setJdText,
    toggleMask,
    setActiveTab,
    clearAll,
    analyze,
    matchJD,
    setRewriteSourceText,
    rewrite,
    applyRewrite,
    removeAppliedRewrite,
    finalize,
    print,
  };
}
