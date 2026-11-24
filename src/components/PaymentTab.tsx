import { useState } from 'react';
import { AlertTriangle, Sparkles, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { User, SystemSettings } from '../types';
import { api } from '../lib/api';

interface PaymentTabProps {
  currentUser: User;
  settings: SystemSettings;
  onOpenPaymentGateway: (amount: number, origin?: 'deposit' | 'claim') => void;
  onUserBalanceUpdate: (user: User) => void;
}

interface TaskItem {
  id: string;
  code: string;
  amount: number;
  income: number;
  category: string;
}

export function PaymentTab({
  currentUser,
  settings,
  onOpenPaymentGateway,
  onUserBalanceUpdate,
}: PaymentTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('Top Picks');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const filterTabs = ['Top Picks', '100-199', '200-299', '300-399', '400-499', '500-600'];

  // Generate task list matching video
  const tasks: TaskItem[] = [
    // Top Picks
    { id: 'tp-1', code: '7P9tZw', amount: 7966, income: 302.71, category: 'Top Picks' },
    { id: 'tp-2', code: 'hRM8FO', amount: 7500, income: 285.0, category: 'Top Picks' },
    { id: 'tp-3', code: 'BTrewQ', amount: 7700, income: 292.6, category: 'Top Picks' },
    { id: 'tp-4', code: 'UAYITD', amount: 6093, income: 231.53, category: 'Top Picks' },

    // 100-199
    { id: 't-101', code: 'CPSmq3', amount: 100, income: Number(((100 * settings.cashbackRate) / 100).toFixed(2)), category: '100-199' },
    { id: 't-102', code: 'fEzG9t', amount: 150, income: Number(((150 * settings.cashbackRate) / 100).toFixed(2)), category: '100-199' },
    { id: 't-103', code: 'EQFirk', amount: 190, income: Number(((190 * settings.cashbackRate) / 100).toFixed(2)), category: '100-199' },
    { id: 't-104', code: 'EUlhSb', amount: 100, income: Number(((100 * settings.cashbackRate) / 100).toFixed(2)), category: '100-199' },
    { id: 't-105', code: 'hyR23R', amount: 100, income: Number(((100 * settings.cashbackRate) / 100).toFixed(2)), category: '100-199' },

    // 200-299
    { id: 't-201', code: 'J5Dh8w', amount: 200, income: Number(((200 * settings.cashbackRate) / 100).toFixed(2)), category: '200-299' },
    { id: 't-202', code: '8mPr7p', amount: 200, income: Number(((200 * settings.cashbackRate) / 100).toFixed(2)), category: '200-299' },
    { id: 't-203', code: '2uN7xu', amount: 200, income: Number(((200 * settings.cashbackRate) / 100).toFixed(2)), category: '200-299' },
    { id: 't-204', code: 'lwRZIK', amount: 200, income: Number(((200 * settings.cashbackRate) / 100).toFixed(2)), category: '200-299' },

    // 300-399
    { id: 't-301', code: 'GfaNRc', amount: 300, income: Number(((300 * settings.cashbackRate) / 100).toFixed(2)), category: '300-399' },
    { id: 't-302', code: '3XPyNC', amount: 300, income: Number(((300 * settings.cashbackRate) / 100).toFixed(2)), category: '300-399' },
    { id: 't-303', code: '6F4pjT', amount: 310, income: Number(((310 * settings.cashbackRate) / 100).toFixed(2)), category: '300-399' },
    { id: 't-304', code: 'RsAsYS', amount: 300, income: Number(((300 * settings.cashbackRate) / 100).toFixed(2)), category: '300-399' },

    // 400-499
    { id: 't-401', code: 'CU874w', amount: 400, income: Number(((400 * settings.cashbackRate) / 100).toFixed(2)), category: '400-499' },
    { id: 't-402', code: 'SyN7rS', amount: 450, income: Number(((450 * settings.cashbackRate) / 100).toFixed(2)), category: '400-499' },

    // 500-600
    { id: 't-501', code: '9yGAD2', amount: 500, income: Number(((500 * settings.cashbackRate) / 100).toFixed(2)), category: '500-600' },
    { id: 't-502', code: 'OKLUga', amount: 600, income: Number(((600 * settings.cashbackRate) / 100).toFixed(2)), category: '500-600' },
  ];

  const filteredTasks = tasks.filter((t) => t.category === selectedFilter);

  // USER PROMPT REQUIREMENT:
  // "बिना डिपॉजिट का इनाम दावा नहीं होना चाहिए"
  // "यह गेटवे डिपॉजिट के जगह पर ऐड करना है और claim के जगह पर भी ऐड करना है"
  // "जितना बार यूजर claim par क्लिक करेगा उतना बार पेमेंट गेटवे का इस्तेमाल करना शो होना चाहिए"
  const handleClaimClick = async (task: TaskItem) => {
    setClaimError(null);
    setClaimSuccess(null);
    setClaimingId(task.id);

    // Rule 1: User without deposit cannot claim
    if (!currentUser.hasDeposited && currentUser.depositTotal <= 0) {
      setClaimError(
        `बिना डिपॉजिट का इनाम दावा नहीं हो सकता! क्लेम करने के लिए कृपया पहले ₹${task.amount <= 600 ? task.amount : 100} का पेमेंट / रिचार्ज पूरा करें।`
      );
      setClaimingId(null);

      // Directly trigger payment gateway for this amount
      const targetAmount = [100, 200, 300, 400, 500, 600].includes(task.amount) ? task.amount : 100;
      setTimeout(() => {
        onOpenPaymentGateway(targetAmount, 'claim');
      }, 1000);
      return;
    }

    // Rule 2: "जितना बार यूजर claim par क्लिक करेगा उतना बार पेमेंट गेटवे का इस्तेमाल करना शो होना चाहिए"
    // Prompt the user to verify/use the payment gateway for this task
    const targetAmount = [100, 200, 300, 400, 500, 600].includes(task.amount) ? task.amount : 100;
    onOpenPaymentGateway(targetAmount, 'claim');

    // Also attempt claim call if already deposited
    try {
      const res = await api.claimTask(currentUser.id, task.code, task.income);
      if (res.success) {
        setClaimSuccess(`Task ${task.code} claimed! +₹${task.income} added.`);
        if (res.user) {
          onUserBalanceUpdate(res.user);
        }
      } else {
        setClaimError(res.message);
      }
    } catch (err: any) {
      setClaimError(err.message || 'त्रुटि हुई');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner (from video 00:10) */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ff6b00] via-[#ff7c00] to-[#ffa500] p-5 text-white shadow-xl shadow-orange-500/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight block">Payment</span>
              <div className="mt-1">
                <span className="text-xs text-orange-100 font-medium">Cashback</span>
                <span className="text-3xl font-black block tracking-tight">
                  {settings.cashbackRate}%
                </span>
              </div>
            </div>

            {/* Mini Visual Chart Columns matching video */}
            <div className="flex items-end gap-1.5 h-16 pt-2">
              <div className="w-2.5 h-6 bg-white/40 rounded-t-sm" />
              <div className="w-2.5 h-9 bg-white/60 rounded-t-sm" />
              <div className="w-2.5 h-14 bg-white/90 rounded-t-sm shadow-xs" />
              <div className="w-2.5 h-11 bg-white/70 rounded-t-sm" />
              <div className="w-2.5 h-7 bg-white/50 rounded-t-sm" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <span className="block text-[10px] text-orange-100 uppercase tracking-wider font-semibold">Balance</span>
              <span className="text-xs font-bold text-white">₹ {currentUser.balance.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <span className="block text-[10px] text-orange-100 uppercase tracking-wider font-semibold">Reward</span>
              <span className="text-xs font-bold text-white">₹ {currentUser.commissionTotal.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
              <span className="block text-[10px] text-orange-100 uppercase tracking-wider font-semibold">Pending</span>
              <span className="text-xs font-bold text-white">₹ 0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Notice from Video */}
      <div className="px-4">
        <div className="bg-[#fff8f0] border border-orange-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Please use Freecharge or Mobikwik or Paytm or MoneyView wallet for payment!
          </p>
        </div>
      </div>

      {/* Claim Alerts */}
      {claimError && (
        <div className="px-4">
          <div className="bg-red-50 border border-red-200 p-3 rounded-2xl text-xs text-red-700 flex items-start gap-2 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{claimError}</p>
              <button
                type="button"
                onClick={() => onOpenPaymentGateway(100, 'claim')}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-red-800 underline"
              >
                Go to Payment Gateway <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {claimSuccess && (
        <div className="px-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{claimSuccess}</span>
          </div>
        </div>
      )}

      {/* Horizontal Filter Tabs */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-slate-600 border border-orange-100 hover:border-orange-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 space-y-2.5">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-3xl p-4 border border-orange-100/80 shadow-sm flex items-center justify-between transition-all hover:border-orange-300"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">INR</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xs font-medium text-slate-500">Amount:</span>
                <span className="text-base font-black text-slate-800">
                  ₹ {task.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-medium text-slate-500">Income:</span>
                <span className="text-xs font-bold text-orange-600">+{task.income}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">
                Code <span className="font-bold text-slate-700">{task.code}</span>
              </span>

              <button
                type="button"
                onClick={() => handleClaimClick(task)}
                disabled={claimingId === task.id}
                className="py-1.5 px-5 rounded-full border-2 border-orange-500 text-orange-600 font-black text-xs hover:bg-orange-500 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {claimingId === task.id ? 'Claiming...' : 'Claim'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
