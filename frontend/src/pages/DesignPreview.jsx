import React from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, RefreshCcw, Bell, Eye, EyeOff, Wallet, History, User } from 'lucide-react';

// Design Preview Component - Shows proposed dashboard design
export default function DesignPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white p-6 relative overflow-hidden">
      {/* Animated background glows */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-[#5C6B3E]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5C6B3E]/5 rounded-full blur-[150px]" />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1">Good evening</p>
            <h1 className="text-2xl font-semibold text-white">Welcome back, John</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/[0.06] transition-all">
              <Bell className="w-5 h-5 text-neutral-400" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C6B3E] to-[#7A8C54] flex items-center justify-center text-sm font-bold">
              JD
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Hero Balance Card - 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#5C6B3E]/30 rounded-full blur-[80px] group-hover:bg-[#5C6B3E]/40 transition-all" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Total Balance</p>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Eye className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              <p className="text-5xl font-semibold tracking-tight mb-2" style={{ textShadow: '0 0 40px rgba(92,107,62,0.4)' }}>
                $12,450.00
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +2.4%
                </span>
                <span className="text-neutral-500 text-sm">vs last month</span>
              </div>
            </div>
          </div>

          {/* Quick Actions - 4 cols */}
          <div className="col-span-12 lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Quick Actions</p>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-medium text-emerald-400">Deposit</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-purple-400">Withdraw</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-blue-400" />
                </div>
                <span className="font-medium text-blue-400">Swap</span>
              </button>
            </div>
          </div>

          {/* Currency Wallets - Full width */}
          <div className="col-span-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">My Wallets</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* USD */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-lg">
                    🇺🇸
                  </div>
                  <div>
                    <p className="font-semibold">USD</p>
                    <p className="text-xs text-neutral-500">US Dollar</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold mb-1">$5,000.00</p>
                <p className="text-xs text-emerald-400">+$120.00 today</p>
              </div>

              {/* USDC */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg viewBox="0 0 32 32" className="w-6 h-6">
                      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
                      <path d="M20.5 18.5c0-2.1-1.3-2.8-3.8-3.1-1.8-.2-2.2-.7-2.2-1.4 0-.8.6-1.3 1.8-1.3 1.1 0 1.7.4 2 1.2.1.2.2.3.4.3h1c.2 0 .4-.2.3-.4-.3-1.3-1.2-2.3-2.7-2.5v-1.5c0-.2-.2-.4-.4-.4h-.9c-.2 0-.4.2-.4.4v1.4c-1.8.3-3 1.4-3 3 0 2 1.3 2.7 3.8 3 1.7.3 2.2.7 2.2 1.5s-.8 1.4-1.9 1.4c-1.5 0-2-.6-2.2-1.4-.1-.2-.2-.3-.4-.3h-1c-.2 0-.4.2-.3.4.3 1.5 1.4 2.4 3 2.7v1.5c0 .2.2.4.4.4h.9c.2 0 .4-.2.4-.4v-1.5c1.9-.3 3.1-1.5 3.1-3.1z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">USDC</p>
                    <p className="text-xs text-neutral-500">USD Coin</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold mb-1">$2,000.00</p>
                <p className="text-xs text-neutral-500">No change</p>
              </div>

              {/* USDT */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <svg viewBox="0 0 32 32" className="w-6 h-6">
                      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                      <path d="M17.9 17.9v-.1c-.1 0-.8-.1-2-.1-1 0-1.7 0-1.9.1v.1c-3.4.2-6 .8-6 1.6 0 .9 2.9 1.6 6.6 1.6s6.6-.7 6.6-1.6c-.1-.8-2.7-1.4-6.1-1.6h2.8zm0-2v-.1h4.8v-3h-13v3h4.8v.1c-3.9.2-6.8 1-6.8 2 0 1.1 3.3 2 7.4 2s7.4-.9 7.4-2c0-1-2.9-1.8-6.8-2h2.2z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">USDT</p>
                    <p className="text-xs text-neutral-500">Tether</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold mb-1">$1,000.00</p>
                <p className="text-xs text-emerald-400">+$50.00 today</p>
              </div>

              {/* NGN */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-lg">
                    🇳🇬
                  </div>
                  <div>
                    <p className="font-semibold">NGN</p>
                    <p className="text-xs text-neutral-500">Nigerian Naira</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold mb-1">₦4,500,000</p>
                <p className="text-xs text-red-400">-₦50,000 today</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-12 lg:col-span-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Recent Transactions</p>
              <button className="text-xs text-[#7A8C54] hover:text-[#5C6B3E] font-medium">View All</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">Received from John</p>
                    <p className="text-xs text-neutral-500">Today, 2:30 PM</p>
                  </div>
                </div>
                <p className="font-semibold text-emerald-400">+$500.00</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Sent to GTBank</p>
                    <p className="text-xs text-neutral-500">Yesterday, 11:20 AM</p>
                  </div>
                </div>
                <p className="font-semibold text-red-400">-₦100,000</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Swapped USD → NGN</p>
                    <p className="text-xs text-neutral-500">Mar 24, 9:15 AM</p>
                  </div>
                </div>
                <p className="font-semibold text-white">$200 → ₦310,000</p>
              </div>
            </div>
          </div>

          {/* Quick Converter */}
          <div className="col-span-12 lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Quick Convert</p>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-neutral-500 mb-2">From</p>
                <div className="flex items-center justify-between">
                  <input 
                    type="text" 
                    value="100" 
                    className="bg-transparent text-2xl font-semibold w-20 outline-none"
                    readOnly
                  />
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <span>🇺🇸</span>
                    <span className="font-medium">USD</span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button className="w-10 h-10 rounded-full bg-[#5C6B3E] flex items-center justify-center shadow-lg shadow-[#5C6B3E]/30">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-neutral-500 mb-2">To</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-[#7A8C54]">155,000</p>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <span>🇳🇬</span>
                    <span className="font-medium">NGN</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-neutral-500 text-center">1 USD = 1,550 NGN</p>
              
              <button className="w-full py-3 rounded-xl bg-[#5C6B3E] hover:bg-[#7A8C54] font-medium transition-all shadow-lg shadow-[#5C6B3E]/30">
                Convert Now
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Nav Preview */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-8">
          <button className="flex flex-col items-center gap-1 text-[#7A8C54]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors">
            <Wallet className="w-6 h-6" />
            <span className="text-xs">Wallet</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors">
            <RefreshCcw className="w-6 h-6" />
            <span className="text-xs">Convert</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors">
            <History className="w-6 h-6" />
            <span className="text-xs">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
