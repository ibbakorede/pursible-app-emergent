import { Shield, Zap, Sparkles } from 'lucide-react';

export function LoginBackground() {
  return (
    <>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: 'rgba(122,140,84,0.1)', animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </>
  );
}

export function LoginBranding() {
  return (
    <>
      {/* Logo Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-5 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-2xl p-3">
            <img src="/pursible_icon_white.svg" alt="Pursible" className="w-full h-full drop-shadow-2xl" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Pursible</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          Send, Receive, Convert & Withdraw — Instantly
        </p>
      </div>

      {/* Feature badges */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
          <Shield className="w-3.5 h-3.5 text-[#97C459]" />
          <span className="text-xs text-gray-300">Secure</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-gray-300">Instant</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-gray-300">Simple</span>
        </div>
      </div>
    </>
  );
}
