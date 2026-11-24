import { DepositRequest, SystemSettings, User, WithdrawalRequest } from '../types';

// Helper for localStorage fallback data
const STORAGE_KEY = 'shaktipay_local_db_v2';

interface LocalDB {
  settings: SystemSettings;
  users: User[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}

const defaultLocalData: LocalDB = {
  settings: {
    upiId: '7667340425@fam',
    usdtAddress: 'TLhKhgh8RFSdxPHuFowWuoWtrqjbzGkzsB',
    usdtNetwork: 'TRC20',
    usdtRate: 110,
    cashbackRate: 3.8,
    signupBonus: 28.97,
    telegramSupport: 'https://t.me/+wd6As_DpBWxmNmU1',
    adminPin: '954675',
    withdrawalOptions: [100, 1000, 2000, 5000],
  },
  users: [
    {
      id: '599864',
      phone: '7667340425',
      password: 'password123',
      balance: 28.97,
      depositTotal: 4150,
      withdrawTotal: 5600,
      commissionTotal: 157.81,
      hasDeposited: true,
      status: 'active',
      createdAt: '2026-09-01T10:00:00.000Z',
      lastLogin: new Date().toISOString(),
      device: 'Mobile Web (Chrome)',
    },
  ],
  deposits: [
    {
      id: 'DEP-8001',
      userId: '599864',
      userPhone: '7667340425',
      method: 'UPI',
      amount: 800,
      utrOrTxId: '428938291024',
      screenshotUrl: '',
      status: 'Completed',
      createdAt: '2026-09-06T05:36:14.000Z',
      reviewedAt: '2026-09-06T05:38:00.000Z',
    },
  ],
  withdrawals: [
    {
      id: 'WDR-9001',
      userId: '599864',
      userPhone: '7667340425',
      amount: 1000,
      method: 'UPI',
      accountInfo: { upiId: '7667340425@fam', accountHolder: 'Member 599864' },
      status: 'Completed',
      createdAt: '2026-09-06T17:01:56.000Z',
      reviewedAt: '2026-09-06T17:05:00.000Z',
    },
  ],
};

function getLocalDb(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLocalData));
      return defaultLocalData;
    }
    const parsed = JSON.parse(raw);
    return {
      settings: { ...defaultLocalData.settings, ...(parsed.settings || {}) },
      users: parsed.users || defaultLocalData.users,
      deposits: parsed.deposits || defaultLocalData.deposits,
      withdrawals: parsed.withdrawals || defaultLocalData.withdrawals,
    };
  } catch {
    return defaultLocalData;
  }
}

function saveLocalDb(db: LocalDB) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save local db:', err);
  }
}

