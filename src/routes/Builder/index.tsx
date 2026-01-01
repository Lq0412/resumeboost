import { useNavigate, } from 'react-router-dom';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { saveSession, mask } from '../../lib';
import { showToast } from '../../components';
import { useRef, useState, useEffect } from 'react';

type DensityMode = 'normal' | 'compact' | 'tight';

export default function Builder() {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [densityMode, setDensityMode] = useState<DensityMode>('normal');
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
  } = useBuilderForm();

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

  const handleSubmit = () => {
    const markdown = formToMarkdown(form);
    if (markdown.trim().length < 50) {
      showToast('请至少填写一些基本信息', 'error');
      return;
    }
    const { map } = mask(markdown);
    saveSession({ resumeText: markdown, maskingMap: map });
    showToast('简历已保存，进入优化工作台', 'success');
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>
            ResumeBoost
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 text-gray-600 hover:text-gray-800">返回首页</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              完成并优化 →
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：编辑区 */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* 基本信息 + 照片 */}
            <Section title="基本信息">
              <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input label="姓名" value={form.basicInfo.name || ''} onChange={(v) => updateBasicInfo('name', v)} placeholder="张三" />
                  <Input label="求职意向" value={form.basicInfo.jobTitle || ''} onChange={(v) => updateBasicInfo('jobTitle', v)} placeholder="Java开发工程师" />
                  <Input label="手机" value={form.basicInfo.phone} onChange={(v) => updateBasicInfo('phone', v)} placeholder="13800138000" />
                  <Input label="邮箱" value={form.basicInfo.email} onChange={(v) => updateBasicInfo('email', v)} placeholder="example@email.com" />
                  <Input label="求职状态" value={form.basicInfo.status || ''} onChange={(v) => updateBasicInfo('status', v)} placeholder="在职/离职/应届" />
                  <Input label="所在城市" value={form.basicInfo.city || ''} onChange={(v) => updateBasicInfo('city', v)} placeholder="北京" />
                </div>
                {/* 照片上传 */}
                <div className="flex-shrink-0">
                  <label className="block text-xs text-gray-600 mb-1">照片</label>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors overflow-hidden"
                  >
                    {form.photo ? (
                      <img src={form.photo} alt="照片" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 text-xs">
                        <div className="text-2xl mb-1">📷</div>
                        <div>点击上传</div>
                      </div>
                    )}
                  </div>
                  {form.photo && (
                    <button onClick={() => setPhoto('')} className="text-xs text-red-500 hover:text-red-700 mt-1 w-full text-center">删除照片</button>
                  )}
                </div>
              </div>
              {/* 更多信息（可选） */}
              <details className="mt-3">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">+ 更多信息（GitHub、个人网站等）</summary>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <Input label="GitHub" value={form.basicInfo.github || ''} onChange={(v) => updateBasicInfo('github', v)} placeholder="github.com/username" />
                  <Input label="个人网站/博客" value={form.basicInfo.website || ''} onChange={(v) => updateBasicInfo('website', v)} placeholder="yoursite.com" />
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">出生年月</label>
                    <div className="flex gap-2">
                      <select 
                        value={form.basicInfo.birthYear || ''} 
                        onChange={(e) => updateBasicInfo('birthYear', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">年</option>
                        {Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - 18 - i)).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <select 
                        value={form.basicInfo.birthMonth || ''} 
                        onChange={(e) => updateBasicInfo('birthMonth', e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">月</option>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                          <option key={m} value={m}>{parseInt(m)}月</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Input label="籍贯" value={form.basicInfo.hometown || ''} onChange={(v) => updateBasicInfo('hometown', v)} placeholder="广东广州" />
                </div>
              </details>
            </Section>

            {/* 教育经历 */}
            <Section title="教育经历" onAdd={addEducation} addText="+ 添加">
              {form.education.map((edu, idx) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">教育 {idx + 1}</span>
                    {form.education.length > 1 && (
                      <button onClick={() => removeEducation(edu.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input value={edu.school} onChange={(v) => updateEducation(edu.id, 'school', v)} placeholder="学校名称" small />
                    <Input value={edu.major || ''} onChange={(v) => updateEducation(edu.id, 'major', v)} placeholder="专业" small />
                    <Input value={edu.degree || ''} onChange={(v) => updateEducation(edu.id, 'degree', v)} placeholder="学历（本科/硕士）" small />
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">在校时间</label>
                    <DateRangePicker
                      startYear={edu.startYear}
                      startMonth={edu.startMonth}
                      endYear={edu.endYear}
                      endMonth={edu.endMonth}
                      onStartChange={(y, m) => { updateEducation(edu.id, 'startYear', y); updateEducation(edu.id, 'startMonth', m); }}
                      onEndChange={(y, m) => { updateEducation(edu.id, 'endYear', y); updateEducation(edu.id, 'endMonth', m); }}
                    />
                  </div>
                </div>
              ))}
            </Section>

            {/* 专业技能 */}
            <Section title="专业技能" onAdd={addSkillCategory} addText="+ 添加技能类别">
              {form.skillCategories && form.skillCategories.map((cat, idx) => (
                <div key={cat.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">技能类别 {idx + 1}</span>
                    {form.skillCategories!.length > 1 && (
                      <button onClick={() => removeSkillCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <Input value={cat.name} onChange={(v) => updateSkillCategory(cat.id, 'name', v)} placeholder="类别名称（如：Java、数据库）" small />
                  <textarea
                    value={cat.description}
                    onChange={(e) => updateSkillCategory(cat.id, 'description', e.target.value)}
                    className="w-full mt-2 px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder="技能描述..."
                  />
                </div>
              ))}
              {(!form.skillCategories || form.skillCategories.length === 0) && (
                <textarea
                  value={form.skills}
                  onChange={(e) => updateSkills(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="或直接输入技能列表：JavaScript, React, Node.js..."
                />
              )}
            </Section>

            {/* 工作经历 */}
            <Section title="工作经历" onAdd={addExperience} addText="+ 添加" optional>
              {form.experience.map((exp, idx) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">工作 {idx + 1}</span>
                    <button onClick={() => removeExperience(exp.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input value={exp.company} onChange={(v) => updateExperience(exp.id, 'company', v)} placeholder="公司名称" small />
                    <Input value={exp.position} onChange={(v) => updateExperience(exp.id, 'position', v)} placeholder="职位" small />
                    <Input value={exp.location || ''} onChange={(v) => updateExperience(exp.id, 'location', v)} placeholder="工作地点" small />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">工作时间</label>
                    <DateRangePicker
                      startYear={exp.startYear}
                      startMonth={exp.startMonth}
                      endYear={exp.endYear}
                      endMonth={exp.endMonth}
                      onStartChange={(y, m) => { updateExperience(exp.id, 'startYear', y); updateExperience(exp.id, 'startMonth', m); }}
                      onEndChange={(y, m) => { updateExperience(exp.id, 'endYear', y); updateExperience(exp.id, 'endMonth', m); }}
                      showPresent
                    />
                  </div>
                  <textarea
                    value={exp.bullets.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      lines.forEach((line, i) => {
                        if (i < exp.bullets.length) {
                          updateExperienceBullet(exp.id, i, line);
                        } else if (line.trim() && exp.bullets.length < 5) {
                          addExperienceBullet(exp.id);
                          setTimeout(() => updateExperienceBullet(exp.id, i, line), 0);
                        }
                      });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="工作内容描述..."
                  />
                </div>
              ))}
            </Section>

            {/* 项目经历 */}
            <Section title="项目经历" onAdd={addProject} addText="+ 添加" optional>
              {form.projects.map((proj, idx) => (
                <div key={proj.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">项目 {idx + 1}</span>
                    <button onClick={() => removeProject(proj.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} placeholder="项目名称" small />
                    <Input value={proj.role || ''} onChange={(v) => updateProject(proj.id, 'role', v)} placeholder="角色/职位" small />
                    <div className="col-span-2">
                      <Input value={proj.link || ''} onChange={(v) => updateProject(proj.id, 'link', v)} placeholder="项目链接（GitHub/演示地址）" small />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">项目时间</label>
                    <DateRangePicker
                      startYear={proj.startYear}
                      startMonth={proj.startMonth}
                      endYear={proj.endYear}
                      endMonth={proj.endMonth}
                      onStartChange={(y, m) => { updateProject(proj.id, 'startYear', y); updateProject(proj.id, 'startMonth', m); }}
                      onEndChange={(y, m) => { updateProject(proj.id, 'endYear', y); updateProject(proj.id, 'endMonth', m); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">项目描述</label>
                    <div className="space-y-1">
                      {proj.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex gap-1 items-start">
                          <span className="text-gray-400 mt-1.5 text-sm">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateProjectBullet(proj.id, bIdx, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="描述项目内容、技术栈、成果..."
                          />
                          {proj.bullets.length > 1 && (
                            <button onClick={() => removeProjectBullet(proj.id, bIdx)} className="text-gray-400 hover:text-red-500 px-1">×</button>
                          )}
                        </div>
                      ))}
                      {proj.bullets.length < 5 && (
                        <button onClick={() => addProjectBullet(proj.id)} className="text-xs text-blue-600 hover:text-blue-800 ml-4">+ 添加描述</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Section>

            {/* 荣誉奖项 */}
            <Section title="荣誉奖项" onAdd={addAward} addText="+ 添加" optional>
              {form.awards && form.awards.map((award) => (
                <div key={award.id} className="flex gap-2 mb-2">
                  <Input value={award.name} onChange={(v) => updateAward(award.id, 'name', v)} placeholder="奖项名称" small />
                  <Input value={award.time || ''} onChange={(v) => updateAward(award.id, 'time', v)} placeholder="时间" small />
                  <button onClick={() => removeAward(award.id)} className="text-gray-400 hover:text-red-500 px-2">×</button>
                </div>
              ))}
            </Section>
          </div>

          {/* 右侧：实时预览 */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <div className="bg-gray-700 rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-gray-800 border-b border-gray-600 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-medium text-gray-200">📄 简历预览</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">密度:</span>
                  <select 
                    value={densityMode} 
                    onChange={(e) => setDensityMode(e.target.value as DensityMode)}
                    className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1"
                  >
                    <option value="normal">标准</option>
                    <option value="compact">紧凑</option>
                    <option value="tight">极简</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex justify-center">
                <ResumePreview form={form} densityMode={densityMode} />
              </div>
            </div>
          </div>
        </div>
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
function ResumePreview({ form, densityMode = 'normal' }: { form: ReturnType<typeof useBuilderForm>['form']; densityMode?: DensityMode }) {
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
          className={styles.lineHeight}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: A4_WIDTH,
            minHeight: A4_HEIGHT,
            padding: styles.padding,
            fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
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
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-1 ${styles.itemGap}`}>教育经历</h2>
                {form.education.filter(e => e.school).map((edu) => (
                  <div key={edu.id} className={styles.itemGap}>
                    <div className="flex justify-between items-start">
                      <div><span className="font-semibold">{edu.school}</span>{edu.major && <span className="text-gray-600 ml-2">{edu.major}</span>}</div>
                      <span className={`text-gray-500 ${styles.textSize}`}>{formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth)}</span>
                    </div>
                    {edu.degree && <div className={`text-gray-600 ${styles.textSize}`}>{edu.degree}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* 专业技能 */}
            {(form.skillCategories?.some(c => c.name) || form.skills) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-1 ${styles.itemGap}`}>专业技能</h2>
                {form.skillCategories?.filter(c => c.name).map((cat) => (
                  <div key={cat.id} className={styles.itemGap}><span className="font-semibold">{cat.name}</span>{cat.description && <p className={`text-gray-700 mt-0.5 ${styles.textSize}`}>{cat.description}</p>}</div>
                ))}
                {!form.skillCategories?.length && form.skills && <p className={`text-gray-700 ${styles.textSize}`}>{form.skills}</p>}
              </div>
            )}

            {/* 工作经历 */}
            {form.experience.some(e => e.company) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-1 ${styles.itemGap}`}>工作经历</h2>
                {form.experience.filter(e => e.company).map((exp) => (
                  <div key={exp.id} className={styles.itemGap}>
                    <div className="flex justify-between items-start"><span className="font-semibold">{exp.company}</span><span className={`text-gray-500 ${styles.textSize}`}>{formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth)}</span></div>
                    <div className={`text-gray-600 ${styles.textSize}`}>{exp.position}{exp.location && ` · ${exp.location}`}</div>
                    {exp.bullets.filter(b => b.trim()).length > 0 && <p className={`text-gray-700 ${styles.textSize}`}>{exp.bullets.filter(b => b.trim()).join(' ')}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* 项目经历 */}
            {form.projects.some(p => p.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-1 ${styles.itemGap}`}>项目经历</h2>
                {form.projects.filter(p => p.name).map((proj) => (
                  <div key={proj.id} className={styles.itemGap}>
                    <div className="flex justify-between items-start">
                      <div><span className="font-semibold">{proj.name}</span>{proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className={`text-blue-600 ${styles.textSize} ml-2 hover:underline`}>{proj.link}</a>}</div>
                      <span className={`text-gray-500 ${styles.textSize}`}>{formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth)}</span>
                    </div>
                    {proj.role && <div className={`text-gray-600 ${styles.textSize}`}>{proj.role}</div>}
                    {proj.bullets.filter(b => b.trim()).length > 0 && (
                      <ul className="mt-0.5 space-y-0">{proj.bullets.filter(b => b.trim()).map((bullet, i) => (<li key={i} className={`text-gray-700 ${styles.textSize} flex`}><span className="mr-1">•</span><span>{bullet}</span></li>))}</ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 荣誉奖项 */}
            {form.awards?.some(a => a.name) && (
              <div className={styles.sectionGap}>
                <h2 className={`${styles.sectionTitleSize} font-bold text-gray-900 border-b-2 border-gray-800 pb-1 ${styles.itemGap}`}>荣誉奖项</h2>
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

// 年月选择器组件
function DateRangePicker({
  startYear, startMonth, endYear, endMonth,
  onStartChange, onEndChange, showPresent
}: {
  startYear?: string; startMonth?: string; endYear?: string; endMonth?: string;
  onStartChange: (year: string, month: string) => void;
  onEndChange: (year: string, month: string) => void;
  showPresent?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  // 包含未来5年（支持在读学生）和过去25年
  const futureYears = Array.from({ length: 5 }, (_, i) => String(currentYear + 5 - i));
  const pastYears = Array.from({ length: 25 }, (_, i) => String(currentYear - i));
  const allYears = [...futureYears, ...pastYears];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const selectClass = "flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        <select 
          value={startYear || ''} 
          onChange={(e) => onStartChange(e.target.value, startMonth || '')} 
          className={selectClass}
        >
          <option value="">开始年</option>
          {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        <select 
          value={startMonth || ''} 
          onChange={(e) => onStartChange(startYear || '', e.target.value)} 
          className={selectClass}
        >
          <option value="">月</option>
          {months.map(m => <option key={m} value={m}>{parseInt(m)}月</option>)}
        </select>
      </div>
      <span className="text-gray-400 text-sm">至</span>
      <div className="flex gap-1 flex-1">
        <select 
          value={endYear || ''} 
          onChange={(e) => onEndChange(e.target.value, e.target.value === 'present' ? '' : (endMonth || ''))} 
          className={selectClass}
        >
          <option value="">结束年</option>
          {showPresent && <option value="present">至今</option>}
          {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        {endYear !== 'present' && (
          <select 
            value={endMonth || ''} 
            onChange={(e) => onEndChange(endYear || '', e.target.value)} 
            className={selectClass}
          >
            <option value="">月</option>
            {months.map(m => <option key={m} value={m}>{parseInt(m)}月</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// 通用组件
function Section({ title, children, onAdd, addText, optional }: { 
  title: string; children: React.ReactNode; onAdd?: () => void; addText?: string; optional?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-900">
          {title}{optional && <span className="text-xs text-gray-400 font-normal ml-1">（可选）</span>}
        </h2>
        {onAdd && <button onClick={onAdd} className="text-sm text-blue-600 hover:text-blue-800">{addText || '+ 添加'}</button>}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, small }: { 
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; small?: boolean;
}) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-600 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${small ? 'py-1.5 text-sm' : 'py-2'}`}
        placeholder={placeholder}
      />
    </div>
  );
}
