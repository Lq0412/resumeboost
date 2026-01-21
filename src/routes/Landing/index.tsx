import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Target, Zap, Lock, Palette, Github, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Hero 背景图片 + 半透明遮罩 */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop')`,
          }}
        />
        {/* 半透明遮罩 */}
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
      </div>

      {/* 网格背景 */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* 主内容 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 导航栏 - 磨玻璃半透明效果 */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/30 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-100">ResumeBoost</span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Hero 区域 */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 mt-16">
          {/* 标签 */}
          <div className="mb-8 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-sm">
            <span className="text-sm text-gray-300">免费开源 · AI 驱动 · 隐私优先</span>
          </div>

          {/* 标题 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-6 leading-tight tracking-tight">
            <span className="text-white">
              让简历更具
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              竞争力
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-16 leading-relaxed">
            智能分析简历，提供专业优化建议，帮助你在求职中脱颖而出
          </p>

          {/* 操作卡片 */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full mb-20">
            {/* 上传简历卡片 */}
            <button
              onClick={() => navigate('/app')}
              className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 text-left backdrop-blur-sm"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7 text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-100 group-hover:text-white transition-colors">
                  我有简历
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-4">
                  上传 PDF 或粘贴文本，智能诊断并提供优化方案
                </p>
                <div className="flex items-center gap-2 text-orange-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>开始优化</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* 创建简历卡片 */}
            <button
              onClick={() => navigate('/builder')}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-rose-600/10 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 text-left backdrop-blur-sm"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 border border-orange-400/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-100 group-hover:text-white transition-colors">
                  创建新简历
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-4">
                  可视化编辑器，AI 辅助撰写，快速生成专业简历
                </p>
                <div className="flex items-center gap-2 text-orange-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>开始创建</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>

          {/* 特性展示 - 卡片式布局 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
            {[
              { icon: Target, label: 'ATS 友好', desc: '通过率更高' },
              { icon: Zap, label: '实时预览', desc: '所见即所得' },
              { icon: Lock, label: '隐私优先', desc: '数据不上传' },
              { icon: Palette, label: '专业排版', desc: '一键导出' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.label} 
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-center hover:bg-white/[0.04] hover:border-white/20 transition-all backdrop-blur-sm"
                >
                  <div className="flex justify-center mb-3">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-200 mb-1">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </main>

        {/* 底部 */}
        <footer className="px-6 py-8 text-center backdrop-blur-sm">
          <p className="text-gray-500 text-sm">
            Made with passion for job seekers
          </p>
        </footer>
      </div>
    </div>
  );
}
