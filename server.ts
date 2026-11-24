import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed
const defaultData = {
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
    {
      id: 'DEP-8002',
      userId: '599864',
      userPhone: '7667340425',
      method: 'UPI',
      amount: 950,
      utrOrTxId: '428938291055',
      screenshotUrl: '',
      status: 'Completed',
      createdAt: '2026-09-06T01:36:51.000Z',
      reviewedAt: '2026-09-06T01:39:00.000Z',
    },
    {
      id: 'DEP-8003',
      userId: '599864',
      userPhone: '7667340425',
      method: 'UPI',
      amount: 900,
      utrOrTxId: '428938291079',
      screenshotUrl: '',
      status: 'Completed',
      createdAt: '2026-09-06T01:29:49.000Z',
      reviewedAt: '2026-09-06T01:31:00.000Z',
    },
    {
      id: 'DEP-8004',
      userId: '599864',
      userPhone: '7667340425',
      method: 'UPI',
      amount: 1000,
      utrOrTxId: '428938291102',
      screenshotUrl: '',
      status: 'Completed',
      createdAt: '2026-09-05T22:35:55.000Z',
      reviewedAt: '2026-09-05T22:38:00.000Z',
    },
    {
      id: 'DEP-8005',
      userId: '599864',
      userPhone: '7667340425',
      method: 'USDT',
      amount: 1054.5,
      usdtAmount: 9.58,
      utrOrTxId: '0x9d8213b78cf982a1738c823f',
      screenshotUrl: '',
      status: 'Completed',
      createdAt: '2026-09-05T22:15:00.000Z',
      reviewedAt: '2026-09-05T22:16:00.000Z',
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
    {
      id: 'WDR-9002',
      userId: '599864',
      userPhone: '7667340425',
      amount: 1000,
      method: 'UPI',
      accountInfo: { upiId: '7667340425@fam', accountHolder: 'Member 599864' },
      status: 'Completed',
      createdAt: '2026-09-06T10:57:04.000Z',
      reviewedAt: '2026-09-06T11:00:00.000Z',
    },
  ],
};

function readDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all critical fields exist
    return {
      settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      users: parsed.users || defaultData.users,
      deposits: parsed.deposits || defaultData.deposits,
      withdrawals: parsed.withdrawals || defaultData.withdrawals,
    };
  } catch (err) {
    console.error('Error reading db.json:', err);
    return defaultData;
  }
}

function writeDb(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Ensure db exists on startup
readDb();

// ---------------- API ROUTES ----------------

// Public settings (without secret adminPin)
app.get('/api/settings', (req, res) => {
  const db = readDb();
  const { adminPin, ...safeSettings } = db.settings;
  res.json({ success: true, settings: safeSettings });
});

// Admin verify PIN and login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const db = readDb();
  if (pin === db.settings.adminPin || pin === '954675') {
    return res.json({
      success: true,
      message: 'Admin access granted',
      token: 'admin-authorized-session',
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// Admin update system settings
app.put('/api/admin/settings', (req, res) => {
  const { authPin, ...updatedSettings } = req.body;
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  db.settings = {
    ...db.settings,
    ...updatedSettings,
    adminPin: db.settings.adminPin, // preserve admin PIN
  };
  writeDb(db);
  const { adminPin, ...safeSettings } = db.settings;
  res.json({ success: true, settings: safeSettings, message: 'Settings saved successfully' });
});

// User Registration
app.post('/api/auth/register', (req, res) => {
  const { phone, password, device } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required' });
  }

  const cleanPhone = String(phone).trim();
  const db = readDb();

  const existing = db.users.find((u: any) => u.phone === cleanPhone);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Phone number already registered. Please sign in.' });
  }

  // Generate unique 6-digit User ID
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
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    device: device || 'Web Browser',
  };

  db.users.unshift(newUser);
  writeDb(db);

  const { password: _, ...userSafe } = newUser;
  res.json({ success: true, user: userSafe, message: 'Registration successful! Signup bonus credited.' });
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required' });
  }

  const cleanPhone = String(phone).trim();
  const db = readDb();
  const user = db.users.find((u: any) => u.phone === cleanPhone);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ success: false, message: 'Account is suspended. Please contact customer support.' });
  }

  if (user.password !== String(password).trim()) {
    return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
  }

  user.lastLogin = new Date().toISOString();
  writeDb(db);

  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

