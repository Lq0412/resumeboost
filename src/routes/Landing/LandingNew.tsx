import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Target, Zap, Lock, Download, ArrowRight, CheckCircle, Star } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/30 to-white">
      {/* 微妙的背景纹理 */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* 顶部导航栏 - 简洁固定 */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-[12px] bg-slate-900 flex items-center justify-center shadow-[0_2px_8px_rgb(0,0,0,0.1)] transition-all duration-300 group-hover:shadow-[0_4px_12px_rgb(0,0,0,0.15)]">
                <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">ResumeBoost</span>
            </div>
            
            {/* 导航按钮 */}
            <div className="flex items-center gap-5">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                GitHub
              </a>
              <button 
                onClick={() => navigate('/builder')}
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-[12px] hover:bg-slate-800 shadow-[0_2px_8px_rgb(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.15)] transition-all duration-300 cursor-pointer"
              >
                开始使用
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <main className="pt-16 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* 状态标签 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200/80 rounded-full shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
              <span className="text-sm font-medium text-slate-700 tracking-tight">免费开源 · AI 驱动 · 隐私优先</span>
            </div>
          </div>

          {/* 主标题 - 增强排版 */}
          <h1 className="text-[4rem] md:text-[5.5rem] lg:text-[6.5rem] font-black text-center mb-6 leading-[0.95] tracking-[-0.02em] text-slate-900">
            打造完美简历
            <br />
            <span className="text-slate-400">赢得理想工作</span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg md:text-xl text-center text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-light tracking-tight">
            AI 智能优化 · 实时预览 · 一键导出
            <br />
            让你的简历在众多候选人中脱颖而出
          </p>

          {/* CTA 按钮组 - 增强质感 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={() => navigate('/builder')}
              className="group px-9 py-4 bg-slate-900 text-white text-lg font-bold rounded-[16px] hover:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] transition-all duration-300 flex items-center gap-3 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" strokeWidth={2.5} />
              创建新简历
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-9 py-4 bg-white text-slate-900 text-lg font-semibold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 shadow-[0_4px_14px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
            >
              优化现有简历
            </button>
          </div>

          {/* 特性卡片 - 增强质感 */}
          <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto mb-20">
            {[
              { 
                icon: Target, 
                title: 'ATS 友好', 
                desc: '通过率提升 80%'
              },
              { 
                icon: Zap, 
                title: '实时预览', 
                desc: '所见即所得编辑'
              },
              { 
                icon: Lock, 
                title: '隐私优先', 
                desc: '数据本地处理'
              },
              { 
                icon: Download, 
                title: '一键导出', 
                desc: '专业 PDF 格式'
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.title}
                  className="group p-7 bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-[14px] bg-slate-900 flex items-center justify-center mb-5 shadow-[0_4px_14px_rgb(0,0,0,0.1)] group-hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] group-hover:scale-[1.02] transition-all duration-300">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 社会证明 - 增强质感 */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-slate-900 text-slate-900" strokeWidth={0} />
                  ))}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">为什么选择 ResumeBoost？</h2>
                <p className="text-slate-500 text-lg">专业 HR 推荐的简历工具</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: 'AI 智能分析', value: '精准匹配岗位' },
                  { label: '专业模板', value: '符合行业标准' },
                  { label: '实时优化', value: '即时反馈建议' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 mb-1 tracking-tight">{item.label}</div>
                      <div className="text-sm text-slate-500 leading-relaxed">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="py-10 px-6 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 tracking-tight">
            Made with <span className="text-slate-900">♥</span> for job seekers
          </p>
        </div>
      </footer>
    </div>
  );
}
