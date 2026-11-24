import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { User, SystemSettings, DepositRequest, WithdrawalRequest } from '../types';
import { api } from '../lib/api';

interface AdminPanelProps {
  authPin: string;
  onLogout: () => void;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
}

export function AdminPanel({ authPin, onLogout, onSettingsUpdated }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits' | 'withdrawals' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    balance: 0,
    depositTotal: 0,
    withdrawTotal: 0,
    status: 'active' as 'active' | 'blocked',
    hasDeposited: false,
    password: '',
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    upiId: '',
    usdtAddress: '',
    usdtRate: 110,
    cashbackRate: 3.8,
    signupBonus: 28.97,
    telegramSupport: '',
  });

  // Selected screenshot preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'Pending' | 'Completed' | 'Failed'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'Pending' | 'Completed' | 'Failed'>('all');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, depositsRes, withdrawalsRes, settingsRes] = await Promise.all([
        api.adminGetStats(authPin),
        api.adminGetUsers(authPin),
        api.getDeposits(),
        api.getWithdrawals(),
        api.getSettings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (depositsRes.success) setDeposits(depositsRes.deposits);
      if (withdrawalsRes.success) setWithdrawals(withdrawalsRes.withdrawals);
      if (settingsRes) {
        setSettings(settingsRes);
        setSettingsForm({
          upiId: settingsRes.upiId,
          usdtAddress: settingsRes.usdtAddress,
          usdtRate: settingsRes.usdtRate,
          cashbackRate: settingsRes.cashbackRate,
          signupBonus: settingsRes.signupBonus,
          telegramSupport: settingsRes.telegramSupport,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'डाटा लोड करने में त्रुटि', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [authPin]);

  // Handle User Account Edit
  const handleStartEditUser = (user: User) => {
    setEditingUser(user);
    setUserEditForm({
      balance: user.balance,
      depositTotal: user.depositTotal,
      withdrawTotal: user.withdrawTotal,
      status: user.status,
      hasDeposited: user.hasDeposited,
      password: user.password || '',
    });
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await api.adminUpdateUser(editingUser.id, userEditForm, authPin);
      if (res.success) {
        showToast(`User ${editingUser.phone} updated successfully!`);
        setEditingUser(null);
        loadAllData();
      } else {
        showToast(res.message || 'Update failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating user', 'error');
    }
  };

  // Handle Deposit Approval/Rejection
  const handleReviewDeposit = async (id: string, status: 'Completed' | 'Failed') => {
    try {
      const res = await api.adminReviewDeposit(id, status, `Reviewed by admin (${status})`, authPin);
      if (res.success) {
        showToast(`Deposit ${id} marked as ${status}!`);
        loadAllData();
      } else {
        showToast(res.message || 'Error updating deposit', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating deposit', 'error');
    }
  };

  // Handle Withdrawal Approval/Rejection
  const handleReviewWithdrawal = async (id: string, status: 'Completed' | 'Failed') => {
    try {
      const res = await api.adminReviewWithdrawal(id, status, `Reviewed by admin (${status})`, authPin);
      if (res.success) {
        showToast(`Withdrawal ${id} marked as ${status}!`);
        loadAllData();
      } else {
        showToast(res.message || 'Error updating withdrawal', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating withdrawal', 'error');
    }
  };

  // Handle System Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminUpdateSettings(
        {
          upiId: settingsForm.upiId.trim(),
          usdtAddress: settingsForm.usdtAddress.trim(),
          usdtRate: Number(settingsForm.usdtRate),
          cashbackRate: Number(settingsForm.cashbackRate),
          signupBonus: Number(settingsForm.signupBonus),
          telegramSupport: settingsForm.telegramSupport.trim(),
        },
        authPin
      );

      if (res.success) {
        showToast('सेटिंग्स स्थायी रूप से सेव हो गईं! (Settings saved permanently)');
        if (res.settings) {
          onSettingsUpdated(res.settings);
          setSettings(res.settings);
        }
      } else {
        showToast(res.message || 'Error saving settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) => u.phone.includes(searchQuery) || u.id.includes(searchQuery)
  );

  const filteredDeposits = deposits.filter((d) => {
    if (depositFilter !== 'all' && d.status !== depositFilter) return false;
    if (searchQuery && !d.userPhone.includes(searchQuery) && !d.utrOrTxId.includes(searchQuery)) return false;
    return true;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
    if (searchQuery && !w.userPhone.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
              : 'bg-red-900/90 text-red-200 border-red-500'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>ShaktiPay Master Control</span>
              <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono">
                ADMIN
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">PIN: 954675 • Full Access</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview (डैशबोर्ड)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'deposits' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Deposits ({deposits.filter((d) => d.status === 'Pending').length} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'withdrawals' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Withdrawals ({withdrawals.filter((w) => w.status === 'Pending').length} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings (गेटवे व बोनस)</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Registered Users</span>
                <span className="text-2xl font-black text-white mt-1 block">{users.length}</span>
                <span className="text-[10px] text-emerald-400 mt-1 block">Live across all devices</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Pending Deposits</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {deposits.filter((d) => d.status === 'Pending').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Action required</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Pending Withdrawals</span>
                <span className="text-2xl font-black text-orange-400 mt-1 block">
                  {withdrawals.filter((w) => w.status === 'Pending').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Action required</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Approved Deposit</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  ₹ {deposits.filter((d) => d.status === 'Completed').reduce((a, b) => a + b.amount, 0).toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Settled volume</span>
              </div>
            </div>

            {/* Quick Actions & Gateway Status Card */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">
                Active System Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">UPI Gateway ID:</span>
                  <span className="font-bold text-white text-sm break-all">{settings?.upiId}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">USDT Rate (1 USDT):</span>
                  <span className="font-bold text-emerald-400 text-sm">{settings?.usdtRate} INR</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Signup Bonus credited:</span>
                  <span className="font-bold text-orange-400 text-sm">₹ {settings?.signupBonus}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS & ACCOUNT EDITING */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Phone or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <span className="text-xs text-slate-400">Total: {filteredUsers.length} users</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">User ID & Phone</th>
                      <th className="py-3 px-4">Available Balance</th>
                      <th className="py-3 px-4">Total Deposit</th>
                      <th className="py-3 px-4">Total Withdraw</th>
                      <th className="py-3 px-4">Deposit Verified</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/40">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white text-sm block">{user.phone}</span>
                          <span className="text-[10px] text-slate-400">ID: {user.id} • {user.device?.slice(0, 24)}</span>
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-400">
                          ₹ {user.balance.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          ₹ {user.depositTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          ₹ {user.withdrawTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.hasDeposited ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {user.hasDeposited ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(user)}
                            className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Account</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPOSITS APPROVAL */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'Pending', 'Completed', 'Failed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDepositFilter(filter)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    depositFilter === filter ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredDeposits.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-800/40 rounded-3xl">
                  No deposits found for this filter.
                </div>
              ) : (
                filteredDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Screenshot thumbnail if uploaded */}
                      {dep.screenshotUrl ? (
                        <div
                          onClick={() => setPreviewImage(dep.screenshotUrl!)}
                          className="w-16 h-16 rounded-2xl bg-black border border-slate-600 overflow-hidden cursor-pointer relative shrink-0 group"
                        >
                          <img
                            src={dep.screenshotUrl}
                            alt="Deposit screenshot proof"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center text-slate-400 text-[10px] shrink-0 text-center p-1">
                          No Image
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">₹ {dep.amount}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-orange-300">
                            {dep.method} {dep.usdtAmount ? `(${dep.usdtAmount} USDT)` : ''}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dep.status === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : dep.status === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {dep.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1">
                          User Phone: <span className="font-bold text-white">{dep.userPhone}</span> (ID: {dep.userId})
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          UTR / TXID: <span className="text-orange-300 select-all font-bold">{dep.utrOrTxId}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Date: {new Date(dep.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons if Pending */}
                    {dep.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewDeposit(dep.id, 'Completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Add Balance</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewDeposit(dep.id, 'Failed')}
                          className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWALS APPROVAL */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'Pending', 'Completed', 'Failed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setWithdrawalFilter(filter)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    withdrawalFilter === filter ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-800/40 rounded-3xl">
                  No withdrawals found for this filter.
                </div>
              ) : (
                filteredWithdrawals.map((wdr) => (
                  <div
                    key={wdr.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">₹ {wdr.amount}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-amber-300">
                          {wdr.method}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wdr.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : wdr.status === 'Pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {wdr.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1">
                        User: <span className="font-bold text-white">{wdr.userPhone}</span> (ID: {wdr.userId})
                      </p>
                      <div className="text-[11px] text-slate-300 mt-1 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                        {wdr.method === 'UPI' ? (
                          <p>
                            UPI ID: <span className="font-bold text-orange-400 select-all">{wdr.accountInfo?.upiId}</span>
                          </p>
                        ) : (
                          <div>
                            <p>Holder: {wdr.accountInfo?.accountHolder} • Bank: {wdr.accountInfo?.bankName}</p>
                            <p>A/C: <span className="font-mono font-bold select-all text-orange-300">{wdr.accountInfo?.accountNumber}</span> • IFSC: <span className="font-mono font-bold">{wdr.accountInfo?.ifsc}</span></p>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Requested: {new Date(wdr.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {wdr.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewWithdrawal(wdr.id, 'Completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Complete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewWithdrawal(wdr.id, 'Failed')}
                          className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Refund</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS (CASHBACK, USDT RATE, SIGNUP BONUS, UPI ID) */}
        {activeTab === 'settings' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 max-w-xl mx-auto space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <span>Permanent System Settings (स्थायी सेटिंग्स)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                यहाँ जो भी एडिट करेंगे वह हमेशा वेबसाइट में सेव रहेगा और लाइव अपडेट होगा।
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              {/* UPI ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  UPI ID (डिपॉजिट गेटवे UPI ID):
                </label>
                <input
                  type="text"
                  value={settingsForm.upiId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                  placeholder="7667340425@fam"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* USDT Address TRC20 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  USDT Address TRC(20):
                </label>
                <input
                  type="text"
                  value={settingsForm.usdtAddress}
                  onChange={(e) => setSettingsForm({ ...settingsForm, usdtAddress: e.target.value })}
                  placeholder="TLhKhgh8RFSdxPHuFowWuoWtrqjbzGkzsB"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Rates in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                {/* USDT Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    USDT Rate (1 USDT = ? INR):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.usdtRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, usdtRate: Number(e.target.value) })}
                    placeholder="110"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Cashback % */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cashback Rate (%):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.cashbackRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cashbackRate: Number(e.target.value) })}
                    placeholder="3.8"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Signup Bonus */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Signup Bonus (नये यूजर को मिलने वाला बोनस ₹):
                </label>
                <input
                  type="number"
                  step="any"
                  value={settingsForm.signupBonus}
                  onChange={(e) => setSettingsForm({ ...settingsForm, signupBonus: Number(e.target.value) })}
                  placeholder="28.97"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  किसी भी ब्राउज़र से रजिस्टर करने पर यूजर को यह राशि तुरंत क्रेडिट होगी।
                </span>
              </div>

              {/* Telegram Support Link */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ग्राहक सेवा टेलीग्राम लिंक (Customer Service Telegram Link):
                </label>
                <input
                  type="url"
                  value={settingsForm.telegramSupport}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramSupport: e.target.value })}
                  placeholder="https://t.me/+wd6As_DpBWxmNmU1"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg hover:shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Settings Permanently (सेव करें)</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h4 className="font-bold text-white text-sm">
                Edit User Account: +91 {editingUser.phone}
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Available Balance (₹):</label>
                <input
                  type="number"
                  step="any"
                  value={userEditForm.balance}
                  onChange={(e) => setUserEditForm({ ...userEditForm, balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Total Deposit (₹):</label>
                  <input
                    type="number"
                    step="any"
                    value={userEditForm.depositTotal}
                    onChange={(e) => setUserEditForm({ ...userEditForm, depositTotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Total Withdraw (₹):</label>
                  <input
                    type="number"
                    step="any"
                    value={userEditForm.withdrawTotal}
                    onChange={(e) => setUserEditForm({ ...userEditForm, withdrawTotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Deposit Verified Status:</label>
                <select
                  value={userEditForm.hasDeposited ? 'true' : 'false'}
                  onChange={(e) => setUserEditForm({ ...userEditForm, hasDeposited: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="true">Yes - Verified (Can claim rewards)</option>
                  <option value="false">No - Not Verified (Deposit required)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Account Status:</label>
                <select
                  value={userEditForm.status}
                  onChange={(e) => setUserEditForm({ ...userEditForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="active">Active (चालू)</option>
                  <option value="blocked">Blocked / Suspended (प्रतिबंधित)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">User Password:</label>
                <input
                  type="text"
                  value={userEditForm.password}
                  onChange={(e) => setUserEditForm({ ...userEditForm, password: e.target.value })}
                  placeholder="Reset user password"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-xl max-h-[85vh] bg-slate-950 p-2 rounded-3xl border border-slate-700 overflow-hidden relative">
            <img
              src={previewImage}
              alt="Deposit proof enlarged"
              className="w-full h-full object-contain rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
