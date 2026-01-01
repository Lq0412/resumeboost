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
    addProject,
    removeProject,
    updateProject,
    updateProjectBullet,
    addProjectBullet,
    updateSkills,
    addSkillCategory,
    removeSkillCategory,
    updateSkillCategory,
    addAward,
    removeAward,
    updateAward,
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
                  label="求职意向"
                  value={form.basicInfo.jobTitle || ''}
                  onChange={(v) => updateBasicInfo('jobTitle', v)}
                  placeholder="Java开发工程师"
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
                  label="求职状态"
                  value={form.basicInfo.status || ''}
                  onChange={(v) => updateBasicInfo('status', v)}
                  placeholder="在职/离职/应届"
                />
                <Input
                  label="所在城市"
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
              addText="+ 添加"
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
                    <Input value={edu.school} onChange={(v) => updateEducation(edu.id, 'school', v)} placeholder="学校名称" small />
                    <Input value={edu.major || ''} onChange={(v) => updateEducation(edu.id, 'major', v)} placeholder="专业" small />
                    <Input value={edu.degree || ''} onChange={(v) => updateEducation(edu.id, 'degree', v)} placeholder="学历（本科/硕士）" small />
                    <Input value={edu.timePeriod} onChange={(v) => updateEducation(edu.id, 'timePeriod', v)} placeholder="2019-09 ~ 2023-07" small />
                  </div>
                </div>
              ))}
            </Section>

            {/* 专业技能 */}
            <Section 
              title="专业技能" 
              onAdd={addSkillCategory}
              addText="+ 添加技能类别"
            >
              {form.skillCategories && form.skillCategories.map((cat, idx) => (
                <div key={cat.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">技能类别 {idx + 1}</span>
                    {form.skillCategories!.length > 1 && (
                      <button onClick={() => removeSkillCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <Input 
                    value={cat.name} 
                    onChange={(v) => updateSkillCategory(cat.id, 'name', v)} 
                    placeholder="类别名称（如：Java、数据库、网络编程）" 
                    small 
                  />
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
            <Section 
              title="工作经历" 
              onAdd={addExperience}
              addText="+ 添加"
            >
              {form.experience.map((exp, idx) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">工作 {idx + 1}</span>
                    {form.experience.length > 1 && (
                      <button onClick={() => removeExperience(exp.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input value={exp.company} onChange={(v) => updateExperience(exp.id, 'company', v)} placeholder="公司名称" small />
                    <Input value={exp.timePeriod} onChange={(v) => updateExperience(exp.id, 'timePeriod', v)} placeholder="2020-01 ~ 2021-01" small />
                    <Input value={exp.position} onChange={(v) => updateExperience(exp.id, 'position', v)} placeholder="职位" small />
                    <Input value={exp.location || ''} onChange={(v) => updateExperience(exp.id, 'location', v)} placeholder="工作地点" small />
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
                    placeholder="工作内容描述（可多行）..."
                  />
                </div>
              ))}
            </Section>

            {/* 项目经历 */}
            <Section 
              title="项目经历" 
              onAdd={addProject}
              addText="+ 添加"
              optional
            >
              {form.projects.map((proj, idx) => (
                <div key={proj.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">项目 {idx + 1}</span>
                    <button onClick={() => removeProject(proj.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} placeholder="项目名称" small />
                    <Input value={proj.timePeriod || ''} onChange={(v) => updateProject(proj.id, 'timePeriod', v)} placeholder="2021-03 ~ 2021-05" small />
                    <Input value={proj.role || ''} onChange={(v) => updateProject(proj.id, 'role', v)} placeholder="角色/职位" small />
                    <Input value={proj.location || ''} onChange={(v) => updateProject(proj.id, 'location', v)} placeholder="地点" small />
                  </div>
                  <textarea
                    value={proj.bullets.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      lines.forEach((line, i) => {
                        if (i < proj.bullets.length) {
                          updateProjectBullet(proj.id, i, line);
                        } else if (line.trim() && proj.bullets.length < 5) {
                          addProjectBullet(proj.id);
                          setTimeout(() => updateProjectBullet(proj.id, i, line), 0);
                        }
                      });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="项目描述..."
                  />
                </div>
              ))}
            </Section>

            {/* 荣誉奖项 */}
            <Section 
              title="荣誉奖项" 
              onAdd={addAward}
              addText="+ 添加"
              optional
            >
              {form.awards && form.awards.map((award) => (
                <div key={award.id} className="flex gap-2 mb-2">
                  <Input 
                    value={award.name} 
                    onChange={(v) => updateAward(award.id, 'name', v)} 
                    placeholder="奖项名称" 
                    small 
                  />
                  <Input 
                    value={award.time || ''} 
                    onChange={(v) => updateAward(award.id, 'time', v)} 
                    placeholder="时间" 
                    small 
                  />
                  <button onClick={() => removeAward(award.id)} className="text-gray-400 hover:text-red-500 px-2">×</button>
                </div>
              ))}
            </Section>
          </div>

          {/* 右侧：实时预览 */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">📄 简历预览</span>
                <span className="text-xs text-gray-500">实时更新</span>
              </div>
              <div className="flex-1 overflow-auto">
                <ResumePreview form={form} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 简历预览组件 - 参照专业简历模板
function ResumePreview({ form }: { form: ReturnType<typeof useBuilderForm>['form'] }) {
  const hasContent = form.basicInfo.name || form.basicInfo.phone || form.education.some(e => e.school);

  if (!hasContent) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-8">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p>开始填写左侧表单</p>
          <p className="text-sm">简历将在这里实时显示</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-800" style={{ fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif", fontSize: '12px', lineHeight: '1.6' }}>
      {/* 头部：姓名 + 联系方式 */}
      <div className="mb-4">
        {form.basicInfo.name && (
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.basicInfo.name}</h1>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 text-xs">
          {form.basicInfo.phone && <span>📱 {form.basicInfo.phone}</span>}
          {form.basicInfo.email && <span>✉️ {form.basicInfo.email}</span>}
          {form.basicInfo.status && <span>🔵 {form.basicInfo.status}</span>}
          {form.basicInfo.jobTitle && <span>💼 {form.basicInfo.jobTitle}</span>}
        </div>
      </div>

      {/* 教育经历 */}
      {form.education.some(e => e.school) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">教育经历</h2>
          {form.education.filter(e => e.school).map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{edu.school}</span>
                  {edu.major && <span className="text-gray-600 ml-2">{edu.major}</span>}
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap">{edu.timePeriod}</span>
              </div>
              {edu.degree && <div className="text-gray-600 text-xs">{edu.degree}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 专业技能 */}
      {(form.skillCategories?.some(c => c.name) || form.skills) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">专业技能</h2>
          {form.skillCategories?.filter(c => c.name).map((cat) => (
            <div key={cat.id} className="mb-2">
              <span className="font-semibold">{cat.name}</span>
              {cat.description && <p className="text-gray-700 mt-0.5">{cat.description}</p>}
            </div>
          ))}
          {!form.skillCategories?.length && form.skills && (
            <p className="text-gray-700">{form.skills}</p>
          )}
        </div>
      )}

      {/* 工作经历 */}
      {form.experience.some(e => e.company) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">工作经历</h2>
          {form.experience.filter(e => e.company).map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{exp.company}</span>
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap">{exp.timePeriod}</span>
              </div>
              <div className="text-gray-600 text-xs mb-1">
                {exp.position}{exp.location && ` · ${exp.location}`}
              </div>
              {exp.bullets.filter(b => b.trim()).length > 0 && (
                <p className="text-gray-700">{exp.bullets.filter(b => b.trim()).join(' ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 项目经历 */}
      {form.projects.some(p => p.name) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">项目经历</h2>
          {form.projects.filter(p => p.name).map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{proj.name}</span>
                </div>
                {proj.timePeriod && <span className="text-gray-500 text-xs whitespace-nowrap">{proj.timePeriod}</span>}
              </div>
              {(proj.role || proj.location) && (
                <div className="text-gray-600 text-xs mb-1">
                  {proj.role}{proj.location && ` · ${proj.location}`}
                </div>
              )}
              {proj.bullets.filter(b => b.trim()).length > 0 && (
                <p className="text-gray-700">{proj.bullets.filter(b => b.trim()).join(' ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 荣誉奖项 */}
      {form.awards?.some(a => a.name) && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-3">荣誉奖项</h2>
          {form.awards.filter(a => a.name).map((award) => (
            <div key={award.id} className="flex justify-between mb-1">
              <span>{award.name}</span>
              {award.time && <span className="text-gray-500 text-xs">{award.time}</span>}
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
