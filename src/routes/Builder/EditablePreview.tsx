import { useRef, useState, useEffect } from 'react';
import { useBuilderForm } from './useBuilderForm';
import { A4_WIDTH, A4_HEIGHT, densityStyles, formatTime } from './utils';
import { EditableField } from './EditableField';

type DensityMode = 'normal' | 'compact' | 'tight';

interface EditablePreviewProps {
  form: ReturnType<typeof useBuilderForm>['form'];
  densityMode?: DensityMode;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onOverflowChange?: (isOverflow: boolean) => void;
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
}

export function EditablePreview({ 
  form, 
  densityMode = 'normal', 
  previewRef, 
  onOverflowChange,
  onUpdateBasicInfo,
  onUpdateEducation,
  onUpdateExperience,
  onUpdateExperienceBullet,
  onUpdateProject,
  onUpdateProjectBullet,
  onUpdateSkillCategory,
  onUpdateSkills,
  onUpdateAward,
}: EditablePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [contentHeight, setContentHeight] = useState(0);
  
  const styles = densityStyles[densityMode];

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [form, densityMode]);

  useEffect(() => {
    const overflow = contentHeight > (A4_HEIGHT - styles.padding * 2);
    onOverflowChange?.(overflow);
  }, [contentHeight, styles.padding, onOverflowChange]);

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

  const usedPercent = Math.min(100, Math.round((contentHeight / (A4_HEIGHT - styles.padding * 2)) * 100));
  const isOverflow = contentHeight > (A4_HEIGHT - styles.padding * 2);
  const pages = Math.ceil(contentHeight / (A4_HEIGHT - styles.padding * 2));

  const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);

  if (!hasContent) {
    return (
      <div ref={containerRef} className="w-full flex flex-col items-center">
        <div 
          className="bg-white shadow-2xl flex items-center justify-center"
          style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
        >
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-base">开始填写左侧表单</p>
            <p className="text-sm mt-1">或直接点击这里编辑</p>
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
            className={`h-full transition-all duration-300 ${
              isOverflow ? 'bg-amber-500' : usedPercent > 85 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        {isOverflow && (
          <div className="mt-2 p-2 bg-amber-500/20 border border-amber-400/50 rounded-lg">
            <p className="text-amber-300 text-xs font-medium mb-1">⚠️ 内容超过 1 页</p>
            <p className="text-amber-200 text-xs">💡 切换到「紧凑」或「极简」模式</p>
          </div>
        )}
      </div>

      {/* 编辑提示 */}
      <div className="w-full max-w-md mb-2">
        <p className="text-xs text-gray-400 text-center">💡 点击下方内容可直接编辑</p>
      </div>

      {/* A4 纸张 */}
      <div 
        className="bg-white shadow-2xl relative overflow-hidden"
        style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
      >
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
                <h1 className={`${styles.titleSize} font-bold text-gray-900 mb-1`}>
                  <EditableField
                    value={form.basicInfo.name || ''}
                    onChange={(v) => onUpdateBasicInfo('name', v)}
                    placeholder="姓名"
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
                    📱 <EditableField
                      value={form.basicInfo.phone || ''}
                      onChange={(v) => onUpdateBasicInfo('phone', v)}
                      placeholder="手机号"
                    >
                      {form.basicInfo.phone || '手机号'}
                    </EditableField>
                  </span>
                  <span>
                    ✉️ <EditableField
                      value={form.basicInfo.email || ''}
                      onChange={(v) => onUpdateBasicInfo('email', v)}
                      placeholder="邮箱"
                    >
                      {form.basicInfo.email || '邮箱'}
                    </EditableField>
                  </span>
                  {form.basicInfo.city && (
                    <span>
                      📍 <EditableField
                        value={form.basicInfo.city}
                        onChange={(v) => onUpdateBasicInfo('city', v)}
                      >
                        {form.basicInfo.city}
                      </EditableField>
                    </span>
                  )}
                  {form.basicInfo.status && (
                    <span>
                      🔵 <EditableField
                        value={form.basicInfo.status}
                        onChange={(v) => onUpdateBasicInfo('status', v)}
                      >
                        {form.basicInfo.status}
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
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  教育经历
                </h2>
                {form.education.filter(e => e.school).map((edu) => (
                  <div key={edu.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          <EditableField
                            value={edu.school}
                            onChange={(v) => onUpdateEducation(edu.id, 'school', v)}
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
            {(form.skillCategories?.some(c => c.name) || form.skills) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  专业技能
                </h2>
                {form.skillCategories?.filter(c => c.name).map((cat) => (
                  <div key={cat.id} className={styles.itemGap}>
                    <span className="font-semibold">
                      <EditableField
                        value={cat.name}
                        onChange={(v) => onUpdateSkillCategory(cat.id, 'name', v)}
                      >
                        {cat.name}
                      </EditableField>
                    </span>
                    {cat.description && (
                      <p className={`text-gray-700 mt-0.5 ${styles.textSize}`}>
                        <EditableField
                          value={cat.description}
                          onChange={(v) => onUpdateSkillCategory(cat.id, 'description', v)}
                          multiline
                        >
                          {cat.description}
                        </EditableField>
                      </p>
                    )}
                  </div>
                ))}
                {!form.skillCategories?.length && form.skills && (
                  <p className={`text-gray-700 ${styles.textSize}`}>
                    <EditableField
                      value={form.skills}
                      onChange={onUpdateSkills}
                      multiline
                    >
                      {form.skills}
                    </EditableField>
                  </p>
                )}
              </div>
            )}

            {/* 工作经历 */}
            {form.experience.some(e => e.company) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  工作经历
                </h2>
                {form.experience.filter(e => e.company).map((exp) => (
                  <div key={exp.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          <EditableField
                            value={exp.company}
                            onChange={(v) => onUpdateExperience(exp.id, 'company', v)}
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
                    {exp.bullets.filter(b => b && b.trim()).length > 0 && (
                      <div className={`text-gray-700 ${styles.textSize}`}>
                        {exp.bullets.filter(b => b && b.trim()).map((bullet, i) => (
                          <p key={i} className="mb-0.5">
                            <EditableField
                              value={bullet}
                              onChange={(v) => onUpdateExperienceBullet(exp.id, i, v)}
                            >
                              {bullet}
                            </EditableField>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 项目经历 */}
            {form.projects.some(p => p.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
                  项目经历
                </h2>
                {form.projects.filter(p => p.name).map((proj) => (
                  <div key={proj.id} className={styles.itemGap}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          <EditableField
                            value={proj.name}
                            onChange={(v) => onUpdateProject(proj.id, 'name', v)}
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
                    {proj.bullets.filter(b => b && b.trim()).length > 0 && (
                      <ul className="space-y-0">
                        {proj.bullets.filter(b => b && b.trim()).map((bullet, i) => (
                          <li key={i} className={`text-gray-700 ${styles.textSize} flex`}>
                            <span className="mr-1">•</span>
                            <EditableField
                              value={bullet}
                              onChange={(v) => onUpdateProjectBullet(proj.id, i, v)}
                            >
                              {bullet}
                            </EditableField>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 荣誉奖项 */}
            {form.awards?.some(a => a.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-2`}>
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

        {/* 页面分割线指示 */}
        {isOverflow && (
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
