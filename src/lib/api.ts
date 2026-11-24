import { DepositRequest, SystemSettings, User, WithdrawalRequest } from '../types';

export const api = {
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    const data = await res.json();
    return data.settings;
  },

  async adminLogin(pin: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  },

  async adminUpdateSettings(settings: Partial<SystemSettings>, authPin: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, authPin }),
    });
    return res.json();
  },

  async register(phone: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, device: navigator.userAgent }),
    });
    return res.json();
  },

  async login(phone: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    return res.json();
  },

  async getUser(id: string): Promise<{ success: boolean; user?: User }> {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },

  async adminGetUsers(authPin: string): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-pin': authPin },
    });
    return res.json();
  },

  async adminUpdateUser(id: string, updateData: Partial<User>, authPin: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify(updateData),
    });
    return res.json();
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
    const res = await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depositData),
    });
    return res.json();
  },

  async getDeposits(userId?: string): Promise<{ success: boolean; deposits: DepositRequest[] }> {
    const url = userId ? `/api/deposits?userId=${encodeURIComponent(userId)}` : '/api/deposits';
    const res = await fetch(url);
    return res.json();
  },

  async adminReviewDeposit(id: string, status: 'Completed' | 'Failed', notes: string, authPin: string) {
    const res = await fetch(`/api/admin/deposits/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify({ status, notes }),
    });
    return res.json();
  },

  async submitWithdrawal(withdrawalData: {
    userId: string;
    userPhone: string;
    amount: number;
    method: 'UPI' | 'Bank';
    accountInfo: any;
  }): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; remainingBalance?: number; message: string }> {
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawalData),
    });
    return res.json();
  },

  async getWithdrawals(userId?: string): Promise<{ success: boolean; withdrawals: WithdrawalRequest[] }> {
    const url = userId ? `/api/withdrawals?userId=${encodeURIComponent(userId)}` : '/api/withdrawals';
    const res = await fetch(url);
    return res.json();
  },

  async adminReviewWithdrawal(id: string, status: 'Completed' | 'Failed', notes: string, authPin: string) {
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': authPin,
      },
      body: JSON.stringify({ status, notes }),
    });
    return res.json();
  },

  async claimTask(userId: string, orderCode: string, income: number) {
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderCode, income }),
    });
    return res.json();
  },

  async adminGetStats(authPin: string) {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-pin': authPin },
    });
    return res.json();
  },
};