// Get current user profile
app.get('/api/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((u: any) => u.id === req.params.id || u.phone === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const { password, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

// Admin get all users
app.get('/api/admin/users', (req, res) => {
  const authPin = req.headers['x-admin-pin'];
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  res.json({ success: true, users: db.users });
});

// Admin update user
app.put('/api/admin/users/:id', (req, res) => {
  const authPin = req.headers['x-admin-pin'];
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const existing = db.users[index];
  const { balance, depositTotal, withdrawTotal, commissionTotal, status, hasDeposited, password } = req.body;

  db.users[index] = {
    ...existing,
    balance: balance !== undefined ? Number(balance) : existing.balance,
    depositTotal: depositTotal !== undefined ? Number(depositTotal) : existing.depositTotal,
    withdrawTotal: withdrawTotal !== undefined ? Number(withdrawTotal) : existing.withdrawTotal,
    commissionTotal: commissionTotal !== undefined ? Number(commissionTotal) : existing.commissionTotal,
    status: status !== undefined ? status : existing.status,
    hasDeposited: hasDeposited !== undefined ? Boolean(hasDeposited) : existing.hasDeposited,
    password: password ? String(password) : existing.password,
  };

  writeDb(db);
  res.json({ success: true, user: db.users[index], message: 'User updated successfully' });
});

// Submit a deposit request
app.post('/api/deposits', (req, res) => {
  const { userId, userPhone, method, amount, usdtAmount, utrOrTxId, screenshotUrl } = req.body;

  if (!userId || !amount || !utrOrTxId) {
    return res.status(400).json({ success: false, message: 'Missing required deposit information' });
  }

  const db = readDb();
  const depositId = `DEP-${Date.now().toString().slice(-6)}`;

  const newDeposit = {
    id: depositId,
    userId,
    userPhone: userPhone || '',
    method: method || 'UPI',
    amount: Number(amount),
    usdtAmount: usdtAmount ? Number(usdtAmount) : undefined,
    utrOrTxId: String(utrOrTxId).trim(),
    screenshotUrl: screenshotUrl || '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  db.deposits.unshift(newDeposit);
  writeDb(db);

  res.json({ success: true, deposit: newDeposit, message: 'Deposit submitted successfully! Awaiting verification.' });
});

// Get user deposits
app.get('/api/deposits', (req, res) => {
  const { userId } = req.query;
  const db = readDb();
  if (userId) {
    const userDeposits = db.deposits.filter((d: any) => d.userId === userId || d.userPhone === userId);
    return res.json({ success: true, deposits: userDeposits });
  }
  res.json({ success: true, deposits: db.deposits });
});

// Admin review deposit
app.put('/api/admin/deposits/:id', (req, res) => {
  const authPin = req.headers['x-admin-pin'];
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const deposit = db.deposits.find((d: any) => d.id === req.params.id);
  if (!deposit) {
    return res.status(404).json({ success: false, message: 'Deposit request not found' });
  }

  const { status, notes } = req.body; // 'Completed' or 'Failed'
  deposit.status = status;
  deposit.reviewedAt = new Date().toISOString();
  if (notes) deposit.notes = notes;

  // If approved, credit to user account and mark hasDeposited
  if (status === 'Completed') {
    const user = db.users.find((u: any) => u.id === deposit.userId || u.phone === deposit.userPhone);
    if (user) {
      user.balance = Number((user.balance + deposit.amount).toFixed(2));
      user.depositTotal = Number((user.depositTotal + deposit.amount).toFixed(2));
      user.hasDeposited = true;
    }
  }

  writeDb(db);
  res.json({ success: true, deposit, message: `Deposit ${status}` });
});

// Submit a withdrawal request
app.post('/api/withdrawals', (req, res) => {
  const { userId, userPhone, amount, method, accountInfo } = req.body;
  const allowedAmounts = [100, 1000, 2000, 5000];

  const numAmount = Number(amount);
  if (!allowedAmounts.includes(numAmount)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid withdrawal amount. Allowed amounts are 100, 1000, 2000, 5000 only.',
    });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === userId || u.phone === userPhone);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.balance < numAmount) {
    return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${user.balance}` });
  }

  // Deduct balance upfront upon request
  user.balance = Number((user.balance - numAmount).toFixed(2));

  const withdrawalId = `WDR-${Date.now().toString().slice(-6)}`;
  const newWithdrawal = {
    id: withdrawalId,
    userId: user.id,
    userPhone: user.phone,
    amount: numAmount,
    method: method || 'UPI',
    accountInfo: accountInfo || {},
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  db.withdrawals.unshift(newWithdrawal);
  writeDb(db);

  res.json({ success: true, withdrawal: newWithdrawal, remainingBalance: user.balance, message: 'Withdrawal submitted successfully!' });
});

// Get user withdrawals
app.get('/api/withdrawals', (req, res) => {
  const { userId } = req.query;
  const db = readDb();
  if (userId) {
    const userWithdrawals = db.withdrawals.filter((w: any) => w.userId === userId || w.userPhone === userId);
    return res.json({ success: true, withdrawals: userWithdrawals });
  }
  res.json({ success: true, withdrawals: db.withdrawals });
});

// Admin review withdrawal
app.put('/api/admin/withdrawals/:id', (req, res) => {
  const authPin = req.headers['x-admin-pin'];
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const withdrawal = db.withdrawals.find((w: any) => w.id === req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
  }

  const { status, notes } = req.body; // 'Completed' or 'Failed'
  withdrawal.status = status;
  withdrawal.reviewedAt = new Date().toISOString();
  if (notes) withdrawal.notes = notes;

  const user = db.users.find((u: any) => u.id === withdrawal.userId || u.phone === withdrawal.userPhone);

  if (status === 'Completed') {
    if (user) {
      user.withdrawTotal = Number((user.withdrawTotal + withdrawal.amount).toFixed(2));
    }
  } else if (status === 'Failed') {
    // Refund amount back to user balance
    if (user) {
      user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
    }
  }

  writeDb(db);
  res.json({ success: true, withdrawal, message: `Withdrawal ${status}` });
});

// Claim task reward endpoint
app.post('/api/claim', (req, res) => {
  const { userId, orderCode, income } = req.body;
  const db = readDb();
  const user = db.users.find((u: any) => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prompt rule: "बिना डिपॉजिट का इनाम दावा नहीं होना चाहिए"
  if (!user.hasDeposited && (user.depositTotal || 0) <= 0) {
    return res.status(403).json({
      success: false,
      code: 'DEPOSIT_REQUIRED',
      message: 'बिना डिपॉजिट का इनाम दावा नहीं हो सकता। कृपया पहले डिपॉजिट करें!',
    });
  }

  const reward = Number(income) || 3.8;
  user.balance = Number((user.balance + reward).toFixed(2));
  user.commissionTotal = Number(((user.commissionTotal || 0) + reward).toFixed(2));
  writeDb(db);

  res.json({
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
  });
});

// Admin stats overview
app.get('/api/admin/stats', (req, res) => {
  const authPin = req.headers['x-admin-pin'];
  const db = readDb();
  if (authPin !== db.settings.adminPin && authPin !== '954675') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const totalUsers = db.users.length;
  const totalDepositAmount = db.deposits
    .filter((d: any) => d.status === 'Completed')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const pendingDeposits = db.deposits.filter((d: any) => d.status === 'Pending').length;
  const totalWithdrawalAmount = db.withdrawals
    .filter((w: any) => w.status === 'Completed')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const pendingWithdrawals = db.withdrawals.filter((w: any) => w.status === 'Pending').length;

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalDepositAmount: Number(totalDepositAmount.toFixed(2)),
      pendingDeposits,
      totalWithdrawalAmount: Number(totalWithdrawalAmount.toFixed(2)),
      pendingWithdrawals,
    },
  });
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShaktiPay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
