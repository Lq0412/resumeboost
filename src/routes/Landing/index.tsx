import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          ResumeBoost
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          免费简历优化工具，让你的简历更具竞争力
        </p>
        <p className="text-sm text-gray-500">
          ATS 友好 · AI 驱动 · 隐私优先
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full mb-12">
        <button
          onClick={() => navigate('/app')}
          className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
        >
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">我有简历</h2>
          <p className="text-gray-600 text-sm">
            上传 PDF 或粘贴文本，获取诊断建议和优化方案
          </p>
        </button>

        <button
          onClick={() => navigate('/builder')}
          className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
        >
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">我没有简历</h2>
          <p className="text-gray-600 text-sm">
            填写简单表单，快速生成专业简历初稿
          </p>
        </button>
      </div>

      <div className="max-w-2xl w-full bg-white/60 rounded-lg p-6 text-sm text-gray-600">
        <h3 className="font-semibold text-gray-800 mb-3">隐私声明</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>默认脱敏：您的手机号、邮箱等敏感信息会自动脱敏处理</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>AI 仅供参考：所有建议仅供参考，请根据实际情况调整</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>不在服务端保存简历内容：数据仅存储在您的浏览器会话中</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
