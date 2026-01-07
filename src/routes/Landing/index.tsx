import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white overflow-hidden relative">
      {/* 动态背景 - 更柔和的色调 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-teal-600/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-slate-600/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* 网格背景 */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* 主内容 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 导航栏 */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg text-gray-100">ResumeBoost</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
              GitHub
            </a>
          </div>
        </nav>

        {/* Hero 区域 */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* 标签 */}
          <div className="mb-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <span className="text-sm text-gray-400">免费开源 · AI 驱动 · 隐私优先</span>
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6 leading-tight tracking-tight">
            <span className="text-gray-100">
              让简历更具
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              竞争力
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-gray-500 text-lg md:text-xl text-center max-w-2xl mb-12 leading-relaxed">
            智能分析简历，提供专业优化建议，帮助你在求职中脱颖而出
          </p>

          {/* 操作卡片 */}
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl w-full mb-16">
            {/* 上传简历卡片 */}
            <button
              onClick={() => navigate('/app')}
              className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 text-left"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/[0.06] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="text-xl">📄</span>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-200 group-hover:text-white transition-colors">
                  我有简历
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  上传 PDF 或粘贴文本，智能诊断并提供优化方案
                </p>
                <div className="mt-4 flex items-center gap-2 text-teal-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>开始优化</span>
                  <span>→</span>
                </div>
              </div>
            </button>

            {/* 创建简历卡片 */}
            <button
              onClick={() => navigate('/builder')}
              className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-teal-500/30 transition-all duration-300 text-left"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-teal-500/10">
                  <span className="text-xl">✨</span>
                </div>
                <h2 className="text-lg font-semibold mb-2 text-gray-200 group-hover:text-white transition-colors">
                  创建新简历
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  可视化编辑器，AI 辅助撰写，快速生成专业简历
                </p>
                <div className="mt-4 flex items-center gap-2 text-teal-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>开始创建</span>
                  <span>→</span>
                </div>
              </div>
            </button>
          </div>

          {/* 特性展示 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full">
            {[
              { icon: '🎯', label: 'ATS 友好', desc: '通过率更高' },
              { icon: '⚡', label: '实时预览', desc: '所见即所得' },
              { icon: '🔒', label: '隐私优先', desc: '数据不上传' },
              { icon: '🎨', label: '专业排版', desc: '一键导出' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] text-center hover:bg-white/[0.025] transition-colors">
                <div className="text-xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-gray-300 mb-0.5">{item.label}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </main>

        {/* 底部 */}
        <footer className="px-6 py-6 text-center">
          <p className="text-gray-600 text-sm">
            Made with ❤️ for job seekers
          </p>
        </footer>
      </div>
    </div>
  );
}
