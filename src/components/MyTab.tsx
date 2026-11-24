import { useState } from 'react';
import {
  Wallet,
  Coins,
  Headphones,
  Mail,
  KeyRound,
  BookOpen,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { User, SystemSettings } from '../types';

interface MyTabProps {
  currentUser: User;
  settings: SystemSettings;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onOpenAdminPrompt: () => void;
}

export function MyTab({
  currentUser,
  settings,
  onLogout,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenAdminPrompt,
}: MyTabProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [versionClicks, setVersionClicks] = useState(0);

  // USER PROMPT REQUIREMENT:
  // "ग्राहक सेवा पर क्लिक करते ही ये लिंक ओपन होना चाहिए https://t.me/+wd6As_DpBWxmNmU1"
  const handleCustomerServiceClick = () => {
    const targetUrl = settings.telegramSupport || 'https://t.me/+wd6As_DpBWxmNmU1';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleVersionClick = () => {
    const next = versionClicks + 1;
    setVersionClicks(next);
    if (next >= 3) {
      setVersionClicks(0);
      onOpenAdminPrompt();
    }
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-24 font-sans">
      <div className="text-center py-1">
        <h2 className="text-base font-bold text-slate-800">My Asset (मेरी संपत्ति)</h2>
      </div>

      {/* Top 3 Stats Card matching Video 00:32 */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm shadow-orange-500/5">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
          {/* Deposit */}
          <div className="cursor-pointer hover:opacity-80" onClick={() => onOpenDeposit()}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Deposit</span>
            </div>
            <span className="text-base font-black text-slate-800 block">
              ₹ {currentUser.depositTotal.toFixed(0)}
            </span>
          </div>

          {/* Withdraw */}
          <div className="cursor-pointer hover:opacity-80" onClick={onOpenWithdrawal}>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" />
              <span>Withdraw</span>
            </div>
            <span className="text-base font-black text-slate-800 block">
              ₹ {currentUser.withdrawTotal.toFixed(0)}
            </span>
          </div>

          {/* Commission */}
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-1">
              <Percent className="w-3.5 h-3.5 text-orange-500" />
              <span>Commission</span>
            </div>
            <span className="text-base font-black text-orange-600 block">
              ₹ {currentUser.commissionTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 6 Grid Icons: Wallet, Integral, Service, Message, Pin, Tutorial */}
      <div className="bg-white rounded-3xl p-4 border border-orange-100 shadow-sm shadow-orange-500/5">
        <div className="grid grid-cols-3 gap-y-5 gap-x-3 text-center">
          {/* 1: Wallet */}
          <button
            type="button"
            onClick={() => setActiveModal('wallet')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <Wallet className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Wallet</span>
          </button>

          {/* 2: Integral */}
          <button
            type="button"
            onClick={() => setActiveModal('integral')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <Coins className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Integral</span>
          </button>

          {/* 3: Service (Customer support link) */}
          <button
            type="button"
            id="btn-customer-service"
            onClick={handleCustomerServiceClick}
            className="flex flex-col items-center justify-center group cursor-pointer relative"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <Headphones className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Service</span>
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {/* 4: Message */}
          <button
            type="button"
            onClick={() => setActiveModal('message')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <Mail className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Message</span>
          </button>

          {/* 5: Pin */}
          <button
            type="button"
            onClick={() => setActiveModal('pin')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <KeyRound className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Pin</span>
          </button>

          {/* 6: Tutorial */}
          <button
            type="button"
            onClick={() => setActiveModal('tutorial')}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf8f3] group-hover:bg-[#faebd7] text-orange-600 flex items-center justify-center transition-colors border border-orange-100/60 shadow-xs">
              <BookOpen className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Tutorial</span>
          </button>
        </div>
      </div>

      {/* Logout Button matching video */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout (लॉग आउट)</span>
        </button>
      </div>

      {/* Version Tag (Click 3 times for Admin Portal) */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleVersionClick}
          className="text-xs text-slate-400 hover:text-slate-600 font-mono tracking-wider cursor-pointer"
        >
          v1.4.1
        </button>
      </div>

      {/* Sub-modals for Wallet, Integral, Message, Tutorial, Pin */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-sm mb-3 capitalize">{activeModal} Information</h4>

            {activeModal === 'wallet' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p><strong>Associated Mobile:</strong> +91 {currentUser.phone}</p>
                <p><strong>Member ID:</strong> {currentUser.id}</p>
                <p><strong>Default Gateway:</strong> {settings.upiId}</p>
                <p><strong>USDT TRC20:</strong> {settings.usdtAddress.slice(0, 16)}...</p>
              </div>
            )}

            {activeModal === 'integral' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p>Integral points are earned through daily activity and successful task completions.</p>
                <p>Current Integrals: <strong>{(currentUser.balance * 10).toFixed(0)} Points</strong></p>
              </div>
            )}

            {activeModal === 'message' && (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="font-bold text-orange-800">Welcome to ShaktiPay!</p>
                  <p className="text-[11px] text-orange-700 mt-0.5">
                    Your signup bonus of ₹{settings.signupBonus} has been credited. Complete your first deposit to start claiming income.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'pin' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p>Security PIN is used for approving sensitive account operations.</p>
                <p className="text-[11px] text-slate-500">Contact admin or customer care if you wish to reset your account password.</p>
              </div>
            )}

            {activeModal === 'tutorial' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p><strong>1. Deposit:</strong> Go to Deposit tab, scan the UPI QR code or transfer USDT, upload screenshot & UTR.</p>
                <p><strong>2. Claim Income:</strong> Once deposit is verified, click Claim on tasks to get instant cash rewards.</p>
                <p><strong>3. Withdraw:</strong> Withdraw your earnings directly into your UPI or Bank account.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
