import { useRef, useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useBuilderForm } from './useBuilderForm';
import { useContentHeight } from './hooks';
import { A4_WIDTH, A4_HEIGHT, densityStyles, formatTime, hasResumeContent } from './utils';
import { EditableField } from './EditableField';
import { AIDiffBlockMultiline } from './AIDiffBlock';
import type { AISuggestion } from './types';

type DensityMode = 'normal' | 'compact' | 'tight';

interface EditablePreviewProps {
  form: ReturnType<typeof useBuilderForm>['form'];
  densityMode?: DensityMode;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onOverflowChange?: (isOverflow: boolean) => void;
  onSectionClick?: (section: 'basic' | 'edu' | 'skill' | 'work' | 'project' | 'award') => void;
  // 编辑回调
  onUpdateBasicInfo: ReturnType<typeof useBuilderForm>['updateBasicInfo'];
  onUpdateEducation: ReturnType<typeof useBuilderForm>['updateEducation'];
  onUpdateExperience: ReturnType<typeof useBuilderForm>['updateExperience'];
  onUpdateExperienceBullet: ReturnType<typeof useBuilderForm>['updateExperienceBullet'];
  onUpdateProject: ReturnType<typeof useBuilderForm>['updateProject'];
  onUpdateProjectBullet: ReturnType<typeof useBuilderForm>['updateProjectBullet'];
  onUpdateSkillCategory: ReturnType<typeof useBuilderForm>['updateSkillCategory'];
  onUpdateSkills: ReturnType<typeof useBuilderForm>['updateSkills'];
  onUpdateAward: ReturnType<typeof useBuilderForm>['updateAward'];
  // AI 建议相关
  aiSuggestions?: AISuggestion[];
  onAcceptSuggestion?: (id: string) => void;
  onRejectSuggestion?: (id: string) => void;
}

