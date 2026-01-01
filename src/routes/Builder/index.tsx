import { useNavigate } from 'react-router-dom';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { saveSession, mask } from '../../lib';
import { showToast } from '../../components';

export default function Builder() {
  const navigate = useNavigate();
  const {
    form,
    updateBasicInfo,
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
  } = useBuilderForm();

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => navigate('/')}
          >
            ResumeBoost
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              返回首页
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              完成并优化 →
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：编辑区 */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* 基本信息 */}
            <Section title="基本信息">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="姓名"
                  value={form.basicInfo.name || ''}
                  onChange={(v) => updateBasicInfo('name', v)}
                  placeholder="张三"
                />
                <Input
                  label="手机"
                  value={form.basicInfo.phone}
                  onChange={(v) => updateBasicInfo('phone', v)}
                  placeholder="13800138000"
                />
                <Input
                  label="邮箱"
                  value={form.basicInfo.email}
                  onChange={(v) => updateBasicInfo('email', v)}
                  placeholder="example@email.com"
                />
                <Input
                  label="城市"
                  value={form.basicInfo.city || ''}
                  onChange={(v) => updateBasicInfo('city', v)}
                  placeholder="北京"
                />
              </div>
            </Section>

            {/* 教育经历 */}
            <Section 
              title="教育经历" 
              onAdd={addEducation}
              addText="+ 添加教育经历"
            >
              {form.education.map((edu, idx) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">教育 {idx + 1}</span>
                    {form.education.length > 1 && (
                      <button onClick={() => removeEducation(edu.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={edu.school}
                      onChange={(v) => updateEducation(edu.id, 'school', v)}
                      placeholder="学校名称"
                      small
                    />
                    <Input
                      value={edu.major || ''}
                      onChange={(v) => updateEducation(edu.id, 'major', v)}
                      placeholder="专业"
                      small
                    />
                    <Input
                      value={edu.degree || ''}
                      onChange={(v) => updateEducation(edu.id, 'degree', v)}
                      placeholder="学历（本科/硕士）"
                      small
                    />
                    <Input
                      value={edu.timePeriod}
                      onChange={(v) => updateEducation(edu.id, 'timePeriod', v)}
                      placeholder="2018.09 - 2022.06"
                      small
                    />
                  </div>
                </div>
              ))}
            </Section>

            {/* 工作经历 */}
            <Section 
              title="工作经历" 
              onAdd={addExperience}
              addText="+ 添加工作经历"
            >
              {form.experience.map((exp, idx) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">工作 {idx + 1}</span>
                    {form.experience.length > 1 && (
                      <button onClick={() => removeExperience(exp.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      value={exp.company}
                      onChange={(v) => updateExperience(exp.id, 'company', v)}
                      placeholder="公司名称"
                      small
                    />
                    <Input
                      value={exp.position}
                      onChange={(v) => updateExperience(exp.id, 'position', v)}
                      placeholder="职位"
                      small
                    />
                    <Input
                      value={exp.timePeriod}
                      onChange={(v) => updateExperience(exp.id, 'timePeriod', v)}
                      placeholder="2022.07 - 至今"
                      small
                    />
                  </div>
                  <div className="space-y-1">
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-1">
                        <span className="text-gray-400 mt-1.5 text-sm">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="描述工作内容和成果..."
                        />
                        {exp.bullets.length > 1 && (
                          <button onClick={() => removeExperienceBullet(exp.id, bIdx)} className="text-gray-400 hover:text-red-500 px-1">×</button>
                        )}
                      </div>
                    ))}
                    {exp.bullets.length < 5 && (
                      <button onClick={() => addExperienceBullet(exp.id)} className="text-xs text-blue-600 hover:text-blue-800 ml-4">+ 添加描述</button>
                    )}
                  </div>
                </div>
              ))}
            </Section>

            {/* 项目经历 */}
            <Section 
              title="项目经历" 
              onAdd={addProject}
              addText="+ 添加项目"
              optional
            >
              {form.projects.map((proj, idx) => (
                <div key={proj.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">项目 {idx + 1}</span>
                    <button onClick={() => removeProject(proj.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      value={proj.name}
                      onChange={(v) => updateProject(proj.id, 'name', v)}
                      placeholder="项目名称"
                      small
                    />
                    <Input
                      value={proj.role || ''}
                      onChange={(v) => updateProject(proj.id, 'role', v)}
                      placeholder="角色"
                      small
                    />
                    <Input
                      value={proj.timePeriod || ''}
                      onChange={(v) => updateProject(proj.id, 'timePeriod', v)}
                      placeholder="时间"
                      small
                    />
                  </div>
                  <div className="space-y-1">
                    {proj.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-1">
                        <span className="text-gray-400 mt-1.5 text-sm">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateProjectBullet(proj.id, bIdx, e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="描述项目内容..."
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
              ))}
            </Section>

            {/* 技能 */}
            <Section title="专业技能">
              <textarea
                value={form.skills}
                onChange={(e) => updateSkills(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="JavaScript, React, Node.js, Python, MySQL..."
              />
            </Section>
          </div>

          {/* 右侧：实时预览 */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">📄 简历预览</span>
                <span className="text-xs text-gray-500">实时更新</span>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <ResumePreview form={form} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 简历预览组件
function ResumePreview({ form }: { form: ReturnType<typeof useBuilderForm>['form'] }) {
  const hasBasicInfo = form.basicInfo.name || form.basicInfo.phone || form.basicInfo.email;
  const hasEducation = form.education.some(e => e.school);
  const hasExperience = form.experience.some(e => e.company || e.position);
  const hasProjects = form.projects.some(p => p.name);
  const hasSkills = form.skills.trim();

  if (!hasBasicInfo && !hasEducation && !hasExperience && !hasProjects && !hasSkills) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p>开始填写左侧表单</p>
          <p className="text-sm">简历将在这里实时显示</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-preview text-sm leading-relaxed" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* 姓名和联系方式 */}
      {hasBasicInfo && (
        <div className="text-center mb-4 pb-3 border-b border-gray-200">
          {form.basicInfo.name && (
            <h1 className="text-xl font-bold text-gray-900 mb-1">{form.basicInfo.name}</h1>
          )}
          <div className="text-gray-600 text-xs space-x-3">
            {form.basicInfo.phone && <span>📱 {form.basicInfo.phone}</span>}
            {form.basicInfo.email && <span>✉️ {form.basicInfo.email}</span>}
            {form.basicInfo.city && <span>📍 {form.basicInfo.city}</span>}
          </div>
        </div>
      )}

      {/* 教育经历 */}
      {hasEducation && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">教育背景</h2>
          {form.education.filter(e => e.school).map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-medium">{edu.school}</span>
                <span className="text-xs text-gray-500">{edu.timePeriod}</span>
              </div>
              {(edu.major || edu.degree) && (
                <div className="text-gray-600 text-xs">
                  {edu.degree && <span>{edu.degree}</span>}
                  {edu.degree && edu.major && <span> · </span>}
                  {edu.major && <span>{edu.major}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 专业技能 */}
      {hasSkills && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">专业技能</h2>
          <p className="text-gray-700 text-xs">{form.skills}</p>
        </div>
      )}

      {/* 工作经历 */}
      {hasExperience && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">工作经历</h2>
          {form.experience.filter(e => e.company || e.position).map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-medium">{exp.company}{exp.position && ` · ${exp.position}`}</span>
                <span className="text-xs text-gray-500">{exp.timePeriod}</span>
              </div>
              {exp.bullets.filter(b => b.trim()).length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                    <li key={i} className="text-gray-700 text-xs flex">
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
      {hasProjects && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">项目经历</h2>
          {form.projects.filter(p => p.name).map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-medium">{proj.name}{proj.role && ` · ${proj.role}`}</span>
                {proj.timePeriod && <span className="text-xs text-gray-500">{proj.timePeriod}</span>}
              </div>
              {proj.bullets.filter(b => b.trim()).length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {proj.bullets.filter(b => b.trim()).map((bullet, i) => (
                    <li key={i} className="text-gray-700 text-xs flex">
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
    </div>
  );
}

// 通用组件
function Section({ 
  title, 
  children, 
  onAdd, 
  addText,
  optional 
}: { 
  title: string; 
  children: React.ReactNode; 
  onAdd?: () => void;
  addText?: string;
  optional?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-900">
          {title}
          {optional && <span className="text-xs text-gray-400 font-normal ml-1">（可选）</span>}
        </h2>
        {onAdd && (
          <button onClick={onAdd} className="text-sm text-blue-600 hover:text-blue-800">
            {addText || '+ 添加'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({ 
  label, 
  value, 
  onChange, 
  placeholder,
  small 
}: { 
  label?: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  small?: boolean;
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
