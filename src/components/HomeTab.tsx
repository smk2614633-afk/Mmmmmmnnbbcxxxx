import { useState } from 'react';
import {
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { User, SystemSettings, DepositRequest, WithdrawalRequest } from '../types';

interface HomeTabProps {
  currentUser: User;
  settings: SystemSettings;
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  onOpenDeposit: (amount?: number) => void;
  onOpenWithdrawal: () => void;
  onOpenCustomerSupport: () => void;
  onNavigateToTab: (tab: 'home' | 'payment' | 'statistics' | 'my') => void;
}

export function HomeTab({
  currentUser,
  settings,
  deposits,
  withdrawals,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenCustomerSupport: _,
  onNavigateToTab,
}: HomeTabProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Combine and sort recent transactions
  const combinedTransactions = [
    ...deposits.map((d) => ({
      id: d.id,
      type: 'Deposit',
      method: d.method,
      amount: d.amount,
      status: d.status,
      date: d.createdAt,
    })),
    ...withdrawals.map((w) => ({
      id: w.id,
      type: 'Withdrawal',
      method: w.method,
      amount: w.amount,
      status: w.status,
      date: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-orange-600 text-sm">
              {currentUser.phone.slice(-2)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-orange-200/80 shadow-xs">
                ID: {currentUser.id}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                VIP 1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              +91 {currentUser.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="w-9 h-9 rounded-full bg-white border border-orange-200 flex items-center justify-center text-slate-600 hover:text-orange-500 shadow-xs transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Available Balance Card (Orange Gradient Banner from video) */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ff6b00] via-[#ff7c00] to-[#ffa500] p-5 text-white shadow-xl shadow-orange-500/20">
          {/* Subtle Decorative Background Circles */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-black/5 pointer-events-none" />

          {/* Balance and Detail Button */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-medium text-orange-100 flex items-center gap-1">
                Available Balance
                <Info className="w-3 h-3 opacity-80" />
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold">₹</span>
                <span className="text-3xl font-black tracking-tight">
                  {currentUser.balance.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-bold transition-colors cursor-pointer border border-white/30"
            >
              Detail
            </button>
          </div>

          {/* Deposit and Withdrawal Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-2 border-t border-white/15 relative z-10">
            {/* Deposit */}
            <button
              type="button"
              id="home-deposit-btn"
              onClick={() => onOpenDeposit()}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-white leading-tight">Deposit</span>
                  <span className="text-[10px] text-orange-100">₹ {currentUser.depositTotal.toFixed(0)}</span>
                </div>
              </div>
            </button>

            {/* Withdrawal */}
            <button
              type="button"
              id="home-withdrawal-btn"
              onClick={onOpenWithdrawal}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
                  <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-white leading-tight">Withdrawal</span>
                  <span className="text-[10px] text-orange-100">₹ {currentUser.withdrawTotal.toFixed(0)}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Quick Actions Grid (USDT with 110INR badge, Task, Team, Order) */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-2.5 bg-white p-3.5 rounded-3xl border border-orange-100/70 shadow-sm shadow-orange-500/5">
          {/* Action 1: USDT */}
          <button
            type="button"
            onClick={() => onOpenDeposit(500)}
            className="flex flex-col items-center justify-center group relative cursor-pointer"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#fff2e6] group-hover:bg-[#ffe5cc] text-orange-600 flex items-center justify-center transition-colors">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-xs">
                {settings.usdtRate}INR
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1.5">USDT</span>
          </button>

          {/* Action 2: Task */}
          <button
            type="button"
            onClick={() => onNavigateToTab('payment')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fff2e6] group-hover:bg-[#ffe5cc] text-orange-600 flex items-center justify-center transition-colors">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1.5">Task</span>
          </button>

          {/* Action 3: Team */}
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fff2e6] group-hover:bg-[#ffe5cc] text-orange-600 flex items-center justify-center transition-colors">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1.5">Team</span>
          </button>

          {/* Action 4: Order */}
          <button
            type="button"
            onClick={() => setShowOrderModal(true)}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fff2e6] group-hover:bg-[#ffe5cc] text-orange-600 flex items-center justify-center transition-colors">
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1.5">Order</span>
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="px-4">
        <div className="bg-white rounded-3xl p-4 border border-orange-100/70 shadow-sm shadow-orange-500/5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>Transactions</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowOrderModal(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              See All
            </button>
          </div>

          {combinedTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              कोई लेनदेन नहीं मिला (No transactions yet)
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {combinedTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                        tx.type === 'Deposit'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <span className="text-xs font-black">
                        {tx.type === 'Deposit' ? '↓' : '↑'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {tx.type} {tx.method}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-black text-slate-800">
                      ₹ {tx.amount.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : tx.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {tx.status === 'Completed' && <CheckCircle className="w-2.5 h-2.5" />}
                      {tx.status === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                      {tx.status === 'Failed' && <XCircle className="w-2.5 h-2.5" />}
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-sm mb-3">Asset Details (परिसंपत्ति विवरण)</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Available Balance:</span>
                <span className="font-bold text-slate-800">₹ {currentUser.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Recharge (जमा):</span>
                <span className="font-bold text-emerald-600">₹ {currentUser.depositTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Withdraw (निकासी):</span>
                <span className="font-bold text-orange-600">₹ {currentUser.withdrawTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Commission Earned:</span>
                <span className="font-bold text-amber-600">₹ {currentUser.commissionTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Deposit Verified:</span>
                <span className={`font-bold ${currentUser.hasDeposited ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {currentUser.hasDeposited ? 'Yes (Verified)' : 'No (Pending Deposit)'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Team / Invite Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Team Invitation (टीम रेफरल)</h4>
            <p className="text-xs text-slate-500 mb-3">
              दोस्तों को आमंत्रित करें और हर सफल डिपॉजिट पर 3.8% तक कमीशन अर्जित करें।
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center mb-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Your Referral Code</span>
              <span className="text-base font-black text-orange-600 tracking-widest">{currentUser.id}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`Join ShaktiPay using my code: ${currentUser.id}`);
                alert('Referral link copied to clipboard!');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-sm mb-2"
            >
              Copy Referral Link
            </button>
            <button
              type="button"
              onClick={() => setShowTeamModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">Payment History (ऑर्डर विवरण)</h4>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 my-2">
              {combinedTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No records found</div>
              ) : (
                combinedTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {tx.type} • {tx.method}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-800">₹ {tx.amount.toFixed(2)}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : tx.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
