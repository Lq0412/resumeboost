import { useRef, useState, useEffect } from 'react';
import { useBuilderForm } from './useBuilderForm';
import { A4_WIDTH, A4_HEIGHT, densityStyles, formatTime } from './utils';

type DensityMode = 'normal' | 'compact' | 'tight';

interface ResumePreviewProps {
  form: ReturnType<typeof useBuilderForm>['form'];
  densityMode?: DensityMode;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onOverflowChange?: (isOverflow: boolean) => void;
}

export function ResumePreview({ form, densityMode = 'normal', previewRef, onOverflowChange }: ResumePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [contentHeight, setContentHeight] = useState(0);
  
  const styles = densityStyles[densityMode];

  // 计算可用高度（A4 高度减去上下 padding）
  const availableHeight = A4_HEIGHT - styles.padding * 2;

  // 使用 ResizeObserver 监听内容高度变化
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const updateHeight = () => {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          const height = contentRef.current.scrollHeight;
          setContentHeight(height);
        }
      });
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentEl);

    const mutationObserver = new MutationObserver(updateHeight);
    mutationObserver.observe(contentEl, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [densityMode, form]);

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

  const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);

  if (!hasContent) {
    return (
      <div ref={containerRef} className="w-full flex flex-col items-center">
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
            className={`h-full transition-all duration-300 ${
              isOverflow ? 'bg-amber-500' : usedPercent > 85 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        {isOverflow && (
          <div className="mt-2 p-2 bg-amber-500/20 border border-amber-400/50 rounded-lg">
            <p className="text-amber-300 text-xs font-medium mb-1">
              ⚠️ 内容超过 1 页，建议优化
            </p>
            <p className="text-amber-200 text-xs">
              💡 尝试切换到「紧凑」或「极简」模式，或精简部分内容
            </p>
          </div>
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
                {form.basicInfo.name && (
                  <h1 className={`${styles.titleSize} font-bold text-gray-900 mb-1`}>
                    {form.basicInfo.name}
                  </h1>
                )}
                {form.basicInfo.jobTitle && (
                  <p className={`${styles.textSize} text-gray-700 mb-1`}>
                    求职意向：{form.basicInfo.jobTitle}
                  </p>
                )}
                <div className={`grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600 ${styles.textSize}`}>
                  {form.basicInfo.phone && <span>📱 {form.basicInfo.phone}</span>}
                  {form.basicInfo.email && <span>✉️ {form.basicInfo.email}</span>}
                  {form.basicInfo.city && <span>📍 {form.basicInfo.city}</span>}
                  {form.basicInfo.status && <span>🔵 {form.basicInfo.status}</span>}
                  {form.basicInfo.birthYear && (
                    <span>
                      🎂 {form.basicInfo.birthYear}
                      {form.basicInfo.birthMonth && `-${form.basicInfo.birthMonth}`}
                    </span>
                  )}
                  {form.basicInfo.hometown && <span>🏠 {form.basicInfo.hometown}</span>}
                  {form.basicInfo.github && (
                    <a 
                      href={form.basicInfo.github.startsWith('http') ? form.basicInfo.github : `https://${form.basicInfo.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline truncate"
                    >
                      🔗 {form.basicInfo.github}
                    </a>
                  )}
                  {form.basicInfo.website && (
                    <a 
                      href={form.basicInfo.website.startsWith('http') ? form.basicInfo.website : `https://${form.basicInfo.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline truncate"
                    >
                      🌐 {form.basicInfo.website}
                    </a>
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
                      <span className="flex items-center">
                        <span className="font-semibold">{edu.school}</span>
                        {edu.major && <span className="text-gray-600 ml-3">{edu.major}</span>}
                        {edu.degree && <span className="text-gray-500 ml-2">{edu.degree}</span>}
                      </span>
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        {formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className={`text-gray-700 ${styles.textSize} mt-1`}>{edu.description}</p>
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
                    <span className="font-semibold">{cat.name}</span>
                    {cat.description && (
                      <p className={`text-gray-700 mt-0.5 ${styles.textSize}`}>{cat.description}</p>
                    )}
                  </div>
                ))}
                {!form.skillCategories?.length && form.skills && (
                  <p className={`text-gray-700 ${styles.textSize}`}>{form.skills}</p>
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
                      <span className="flex items-center">
                        <span className="font-semibold">{exp.company}</span>
                        {exp.position && <span className="text-gray-600 ml-2">{exp.position}</span>}
                        {exp.location && <span className="text-gray-500 ml-2">{exp.location}</span>}
                      </span>
                      <span className={`text-gray-500 ${styles.textSize}`}>
                        {formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}
                      </span>
                    </div>
                    {exp.bullets.filter(b => b && b.trim()).length > 0 && (
                      <ul className="space-y-0">
                        {exp.bullets.filter(b => b && b.trim()).map((bullet, i) => (
                          <li key={i} className={`text-gray-700 ${styles.textSize} flex`}>
                            <span className="mr-1">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
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
                      <span className="flex items-center">
                        <span className="font-semibold">{proj.name}</span>
                        {proj.role && <span className="text-gray-600 ml-2">{proj.role}</span>}
                        {proj.link && (
                          <a 
                            href={proj.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`text-blue-600 ${styles.textSize} ml-2 hover:underline`}
                          >
                            {proj.link}
                          </a>
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
                            <span>{bullet}</span>
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
                    <span className={styles.textSize}>{award.name}</span>
                    {award.time && (
                      <span className={`text-gray-500 ${styles.textSize}`}>{award.time}</span>
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
