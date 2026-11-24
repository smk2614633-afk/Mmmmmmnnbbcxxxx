export interface SystemSettings {
  upiId: string;
  usdtAddress: string;
  usdtNetwork: string;
  usdtRate: number; // e.g. 110 INR per 1 USDT
  cashbackRate: number; // e.g. 3.8 %
  signupBonus: number; // e.g. 28.97 INR
  telegramSupport: string;
  adminPin: string; // "954675"
  withdrawalOptions: number[]; // [100, 1000, 2000, 5000]
}

export interface User {
  id: string;
  phone: string;
  password?: string;
  balance: number;
  depositTotal: number;
  withdrawTotal: number;
  commissionTotal: number;
  hasDeposited: boolean;
  status: 'active' | 'blocked';
  createdAt: string;
  lastLogin?: string;
  device?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userPhone: string;
  method: 'UPI' | 'USDT';
  amount: number;
  usdtAmount?: number;
  utrOrTxId: string;
  screenshotUrl?: string;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userPhone: string;
  amount: number; // strictly one of [100, 1000, 2000, 5000]
  method: 'UPI' | 'Bank';
  accountInfo: {
    upiId?: string;
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  };
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ClaimOrder {
  id: string;
  code: string;
  amount: number;
  income: number;
  rangeCategory: '100-199' | '200-299' | '300-399' | '400-499' | '500-600';
  timestamp: string;
}