export function EditablePreview({ 
  form, 
  densityMode = 'normal', 
  previewRef, 
  onOverflowChange,
  onSectionClick,
  onUpdateBasicInfo,
  onUpdateEducation,
  onUpdateExperience,
  onUpdateExperienceBullet,
  onUpdateProject,
  onUpdateProjectBullet,
  onUpdateSkillCategory,
  onUpdateSkills,
  onUpdateAward,
  aiSuggestions = [],
  onAcceptSuggestion,
  onRejectSuggestion,
}: EditablePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const hasContent = hasResumeContent(form);
  const contentHeight = useContentHeight(contentRef, [densityMode, hasContent]);
  
  const styles = densityStyles[densityMode];

  // 计算可用高度（A4 高度减去上下 padding）
  const availableHeight = A4_HEIGHT - styles.padding * 2;

  // 是否有待处理的 AI 建议（需要扩展显示）
  const hasPendingSuggestions = aiSuggestions.some(s => s.status === 'pending');

  // 查找对应路径的建议，同时验证原文内容
  const findSuggestion = (path: string, originalText?: string): AISuggestion | undefined => {
    const found = aiSuggestions.find(s => {
      if (s.status !== 'pending') return false;
      
      // 首先通过 path 精确匹配
      if (s.path === path) {
        return true;
      }
      
      // 如果 path 不匹配，尝试通过原文内容匹配
      if (originalText) {
        const normalizedOriginal = s.original.trim();
        const normalizedText = originalText.trim();
        if (normalizedOriginal === normalizedText) {
          return true;
        }
      }
      
      return false;
    });
    
    return found;
  };

  // 通知父组件溢出状态
  useEffect(() => {
    const overflow = contentHeight > availableHeight;
    onOverflowChange?.(overflow);
  }, [contentHeight, availableHeight, onOverflowChange]);

  // 根据容器宽度自动调整缩放
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const newScale = Math.min(containerWidth / A4_WIDTH, 0.75);
        setScale(Math.max(newScale, 0.5));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const usedPercent = Math.min(100, Math.round((contentHeight / availableHeight) * 100));
  const isOverflow = contentHeight > availableHeight;
  const pages = Math.ceil(contentHeight / availableHeight);
  const usageBar = (
    <div className="w-full max-w-md mb-3">
      <div className="flex justify-between text-xs text-gray-200 mb-1">
        <span>
          {hasPendingSuggestions
            ? `AI 建议模式（${aiSuggestions.filter(s => s.status === 'pending').length} 条待处理）`
            : `页面使用: ${usedPercent}%`
          }
          <span className="text-gray-400 text-[10px] ml-1">(点击可编辑)</span>
        </span>
        <span>{hasPendingSuggestions ? '自动扩展' : isOverflow ? `约 ${pages} 页` : '1 页内'}</span>
      </div>
      {!hasPendingSuggestions && (
        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverflow ? 'bg-amber-500' : usedPercent > 85 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
      )}
      {hasPendingSuggestions && (
        <div className="p-2 bg-blue-500/20 border border-blue-400/50 rounded-lg">
          <p className="text-blue-300 text-xs">处理完所有建议后，页面将恢复 A4 尺寸预览</p>
        </div>
      )}
      {!hasPendingSuggestions && isOverflow && (
        <div className="mt-2 p-2 bg-amber-500/20 border border-amber-400/50 rounded-lg">
          <p className="text-amber-300 text-xs font-medium mb-1">内容超过 1 页</p>
          <p className="text-amber-200 text-xs">切换到「紧凑」或「极简」模式</p>
        </div>
      )}
    </div>
  );

  if (!hasContent) {
    return (
      <div ref={containerRef} className="w-full flex flex-col items-center">
        {usageBar}
        <div 
          className="bg-white shadow-2xl flex items-center justify-center"
          style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
        >
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">
              <FileText className="w-16 h-16 mx-auto text-gray-300" />
            </div>
            <p className="text-base">开始填写左侧表单</p>
            <p className="text-sm mt-1">或直接点击这里编辑</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {usageBar}

      {/* A4 纸张 - 有 AI 建议时自动扩展高度 */}
      <div 
        className="bg-white shadow-2xl relative overflow-hidden"
        style={{ 
          width: A4_WIDTH * scale, 
          minHeight: A4_HEIGHT * scale,
          height: hasPendingSuggestions ? 'auto' : A4_HEIGHT * scale,
        }}
      >
        <div 
          ref={previewRef}
          className={`${styles.lineHeight} text-gray-900`}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: A4_WIDTH,
            minHeight: A4_HEIGHT,
            padding: styles.padding,
            fontFamily: "'DengXian', 'Microsoft YaHei', 'PingFang SC', sans-serif",
            backgroundColor: '#ffffff',
          }}
        >
          <div ref={contentRef}>
            {/* 头部 */}
            <div 
              className={`${styles.sectionGap} flex cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
              onClick={() => onSectionClick?.('basic')}
            >
              <div className="flex-1 pr-4">
                <h1 className={`${styles.titleSize} rb-bold text-gray-900 mb-1`}>
                  <EditableField
                    value={form.basicInfo.name || ''}
                    onChange={(v) => onUpdateBasicInfo('name', v)}
                    placeholder="姓名"
                    className="rb-bold"
                  >
                    {form.basicInfo.name || '点击输入姓名'}
                  </EditableField>
                </h1>
                <p className={`${styles.textSize} text-gray-700 mb-1`}>
                  求职意向：
                  <EditableField
                    value={form.basicInfo.jobTitle || ''}
                    onChange={(v) => onUpdateBasicInfo('jobTitle', v)}
                    placeholder="职位"
                  >
                    {form.basicInfo.jobTitle || '点击输入'}
                  </EditableField>
                </p>
                <div className={`grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600 ${styles.textSize}`}>
                  <span>
                    电话: <EditableField
                      value={form.basicInfo.phone || ''}
                      onChange={(v) => onUpdateBasicInfo('phone', v)}
                      placeholder="手机号"
                    >
                      {form.basicInfo.phone || '手机号'}
                    </EditableField>
                  </span>
                  <span>
                    邮箱: <EditableField
                      value={form.basicInfo.email || ''}
                      onChange={(v) => onUpdateBasicInfo('email', v)}
                      placeholder="邮箱"
                    >
                      {form.basicInfo.email || '邮箱'}
                    </EditableField>
                  </span>
                  {form.basicInfo.city && (
                    <span>
                      城市: <EditableField
                        value={form.basicInfo.city}
                        onChange={(v) => onUpdateBasicInfo('city', v)}
                      >
                        {form.basicInfo.city}
                      </EditableField>
                    </span>
                  )}
                  {form.basicInfo.status && (
                    <span>
                      状态: <EditableField
                        value={form.basicInfo.status}
                        onChange={(v) => onUpdateBasicInfo('status', v)}
                      >
                        {form.basicInfo.status}
                      </EditableField>
                    </span>
                  )}
                  {form.basicInfo.birthYear && (
                    <span>
                      出生: <EditableField
                        value={form.basicInfo.birthYear}
                        onChange={(v) => onUpdateBasicInfo('birthYear', v)}
                      >
                        {form.basicInfo.birthYear}
                      </EditableField>
                      {form.basicInfo.birthMonth && (
                        <>
                          -<EditableField
                            value={form.basicInfo.birthMonth}
                            onChange={(v) => onUpdateBasicInfo('birthMonth', v)}
                          >
                            {form.basicInfo.birthMonth}
                          </EditableField>
                        </>
                      )}
                    </span>
                  )}
                  {form.basicInfo.hometown && (
                    <span>
                      籍贯: <EditableField
                        value={form.basicInfo.hometown}
                        onChange={(v) => onUpdateBasicInfo('hometown', v)}
                      >
                        {form.basicInfo.hometown}
                      </EditableField>
                    </span>
                  )}
                  {form.basicInfo.github && (
                    <span className="text-blue-600">
                      GitHub: <EditableField
                        value={form.basicInfo.github}
                        onChange={(v) => onUpdateBasicInfo('github', v)}
                      >
                        {form.basicInfo.github}
                      </EditableField>
                    </span>
                  )}
                  {form.basicInfo.website && (
                    <span className="text-blue-600">
                      网站: <EditableField
                        value={form.basicInfo.website}
                        onChange={(v) => onUpdateBasicInfo('website', v)}
                      >
                        {form.basicInfo.website}
                      </EditableField>
                    </span>
                  )}
                </div>
              </div>
              {form.photo && (
                <img 
                  src={form.photo} 
                  alt="照片" 
                  className={`${densityMode === 'tight' ? 'w-16 h-22' : 'w-20 h-28'} object-cover rounded flex-shrink-0`} 
                />
              )}
            </div>

            {/* 教育经历 */}
            {form.education.some(e => e.school) && (
              <div 
                className={`${styles.sectionGap} cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
                onClick={() => onSectionClick?.('edu')}
              >
                <h2 className={`${styles.sectionTitleSize} rb-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  教育经历
                </h2>
                {form.education.filter(e => e.school).map((edu) => (
                  <div key={edu.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="rb-bold">
                          <EditableField
                            value={edu.school}
                            onChange={(v) => onUpdateEducation(edu.id, 'school', v)}
                            className="rb-bold"
                          >
                            {edu.school}
                          </EditableField>
                        </span>
                        {edu.major && (
                          <span className="text-gray-600">
                            <EditableField
                              value={edu.major}
                              onChange={(v) => onUpdateEducation(edu.id, 'major', v)}
                            >
                              {edu.major}
                            </EditableField>
                          </span>
                        )}
                        {edu.degree && (
                          <span className="text-gray-500">
                            <EditableField
                              value={edu.degree}
                              onChange={(v) => onUpdateEducation(edu.id, 'degree', v)}
                            >
                              {edu.degree}
                            </EditableField>
                          </span>
                        )}
                        {edu.ranking && (
                          <span className="text-gray-500">
                            排名: <EditableField
                              value={edu.ranking}
                              onChange={(v) => onUpdateEducation(edu.id, 'ranking', v)}
                            >
                              {edu.ranking}
                            </EditableField>
                          </span>
                        )}
                      </span>
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        {formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className={`text-gray-700 ${styles.textSize} mt-1`}>
                        <EditableField
                          value={edu.description}
                          onChange={(v) => onUpdateEducation(edu.id, 'description', v)}
                          multiline
                        >
                          {edu.description}
                        </EditableField>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 专业技能 */}
            {form.skills && (
              <div 
                className={`${styles.sectionGap} cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
                onClick={() => onSectionClick?.('skill')}
              >
                <h2 className={`${styles.sectionTitleSize} rb-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  专业技能
                </h2>
                <div className={`text-gray-700 ${styles.textSize} whitespace-pre-line`}>
                  <EditableField
                    value={form.skills}
                    onChange={onUpdateSkills}
                    multiline
                  >
                    {form.skills}
                  </EditableField>
                </div>
              </div>
            )}

            {/* 工作经历 */}
            {form.experience.some(e => e.company) && (
              <div 
                className={`${styles.sectionGap} cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
                onClick={() => onSectionClick?.('work')}
              >
                <h2 className={`${styles.sectionTitleSize} rb-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  工作经历
                </h2>
                {form.experience.filter(e => e.company).map((exp) => (
                  <div key={exp.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2">
                        <span className="rb-bold">
                          <EditableField
                            value={exp.company}
                            onChange={(v) => onUpdateExperience(exp.id, 'company', v)}
                            className="rb-bold"
                          >
                            {exp.company}
                          </EditableField>
                        </span>
                        {exp.position && (
                          <span className="text-gray-600">
                            <EditableField
                              value={exp.position}
                              onChange={(v) => onUpdateExperience(exp.id, 'position', v)}
                            >
                              {exp.position}
                            </EditableField>
                          </span>
                        )}
                      </span>
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        {formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}
                      </span>
                    </div>
                    {exp.bullets.some(b => b && b.trim()) && (
                      <ul className="space-y-0">
                        {exp.bullets.map((bullet, bulletIndex) => {
                          // 跳过空的 bullet
                          if (!bullet || !bullet.trim()) return null;
                          
                          const expIndex = form.experience.findIndex(e => e.id === exp.id);
                          // 使用原始索引和内容查找建议
                          const suggestion = findSuggestion(`experience.${expIndex}.bullets.${bulletIndex}`, bullet);
                          
                          if (suggestion && onAcceptSuggestion && onRejectSuggestion) {
                            return (
                              <li key={bulletIndex} className={`text-gray-700 ${styles.textSize}`}>
                                <AIDiffBlockMultiline
                                  suggestion={suggestion}
                                  onAccept={onAcceptSuggestion}
                                  onReject={onRejectSuggestion}
                                />
                              </li>
                            );
                          }
                          
                          return (
                            <li key={bulletIndex} className={`text-gray-700 ${styles.textSize} flex`}>
                              <span className="mr-1">•</span>
                              <EditableField
                                value={bullet}
                                onChange={(v) => onUpdateExperienceBullet(exp.id, bulletIndex, v)}
                              >
                                {bullet}
                              </EditableField>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 项目经历 */}
            {form.projects.some(p => p.name) && (
              <div 
                className={`${styles.sectionGap} cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
                onClick={() => onSectionClick?.('project')}
              >
                <h2 className={`${styles.sectionTitleSize} rb-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  项目经历
                </h2>
                {form.projects.filter(p => p.name).map((proj) => (
                  <div key={proj.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2">
                        <span className="rb-bold">
                          <EditableField
                            value={proj.name}
                            onChange={(v) => onUpdateProject(proj.id, 'name', v)}
                            className="rb-bold"
                          >
                            {proj.name}
                          </EditableField>
                        </span>
                        {proj.role && (
                          <span className="text-gray-600">
                            <EditableField
                              value={proj.role}
                              onChange={(v) => onUpdateProject(proj.id, 'role', v)}
                            >
                              {proj.role}
                            </EditableField>
                          </span>
                        )}
                      </span>
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        {formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth)}
                      </span>
                    </div>
                    {proj.bullets.some(b => b && b.trim()) && (
                      <ul className="space-y-0">
                        {proj.bullets.map((bullet, bulletIndex) => {
                          // 跳过空的 bullet
                          if (!bullet || !bullet.trim()) return null;
                          
                          const projIndex = form.projects.findIndex(p => p.id === proj.id);
                          // 使用原始索引和内容查找建议
                          const suggestion = findSuggestion(`projects.${projIndex}.bullets.${bulletIndex}`, bullet);
                          
                          if (suggestion && onAcceptSuggestion && onRejectSuggestion) {
                            return (
                              <li key={bulletIndex} className={`text-gray-700 ${styles.textSize}`}>
                                <AIDiffBlockMultiline
                                  suggestion={suggestion}
                                  onAccept={onAcceptSuggestion}
                                  onReject={onRejectSuggestion}
                                />
                              </li>
                            );
                          }
                          
                          return (
                            <li key={bulletIndex} className={`text-gray-700 ${styles.textSize} flex`}>
                              <span className="mr-1">•</span>
                              <EditableField
                                value={bullet}
                                onChange={(v) => onUpdateProjectBullet(proj.id, bulletIndex, v)}
                              >
                                {bullet}
                              </EditableField>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 荣誉奖项 */}
            {form.awards?.some(a => a.name) && (
              <div 
                className={`${styles.sectionGap} cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 rounded transition-colors`}
                onClick={() => onSectionClick?.('award')}
              >
                <h2 className={`${styles.sectionTitleSize} rb-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  荣誉奖项
                </h2>
                {form.awards.filter(a => a.name).map((award) => (
                  <div key={award.id} className={`flex justify-between ${styles.itemGap}`}>
                    <span className={styles.textSize}>
                      <EditableField
                        value={award.name}
                        onChange={(v) => onUpdateAward(award.id, 'name', v)}
                      >
                        {award.name}
                      </EditableField>
                    </span>
                    {award.time && (
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        <EditableField
                          value={award.time}
                          onChange={(v) => onUpdateAward(award.id, 'time', v)}
                        >
                          {award.time}
                        </EditableField>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 页面分割线指示 - 仅在非 AI 建议模式下显示 */}
        {!hasPendingSuggestions && isOverflow && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 pointer-events-none"
            style={{ top: (A4_HEIGHT - styles.padding) * scale }}
          >
            <span className="absolute right-2 -top-5 text-xs text-red-500 bg-white px-1">
              第1页结束
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
