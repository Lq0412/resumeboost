import { useNavigate } from 'react-router-dom';
import { useBuilderForm } from './useBuilderForm';
import { formToMarkdown } from './formToMarkdown';
import { saveSession, mask } from '../../lib';
import { showToast } from '../../components';

export default function Builder() {
  const navigate = useNavigate();
  const {
    form,
    errors,
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
    validate,
  } = useBuilderForm();

  const handleSubmit = () => {
    const result = validate();
    if (!result.valid) {
      showToast(result.errors[0], 'error');
      return;
    }

    const markdown = formToMarkdown(form);
    const { map } = mask(markdown);
    
    saveSession({
      resumeText: markdown,
      maskingMap: map,
    });

    showToast('简历初稿已生成', 'success');
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">简历生成器</h1>
          <p className="text-gray-600 mt-1">填写以下信息，快速生成专业简历初稿</p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          </div>
        )}

        {/* 基本信息 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={form.basicInfo.name || ''}
                onChange={(e) => updateBasicInfo('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="可选"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机 *</label>
              <input
                type="tel"
                value={form.basicInfo.phone}
                onChange={(e) => updateBasicInfo('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="必填"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
              <input
                type="email"
                value={form.basicInfo.email}
                onChange={(e) => updateBasicInfo('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="必填"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <input
                type="text"
                value={form.basicInfo.city || ''}
                onChange={(e) => updateBasicInfo('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="可选"
              />
            </div>
          </div>
        </section>

        {/* 教育经历 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">教育经历</h2>
            <button onClick={addEducation} className="text-sm text-blue-600 hover:text-blue-800">+ 添加</button>
          </div>
          {form.education.map((edu, idx) => (
            <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">教育经历 {idx + 1}</span>
                {form.education.length > 1 && (
                  <button onClick={() => removeEducation(edu.id)} className="text-sm text-red-500 hover:text-red-700">删除</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="学校 *"
                />
                <input
                  type="text"
                  value={edu.major || ''}
                  onChange={(e) => updateEducation(edu.id, 'major', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="专业"
                />
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="学历"
                />
                <input
                  type="text"
                  value={edu.timePeriod}
                  onChange={(e) => updateEducation(edu.id, 'timePeriod', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="时间 * (如 2018-2022)"
                />
              </div>
            </div>
          ))}
        </section>

        {/* 工作经历 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">工作经历</h2>
            <button onClick={addExperience} className="text-sm text-blue-600 hover:text-blue-800">+ 添加</button>
          </div>
          {form.experience.map((exp, idx) => (
            <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">工作经历 {idx + 1}</span>
                {form.experience.length > 1 && (
                  <button onClick={() => removeExperience(exp.id)} className="text-sm text-red-500 hover:text-red-700">删除</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="公司 *"
                />
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="岗位 *"
                />
                <input
                  type="text"
                  value={exp.timePeriod}
                  onChange={(e) => updateExperience(exp.id, 'timePeriod', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="时间 *"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">工作内容（1-5 条）</label>
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder={`工作内容 ${bIdx + 1}`}
                      maxLength={200}
                    />
                    {exp.bullets.length > 1 && (
                      <button onClick={() => removeExperienceBullet(exp.id, bIdx)} className="text-red-500 hover:text-red-700 px-2">×</button>
                    )}
                  </div>
                ))}
                {exp.bullets.length < 5 && (
                  <button onClick={() => addExperienceBullet(exp.id)} className="text-sm text-blue-600 hover:text-blue-800">+ 添加内容</button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* 项目经历 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">项目经历（可选）</h2>
            <button onClick={addProject} className="text-sm text-blue-600 hover:text-blue-800">+ 添加</button>
          </div>
          {form.projects.map((proj, idx) => (
            <div key={proj.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">项目 {idx + 1}</span>
                <button onClick={() => removeProject(proj.id)} className="text-sm text-red-500 hover:text-red-700">删除</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="项目名称 *"
                />
                <input
                  type="text"
                  value={proj.role || ''}
                  onChange={(e) => updateProject(proj.id, 'role', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="角色"
                />
                <input
                  type="text"
                  value={proj.timePeriod || ''}
                  onChange={(e) => updateProject(proj.id, 'timePeriod', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="时间"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">项目描述（1-5 条）</label>
                {proj.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateProjectBullet(proj.id, bIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder={`项目描述 ${bIdx + 1}`}
                    />
                    {proj.bullets.length > 1 && (
                      <button onClick={() => removeProjectBullet(proj.id, bIdx)} className="text-red-500 hover:text-red-700 px-2">×</button>
                    )}
                  </div>
                ))}
                {proj.bullets.length < 5 && (
                  <button onClick={() => addProjectBullet(proj.id)} className="text-sm text-blue-600 hover:text-blue-800">+ 添加描述</button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* 技能 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">技能</h2>
          <textarea
            value={form.skills}
            onChange={(e) => updateSkills(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="请输入技能，用逗号分隔（如：JavaScript, React, Node.js）*"
          />
        </section>

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回首页
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            生成简历初稿
          </button>
        </div>
      </div>
    </div>
  );
}
