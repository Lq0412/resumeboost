import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from './useWorkspace';
import { TabNav, LoadingSkeleton, showToast } from '../../components';
import { extractTextFromPDF } from '../../lib/pdf';

const TABS = [
  { id: 'diagnosis', label: '诊断' },
  { id: 'match', label: '匹配' },
  { id: 'rewrite', label: '改写' },
  { id: 'finalize', label: '终稿' },
] as const;

export default function Workspace() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state,
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
  } = useWorkspace();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await extractTextFromPDF(file);
    if (result.success && result.text) {
      setResumeText(result.text);
      showToast(`PDF 提取成功（${result.pageCount} 页）`, 'success');
    } else {
      showToast(result.error || 'PDF 提取失败', 'error');
    }
    
    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setResumeText]);

  const canAnalyze = state.resumeText.trim().length > 0 && !state.isAnalyzing;
  const canMatch = state.resumeText.trim().length > 0 && state.jdText.trim().length > 0 && !state.isMatching;
  const canRewrite = state.rewriteSourceText.trim().length > 0 && !state.isRewriting;
  const canFinalize = state.resumeText.trim().length > 0 && !state.isFinalizing;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => navigate('/')}
          >
            ResumeBoost
          </h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.maskEnabled}
                onChange={toggleMask}
                className="rounded border-gray-300"
              />
              <span>脱敏显示</span>
            </label>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              清空
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：输入区 */}
          <div className="space-y-4">
            {/* PDF 上传 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">上传 PDF</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                点击选择 PDF 文件（仅支持可复制文本的 PDF）
              </button>
            </div>

            {/* 简历文本 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                简历文本 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({state.resumeText.length}/20000)
                </span>
              </h3>
              <textarea
                value={state.resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="粘贴简历文本或 Markdown..."
              />
            </div>

            {/* JD 文本 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                JD 文本（可选）
                <span className="text-xs text-gray-500 ml-2">
                  ({state.jdText.length}/10000)
                </span>
              </h3>
              <textarea
                value={state.jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="粘贴职位描述，用于匹配分析和改写优化..."
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={analyze}
                disabled={!canAnalyze}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {state.isAnalyzing ? '分析中...' : '一键分析'}
              </button>
              <button
                onClick={matchJD}
                disabled={!canMatch}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {state.isMatching ? '匹配中...' : 'ATS 匹配'}
              </button>
            </div>
          </div>

          {/* 右侧：结果区 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <TabNav
                tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
                activeTab={state.activeTab}
                onChange={(id) => setActiveTab(id as typeof state.activeTab)}
              />
            </div>

            <div className="p-4 min-h-[400px]">
              {/* 诊断 Tab */}
              {state.activeTab === 'diagnosis' && (
                <DiagnosisPanel 
                  result={state.diagnosisResult} 
                  isLoading={state.isAnalyzing} 
                />
              )}

              {/* 匹配 Tab */}
              {state.activeTab === 'match' && (
                <MatchPanel 
                  result={state.matchResult} 
                  isLoading={state.isMatching} 
                />
              )}

              {/* 改写 Tab */}
              {state.activeTab === 'rewrite' && (
                <RewritePanel
                  sourceText={state.rewriteSourceText}
                  onSourceTextChange={setRewriteSourceText}
                  result={state.rewriteResult}
                  appliedRewrites={state.appliedRewrites}
                  isLoading={state.isRewriting}
                  canRewrite={canRewrite}
                  onRewrite={rewrite}
                  onApply={applyRewrite}
                  onRemove={removeAppliedRewrite}
                />
              )}

              {/* 终稿 Tab */}
              {state.activeTab === 'finalize' && (
                <FinalizePanel
                  result={state.finalResult}
                  isLoading={state.isFinalizing}
                  canFinalize={canFinalize}
                  onFinalize={finalize}
                  onPrint={print}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 打印区域 */}
      {state.finalResult && (
        <div 
          className="print-area hidden print:block"
          dangerouslySetInnerHTML={{ __html: state.finalResult.final_html }}
        />
      )}
    </div>
  );
}