// Local storage fallback handler for Vercel / Static deployments
async function localApiFallback(endpoint: string, options?: RequestInit): Promise<any> {
  const db = getLocalDb();
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body as string) : null;
  const headers = (options?.headers || {}) as Record<string, string>;
  const authPin = headers['x-admin-pin'];

  // 1. Settings
  if (endpoint === '/api/settings' && method === 'GET') {
    const { adminPin, ...safeSettings } = db.settings;
    return { success: true, settings: safeSettings };
  }

  // 2. Admin Login
  if (endpoint === '/api/admin/login' && method === 'POST') {
    const { pin } = body;
    if (pin === db.settings.adminPin || pin === '954675') {
      return { success: true, message: 'Admin access granted', token: 'admin-authorized-session' };
    }
    return { success: false, message: 'Invalid Admin PIN' };
  }

  // 3. Admin Update Settings
  if (endpoint === '/api/admin/settings' && method === 'PUT') {
    const { authPin, ...updated } = body;
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    db.settings = { ...db.settings, ...updated };
    saveLocalDb(db);
    const { adminPin, ...safeSettings } = db.settings;
    return { success: true, settings: safeSettings, message: 'Settings saved successfully' };
  }

  // 4. Register
  if (endpoint === '/api/auth/register' && method === 'POST') {
    const { phone, password, device } = body;
    if (!phone || !password) {
      return { success: false, message: 'Phone and password are required' };
    }
    const cleanPhone = String(phone).trim();
    const existing = db.users.find((u: any) => u.phone === cleanPhone);
    if (existing) {
      return { success: false, message: 'Phone number already registered. Please sign in.' };
    }

    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = {
      id: randomId,
      phone: cleanPhone,
      password: String(password).trim(),
      balance: Number(db.settings.signupBonus) || 28.97,
      depositTotal: 0,
      withdrawTotal: 0,
      commissionTotal: 0,
      hasDeposited: false,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      device: device || 'Web Browser',
    };

    db.users.unshift(newUser);
    saveLocalDb(db);

    const { password: _, ...userSafe } = newUser;
    return { success: true, user: userSafe, message: 'Registration successful! Signup bonus credited.' };
  }

  // 5. Login
  if (endpoint === '/api/auth/login' && method === 'POST') {
    const { phone, password } = body;
    if (!phone || !password) {
      return { success: false, message: 'Phone and password are required' };
    }
    const cleanPhone = String(phone).trim();
    const user = db.users.find((u: any) => u.phone === cleanPhone);
    if (!user) {
      return { success: false, message: 'User not found. Please register first.' };
    }
    if (user.status === 'blocked') {
      return { success: false, message: 'Account is suspended. Please contact customer support.' };
    }
    if (user.password !== String(password).trim()) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }
    user.lastLogin = new Date().toISOString();
    saveLocalDb(db);

    const { password: _, ...userSafe } = user;
    return { success: true, user: userSafe };
  }

  // 6. Get User
  if (endpoint.startsWith('/api/users/') && method === 'GET') {
    const userId = endpoint.split('/api/users/')[1];
    const user = db.users.find((u: any) => u.id === userId || u.phone === userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    const { password, ...userSafe } = user;
    return { success: true, user: userSafe };
  }

  // 7. Admin Get Users
  if (endpoint === '/api/admin/users' && method === 'GET') {
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    return { success: true, users: db.users };
  }

  // 8. Admin Update User
  if (endpoint.startsWith('/api/admin/users/') && method === 'PUT') {
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    const userId = endpoint.split('/api/admin/users/')[1];
    const index = db.users.findIndex((u: any) => u.id === userId);
    if (index === -1) {
      return { success: false, message: 'User not found' };
    }
    const existing = db.users[index];
    db.users[index] = {
      ...existing,
      balance: body.balance !== undefined ? Number(body.balance) : existing.balance,
      depositTotal: body.depositTotal !== undefined ? Number(body.depositTotal) : existing.depositTotal,
      withdrawTotal: body.withdrawTotal !== undefined ? Number(body.withdrawTotal) : existing.withdrawTotal,
      commissionTotal: body.commissionTotal !== undefined ? Number(body.commissionTotal) : existing.commissionTotal,
      status: body.status !== undefined ? body.status : existing.status,
      hasDeposited: body.hasDeposited !== undefined ? Boolean(body.hasDeposited) : existing.hasDeposited,
      password: body.password ? String(body.password) : existing.password,
    };
    saveLocalDb(db);
    return { success: true, user: db.users[index], message: 'User updated successfully' };
  }

  // 9. Submit Deposit
  if (endpoint === '/api/deposits' && method === 'POST') {
    const { userId, userPhone, method: payMethod, amount, usdtAmount, utrOrTxId, screenshotUrl } = body;
    if (!userId || !amount || !utrOrTxId) {
      return { success: false, message: 'Missing required deposit information' };
    }
    const depositId = `DEP-${Date.now().toString().slice(-6)}`;
    const newDeposit: DepositRequest = {
      id: depositId,
      userId,
      userPhone: userPhone || '',
      method: payMethod || 'UPI',
      amount: Number(amount),
      usdtAmount: usdtAmount ? Number(usdtAmount) : undefined,
      utrOrTxId: String(utrOrTxId).trim(),
      screenshotUrl: screenshotUrl || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.deposits.unshift(newDeposit);
    saveLocalDb(db);
    return { success: true, deposit: newDeposit, message: 'Deposit submitted successfully! Awaiting verification.' };
  }

  // 10. Get Deposits
  if (endpoint.startsWith('/api/deposits') && method === 'GET') {
    const urlObj = new URL(endpoint, 'http://localhost');
    const userIdParam = urlObj.searchParams.get('userId');
    if (userIdParam) {
      const filtered = db.deposits.filter((d) => d.userId === userIdParam || d.userPhone === userIdParam);
      return { success: true, deposits: filtered };
    }
    return { success: true, deposits: db.deposits };
  }

  // 11. Admin Review Deposit
  if (endpoint.startsWith('/api/admin/deposits/') && method === 'PUT') {
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    const depId = endpoint.split('/api/admin/deposits/')[1];
    const deposit = db.deposits.find((d) => d.id === depId);
    if (!deposit) {
      return { success: false, message: 'Deposit request not found' };
    }
    deposit.status = body.status;
    deposit.reviewedAt = new Date().toISOString();
    if (body.notes) deposit.notes = body.notes;

    if (body.status === 'Completed') {
      const user = db.users.find((u) => u.id === deposit.userId || u.phone === deposit.userPhone);
      if (user) {
        user.balance = Number((user.balance + deposit.amount).toFixed(2));
        user.depositTotal = Number((user.depositTotal + deposit.amount).toFixed(2));
        user.hasDeposited = true;
      }
    }
    saveLocalDb(db);
    return { success: true, deposit, message: `Deposit ${body.status}` };
  }

  // 12. Submit Withdrawal
  if (endpoint === '/api/withdrawals' && method === 'POST') {
    const { userId, userPhone, amount, method: wMethod, accountInfo } = body;
    const allowedAmounts = [100, 1000, 2000, 5000];
    const numAmount = Number(amount);
    if (!allowedAmounts.includes(numAmount)) {
      return { success: false, message: 'Invalid withdrawal amount. Allowed amounts are 100, 1000, 2000, 5000 only.' };
    }
    const user = db.users.find((u) => u.id === userId || u.phone === userPhone);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    if (user.balance < numAmount) {
      return { success: false, message: `Insufficient balance. Available: ₹${user.balance}` };
    }
    user.balance = Number((user.balance - numAmount).toFixed(2));
    const withdrawalId = `WDR-${Date.now().toString().slice(-6)}`;
    const newWdr: WithdrawalRequest = {
      id: withdrawalId,
      userId: user.id,
      userPhone: user.phone,
      amount: numAmount,
      method: wMethod || 'UPI',
      accountInfo: accountInfo || {},
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.withdrawals.unshift(newWdr);
    saveLocalDb(db);
    return { success: true, withdrawal: newWdr, remainingBalance: user.balance, message: 'Withdrawal submitted successfully!' };
  }

  // 13. Get Withdrawals
  if (endpoint.startsWith('/api/withdrawals') && method === 'GET') {
    const urlObj = new URL(endpoint, 'http://localhost');
    const userIdParam = urlObj.searchParams.get('userId');
    if (userIdParam) {
      const filtered = db.withdrawals.filter((w) => w.userId === userIdParam || w.userPhone === userIdParam);
      return { success: true, withdrawals: filtered };
    }
    return { success: true, withdrawals: db.withdrawals };
  }

  // 14. Admin Review Withdrawal
  if (endpoint.startsWith('/api/admin/withdrawals/') && method === 'PUT') {
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    const wId = endpoint.split('/api/admin/withdrawals/')[1];
    const withdrawal = db.withdrawals.find((w) => w.id === wId);
    if (!withdrawal) {
      return { success: false, message: 'Withdrawal request not found' };
    }
    withdrawal.status = body.status;
    withdrawal.reviewedAt = new Date().toISOString();
    if (body.notes) withdrawal.notes = body.notes;

    const user = db.users.find((u) => u.id === withdrawal.userId || u.phone === withdrawal.userPhone);
    if (body.status === 'Completed' && user) {
      user.withdrawTotal = Number((user.withdrawTotal + withdrawal.amount).toFixed(2));
    } else if (body.status === 'Failed' && user) {
      user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
    }
    saveLocalDb(db);
    return { success: true, withdrawal, message: `Withdrawal ${body.status}` };
  }

  // 15. Claim Task
  if (endpoint === '/api/claim' && method === 'POST') {
    const { userId, income } = body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    if (!user.hasDeposited && (user.depositTotal || 0) <= 0) {
      return {
        success: false,
        code: 'DEPOSIT_REQUIRED',
        message: 'बिना डिपॉजिट का इनाम दावा नहीं हो सकता। कृपया पहले डिपॉजिट करें!',
      };
    }
    const reward = Number(income) || 3.8;
    user.balance = Number((user.balance + reward).toFixed(2));
    user.commissionTotal = Number(((user.commissionTotal || 0) + reward).toFixed(2));
    saveLocalDb(db);
    return {
      success: true,
      user: {
        id: user.id,
        balance: user.balance,
        depositTotal: user.depositTotal,
        withdrawTotal: user.withdrawTotal,
        commissionTotal: user.commissionTotal,
        hasDeposited: user.hasDeposited,
      },
      claimedAmount: reward,
      message: `Claim successful! ₹${reward} added to your balance.`,
    };
  }

  // 16. Admin Stats
  if (endpoint === '/api/admin/stats' && method === 'GET') {
    if (authPin !== db.settings.adminPin && authPin !== '954675') {
      return { success: false, message: 'Unauthorized' };
    }
    const totalUsers = db.users.length;
    const totalDepositAmount = db.deposits
      .filter((d) => d.status === 'Completed')
      .reduce((acc, cur) => acc + cur.amount, 0);
    const pendingDeposits = db.deposits.filter((d) => d.status === 'Pending').length;
    const totalWithdrawalAmount = db.withdrawals
      .filter((w) => w.status === 'Completed')
      .reduce((acc, cur) => acc + cur.amount, 0);
    const pendingWithdrawals = db.withdrawals.filter((w) => w.status === 'Pending').length;

    return {
      success: true,
      stats: {
        totalUsers,
        totalDepositAmount: Number(totalDepositAmount.toFixed(2)),
        pendingDeposits,
        totalWithdrawalAmount: Number(totalWithdrawalAmount.toFixed(2)),
        pendingWithdrawals,
      },
    };
  }

  return { success: false, message: 'Endpoint not found' };
}

// Wrapper with automatic fetch-to-local fallback
async function request(endpoint: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(endpoint, options);
    // If on Vercel/Static hosting, API might return 404 or non-json or HTML
    const contentType = res.headers.get('content-type');
    if (!res.ok || !contentType || !contentType.includes('application/json')) {
      return localApiFallback(endpoint, options);
    }
    return res.json();
  } catch {
    // Fallback to localStorage when fetch fails (e.g. Vercel static deployment)
    return localApiFallback(endpoint, options);
  }
}

export const api = {
  async getSettings(): Promise<SystemSettings> {
    const data = await request('/api/settings');
    return data.settings || defaultLocalData.settings;
  },

  async adminLogin(pin: string): Promise<{ success: boolean; message: string }> {
    return request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
  },

  async adminUpdateSettings(settings: Partial<SystemSettings>, authPin: string) {
    return request('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, authPin }),
    });
  },

  async register(phone: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    return request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, device: navigator.userAgent }),
    });
  },

  async login(phone: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    return request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
  },

  async getUser(id: string): Promise<{ success: boolean; user?: User }> {
    return request(`/api/users/${id}`);
  },

  async adminGetUsers(authPin: string): Promise<{ success: boolean; users: User[] }> {
    return request('/api/admin/users', {
      headers: { 'x-admin-pin': authPin },
    });
  },

  async adminUpdateUser(id: string, updateData: Partial<User>, authPin: string) {
    return request(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify(updateData),
    });
  },

  async submitDeposit(depositData: {
    userId: string;
    userPhone: string;
    method: 'UPI' | 'USDT';
    amount: number;
    usdtAmount?: number;
    utrOrTxId: string;
    screenshotUrl?: string;
  }): Promise<{ success: boolean; deposit?: DepositRequest; message: string }> {
    return request('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depositData),
    });
  },

  async getDeposits(userId?: string): Promise<{ success: boolean; deposits: DepositRequest[] }> {
    const url = userId ? `/api/deposits?userId=${encodeURIComponent(userId)}` : '/api/deposits';
    return request(url);
  },

  async adminReviewDeposit(id: string, status: 'Completed' | 'Failed', notes: string, authPin: string) {
    return request(`/api/admin/deposits/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify({ status, notes }),
    });
  },

  async submitWithdrawal(withdrawalData: {
    userId: string;
    userPhone: string;
    amount: number;
    method: 'UPI' | 'Bank';
    accountInfo: any;
  }): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; remainingBalance?: number; message: string }> {
    return request('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawalData),
    });
  },

  async getWithdrawals(userId?: string): Promise<{ success: boolean; withdrawals: WithdrawalRequest[] }> {
    const url = userId ? `/api/withdrawals?userId=${encodeURIComponent(userId)}` : '/api/withdrawals';
    return request(url);
  },

  async adminReviewWithdrawal(id: string, status: 'Completed' | 'Failed', notes: string, authPin: string) {
    return request(`/api/admin/withdrawals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify({ status, notes }),
    });
  },

  async claimTask(userId: string, orderCode: string, income: number) {
    return request('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderCode, income }),
    });
  },

  async adminGetStats(authPin: string) {
    return request('/api/admin/stats', {
      headers: { 'x-admin-pin': authPin },
    });
  },
};
