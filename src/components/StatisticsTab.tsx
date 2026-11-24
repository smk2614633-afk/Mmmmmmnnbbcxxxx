import { useState } from 'react';
import { User, SystemSettings } from '../types';
import { TrendingUp, Wallet, ShieldCheck, Repeat, Clock } from 'lucide-react';

interface StatisticsTabProps {
  currentUser: User;
  settings: SystemSettings;
}

export function StatisticsTab({ currentUser, settings }: StatisticsTabProps) {
  const [isTrading, setIsTrading] = useState(false);
  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div className="space-y-4 px-4 pt-3 pb-20">
      <div className="text-center py-1">
        <h2 className="text-base font-bold text-slate-800">Statistics (आंकड़े)</h2>
      </div>

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm shadow-orange-500/5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Statistics ({today})
          </span>
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            Live
          </span>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#fcf8f3] p-3 rounded-2xl border border-orange-100/60">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
              <span>Balance</span>
            </div>
            <span className="text-base font-black text-slate-800">
              ₹ {currentUser.balance.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#fcf8f3] p-3 rounded-2xl border border-orange-100/60">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Repeat className="w-3.5 h-3.5 text-amber-500" />
              <span>Sell / Turnover</span>
            </div>
            <span className="text-base font-black text-slate-800">₹ 0.00</span>
          </div>

          <div className="bg-[#fcf8f3] p-3 rounded-2xl border border-orange-100/60">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Deposit</span>
            </div>
            <span className="text-base font-black text-slate-800">
              ₹ {currentUser.depositTotal.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#fcf8f3] p-3 rounded-2xl border border-orange-100/60">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              <span>Commission</span>
            </div>
            <span className="text-base font-black text-slate-800">
              ₹ {currentUser.commissionTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment & Exchange Rates Card */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm shadow-orange-500/5 space-y-4">
        <h3 className="text-xs font-bold text-slate-700">Payment & Settlement (भुगतान)</h3>

        {/* Real Time Exchange Rates Header Banner matching video */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Real Time Exchange Rates (INR/USDT)
          </span>
          <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs rounded-full shadow-xs">
            {settings.usdtRate}
          </span>
        </div>

        {/* In Process Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">In Process Amount</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">₹ 0.00</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">In Process Orders</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">0</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Commission Rate</span>
            <span className="text-sm font-bold text-orange-600 mt-0.5 block">{settings.cashbackRate} %</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Estimated Income</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">₹ 0.00</span>
          </div>
        </div>

        {/* Closed Selling button from video */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsTrading(!isTrading)}
            className={`w-full py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer ${
              isTrading
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'bg-amber-100/80 text-amber-900 border border-amber-300/80 hover:bg-amber-200'
            }`}
          >
            {isTrading ? 'Trading Active (ऑर्डर चालू)' : 'Closed Selling (ऑर्डर बंद)'}
          </button>
        </div>
      </div>
    </div>
  );
}
