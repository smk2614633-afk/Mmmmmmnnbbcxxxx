import { useState, useEffect } from 'react';
import {
  Home,
  CreditCard,
  BarChart2,
  User as UserIcon,
  Headphones,
  Lock,
  X,
  AlertCircle
} from 'lucide-react';
import { User, SystemSettings, DepositRequest, WithdrawalRequest } from './types';
import { api } from './lib/api';
import { AuthModal } from './components/AuthModal';
import { HomeTab } from './components/HomeTab';
import { PaymentTab } from './components/PaymentTab';
import { StatisticsTab } from './components/StatisticsTab';
import { MyTab } from './components/MyTab';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { WithdrawalModal } from './components/WithdrawalModal';
import { AdminPanel } from './components/AdminPanel';
import { ShaktiPayLogo } from './components/ShaktiPayLogo';

export default function App() {
  // Current user state (persisted in localStorage for convenience)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shaktipay_user');
    return saved ? JSON.parse(saved) : null;
  });

  // System settings state
  const [settings, setSettings] = useState<SystemSettings>({
    upiId: '7667340425@fam',
    usdtAddress: 'TLhKhgh8RFSdxPHuFowWuoWtrqjbzGkzsB',
    usdtNetwork: 'TRC20',
    usdtRate: 110,
    cashbackRate: 3.8,
    signupBonus: 28.97,
    telegramSupport: 'https://t.me/+wd6As_DpBWxmNmU1',
    adminPin: '954675',
    withdrawalOptions: [100, 1000, 2000, 5000],
  });

  // User transaction lists
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'payment' | 'statistics' | 'my'>('home');

  // Modals state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositOrigin, setDepositOrigin] = useState<'deposit' | 'claim'>('deposit');
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  // Admin Portal State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState(false);
  const [adminPinError, setAdminPinError] = useState('');

  // Discreet logo click counter for admin access
  const [logoClicks, setLogoClicks] = useState(0);

  // Fetch initial settings
  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        if (s) setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  // Fetch user data & transactions whenever user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      refreshUserData();
    }
  }, [currentUser?.id]);

  const refreshUserData = async () => {
    if (!currentUser?.id) return;
    try {
      const [uRes, dRes, wRes] = await Promise.all([
        api.getUser(currentUser.id),
        api.getDeposits(currentUser.id),
        api.getWithdrawals(currentUser.id),
      ]);

      if (uRes.success && uRes.user) {
        setCurrentUser(uRes.user);
        localStorage.setItem('shaktipay_user', JSON.stringify(uRes.user));
      }
      if (dRes.success) setDeposits(dRes.deposits);
      if (wRes.success) setWithdrawals(wRes.withdrawals);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('shaktipay_user', JSON.stringify(user));
    refreshUserData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shaktipay_user');
    setActiveTab('home');
  };

  // Admin PIN verification
  const handleVerifyAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError('');
    if (adminPinInput.trim() === '954675') {
      setIsAdminLoggedIn(true);
      setIsAdminPromptOpen(false);
      setAdminPinInput('');
    } else {
      try {
        const res = await api.adminLogin(adminPinInput.trim());
        if (res.success) {
          setIsAdminLoggedIn(true);
          setIsAdminPromptOpen(false);
          setAdminPinInput('');
        } else {
          setAdminPinError('Invalid Admin PIN (गलत पिन)');
        }
      } catch {
        setAdminPinError('Verification error');
      }
    }
  };

  const handleLogoSecretClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 4) {
      setLogoClicks(0);
      setIsAdminPromptOpen(true);
    }
  };

  // Open Telegram Customer Service Link directly
  const handleOpenCustomerService = () => {
    const url = settings.telegramSupport || 'https://t.me/+wd6As_DpBWxmNmU1';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If Admin is logged in, show the complete Admin Dashboard
  if (isAdminLoggedIn) {
    return (
      <AdminPanel
        authPin="954675"
        onLogout={() => setIsAdminLoggedIn(false)}
        onSettingsUpdated={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
      />
    );
  }

  // MANDATORY USER REQUIREMENT:
  // "वेबसाइट ओपन होने से पहले यूजर को रजिस्टर करना होगा"
  // If no user is logged in, show the Auth screen first!
  if (!currentUser) {
    return (
      <>
        <AuthModal
          onSuccess={handleAuthSuccess}
          onOpenAdminPrompt={() => setIsAdminPromptOpen(true)}
        />

        {/* Discreet Admin PIN Prompt for Admin Login */}
        {isAdminPromptOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-400" />
                  <h4 className="font-bold text-sm">Admin Access</h4>
                </div>
                <button
                  onClick={() => {
                    setIsAdminPromptOpen(false);
                    setAdminPinInput('');
                    setAdminPinError('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleVerifyAdminPin} className="space-y-3 mt-3">
                <p className="text-[11px] text-slate-400">
                  Enter 6-digit Security PIN to access Administrator Master Control:
                </p>

                {adminPinError && (
                  <div className="p-2 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{adminPinError}</span>
                  </div>
                )}

                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="Enter PIN (e.g. 954675)"
                  maxLength={10}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-base tracking-widest font-mono text-white focus:outline-none focus:border-orange-500"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Login to Admin Panel
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Authenticated Main View
  return (
    <div className="min-h-screen bg-[#fcf8f3] text-slate-900 font-sans flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-orange-100/60">
      {/* Top Floating Mini Header / Brand */}
      <div className="bg-white/70 backdrop-blur-md px-4 py-2 border-b border-orange-100/60 sticky top-0 z-20 flex items-center justify-between">
        <div
          onClick={handleLogoSecretClick}
          className="flex items-center gap-2 cursor-pointer select-none"
          title="ShaktiPay"
        >
          <div className="w-7 h-7">
            <ShaktiPayLogo size="sm" />
          </div>
          <span className="font-black text-sm tracking-tight text-slate-800">
            Shakti<span className="text-orange-500">Pay</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Service Header Shortcut */}
          <button
            type="button"
            onClick={handleOpenCustomerService}
            title="Telegram Support"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/80 text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Support</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomeTab
            currentUser={currentUser}
            settings={settings}
            deposits={deposits}
            withdrawals={withdrawals}
            onOpenDeposit={(amt) => {
              setDepositAmount(amt || 100);
              setDepositOrigin('deposit');
              setIsDepositModalOpen(true);
            }}
            onOpenWithdrawal={() => setIsWithdrawalModalOpen(true)}
            onOpenCustomerSupport={handleOpenCustomerService}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentTab
            currentUser={currentUser}
            settings={settings}
            onOpenPaymentGateway={(amt, origin) => {
              setDepositAmount(amt);
              setDepositOrigin(origin || 'claim');
              setIsDepositModalOpen(true);
            }}
            onUserBalanceUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('shaktipay_user', JSON.stringify(updatedUser));
            }}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsTab currentUser={currentUser} settings={settings} />
        )}

        {activeTab === 'my' && (
          <MyTab
            currentUser={currentUser}
            settings={settings}
            onLogout={handleLogout}
            onOpenDeposit={() => {
              setDepositAmount(100);
              setDepositOrigin('deposit');
              setIsDepositModalOpen(true);
            }}
            onOpenWithdrawal={() => setIsWithdrawalModalOpen(true)}
            onOpenAdminPrompt={() => setIsAdminPromptOpen(true)}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar matching Video (00:03 - 00:25) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-orange-100 px-4 py-2 z-30 shadow-lg">
        <div className="grid grid-cols-4 gap-1 text-center">
          {/* Tab 1: Home */}
          <button
            type="button"
            id="nav-tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-orange-500 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>

          {/* Tab 2: Payment */}
          <button
            type="button"
            id="nav-tab-payment"
            onClick={() => setActiveTab('payment')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              activeTab === 'payment' ? 'text-orange-500 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold mt-1">Payment</span>
          </button>

          {/* Tab 3: Statistics */}
          <button
            type="button"
            id="nav-tab-statistics"
            onClick={() => setActiveTab('statistics')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'statistics' ? 'text-orange-500 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1">Statistics</span>
          </button>

          {/* Tab 4: My */}
          <button
            type="button"
            id="nav-tab-my"
            onClick={() => setActiveTab('my')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              activeTab === 'my' ? 'text-orange-500 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1">My</span>
          </button>
        </div>
      </nav>

      {/* Floating Customer Service Button (opens Telegram Support Link) */}
      <button
        type="button"
        onClick={handleOpenCustomerService}
        title="Contact Customer Support (ग्राहक सेवा)"
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
      >
        <Headphones className="w-6 h-6 stroke-[2.2]" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
      </button>

      {/* UPI & USDT Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        preselectedAmount={depositAmount}
        origin={depositOrigin}
        onDepositSuccess={refreshUserData}
      />

      {/* Withdrawal Modal (100, 1000, 2000, 5000 only) */}
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSuccess={(newBal) => {
          setCurrentUser((prev) => (prev ? { ...prev, balance: newBal } : null));
          refreshUserData();
        }}
      />

      {/* Secret Admin PIN Prompt Modal */}
      {isAdminPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-400" />
                <h4 className="font-bold text-sm">Admin Access</h4>
              </div>
              <button
                onClick={() => {
                  setIsAdminPromptOpen(false);
                  setAdminPinInput('');
                  setAdminPinError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-3 mt-3">
              <p className="text-[11px] text-slate-400">
                Enter Master Security PIN (954675) to access Administrator Panel:
              </p>

              {adminPinError && (
                <div className="p-2 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminPinError}</span>
                </div>
              )}

              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Enter PIN"
                maxLength={10}
                autoFocus
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-base tracking-widest font-mono text-white focus:outline-none focus:border-orange-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Open Admin Panel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