// 诊断面板
function DiagnosisPanel({ result, isLoading }: { result: any; isLoading: boolean }) {
  if (isLoading) return <LoadingSkeleton lines={5} />;
  if (!result) return <p className="text-gray-500">点击"一键分析"开始诊断简历</p>;

  return (
    <div className="space-y-6">
      {result.issues?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">问题清单</h4>
          <div className="space-y-3">
            {result.issues.slice(0, 10).map((issue: any, i: number) => (
              <div key={i} className="p-3 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800">{issue.title}</p>
                <p className="text-sm text-red-600 mt-1">{issue.why}</p>
                <p className="text-sm text-gray-700 mt-1">建议：{issue.how}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.actions?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">行动建议</h4>
          <ul className="space-y-2">
            {result.actions.slice(0, 10).map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 匹配面板
function MatchPanel({ result, isLoading }: { result: any; isLoading: boolean }) {
  if (isLoading) return <LoadingSkeleton lines={5} />;
  if (!result) return <p className="text-gray-500">输入 JD 后点击"ATS 匹配"分析匹配度</p>;

  const scoreColor = result.score >= 70 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-1">匹配分数</p>
        <p className={`text-5xl font-bold ${scoreColor}`}>{result.score}</p>
        <p className="text-sm text-gray-600 mt-2">{result.notes}</p>
      </div>

      {result.missing_keywords?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">缺失关键词</h4>
          <div className="flex flex-wrap gap-2">
            {result.missing_keywords.map((kw: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.hit_keywords?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">命中关键词</h4>
          <div className="flex flex-wrap gap-2">
            {result.hit_keywords.map((kw: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 改写面板
function RewritePanel({
  sourceText,
  onSourceTextChange,
  result,
  appliedRewrites,
  isLoading,
  canRewrite,
  onRewrite,
  onApply,
  onRemove,
}: {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  result: any;
  appliedRewrites: any[];
  isLoading: boolean;
  canRewrite: boolean;
  onRewrite: () => void;
  onApply: (style: 'conservative' | 'strong') => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          待改写文本（建议 1-8 行）
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.target.value)}
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          placeholder="粘贴需要改写的经历段落..."
        />
        <button
          onClick={onRewrite}
          disabled={!canRewrite}
          className="mt-2 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '生成中...' : '生成两版改写'}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.conservative && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-800">保守版</span>
                <button
                  onClick={() => onApply('conservative')}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  采用
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{result.conservative.text}</p>
            </div>
          )}
          {result.strong && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-orange-800">强化版</span>
                <button
                  onClick={() => onApply('strong')}
                  className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  采用
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{result.strong.text}</p>
              {result.strong.cautions?.length > 0 && (
                <p className="text-xs text-orange-600 mt-2">
                  注意：{result.strong.cautions.join('；')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {appliedRewrites.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">已采用的改写</h4>
          <div className="space-y-2">
            {appliedRewrites.map((r) => (
              <div key={r.id} className="p-2 bg-gray-100 rounded flex justify-between items-start">
                <div className="flex-1 text-sm">
                  <span className={`text-xs px-1 rounded ${r.style === 'conservative' ? 'bg-blue-200' : 'bg-orange-200'}`}>
                    {r.style === 'conservative' ? '保守' : '强化'}
                  </span>
                  <p className="mt-1 text-gray-600 line-clamp-2">{r.after_text}</p>
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 终稿面板
function FinalizePanel({
  result,
  isLoading,
  canFinalize,
  onFinalize,
  onPrint,
}: {
  result: any;
  isLoading: boolean;
  canFinalize: boolean;
  onFinalize: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={onFinalize}
          disabled={!canFinalize}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '生成中...' : '生成终稿'}
        </button>
        {result && (
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            打印/导出 PDF
          </button>
        )}
      </div>

      {isLoading && <LoadingSkeleton lines={8} />}

      {result && !isLoading && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: result.final_html }}
          />
        </div>
      )}

      {!result && !isLoading && (
        <p className="text-gray-500">点击"生成终稿"创建最终简历</p>
      )}
    </div>
  );
}
