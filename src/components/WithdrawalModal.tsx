import { useState } from 'react';
import { X, ArrowDownCircle, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { User, SystemSettings } from '../types';
import { api } from '../lib/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: SystemSettings;
  onSuccess: (newBalance: number) => void;
}

export function WithdrawalModal({ isOpen, onClose, currentUser, settings: _, onSuccess }: WithdrawalModalProps) {
  // STRICT USER CONSTRAINT: "निकासी राशि 100 1000 2000 5000 Add karo. निकासी का राशि कस्टम रशी दर्ज नहीं होना चाहिए"
  const allowedAmounts = [100, 1000, 2000, 5000];
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [method, setMethod] = useState<'UPI' | 'Bank'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser.balance < selectedAmount) {
      setErrorMsg(`अपर्याप्त बैलेंस (Insufficient Balance). आपके पास केवल ₹${currentUser.balance.toFixed(2)} है।`);
      return;
    }

    if (method === 'UPI' && !upiId.trim()) {
      setErrorMsg('कृपया अपनी UPI ID दर्ज करें');
      return;
    }

    if (method === 'Bank' && (!accountNumber.trim() || !ifsc.trim() || !accountHolder.trim())) {
      setErrorMsg('कृपया बैंक खाता विवरण (Account No, IFSC, Holder Name) पूरा भरें');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitWithdrawal({
        userId: currentUser.id,
        userPhone: currentUser.phone,
        amount: selectedAmount,
        method,
        accountInfo: {
          upiId: method === 'UPI' ? upiId.trim() : undefined,
          accountHolder: accountHolder.trim() || `User ${currentUser.phone}`,
          bankName: method === 'Bank' ? bankName.trim() : undefined,
          accountNumber: method === 'Bank' ? accountNumber.trim() : undefined,
          ifsc: method === 'Bank' ? ifsc.trim().toUpperCase() : undefined,
        },
      });

      if (res.success) {
        setSuccessMsg(`₹${selectedAmount} की निकासी अनुरोध सफलतापूर्वक सबमिट हो गया!`);
        if (res.remainingBalance !== undefined) {
          onSuccess(res.remainingBalance);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.message || 'निकासी में त्रुटि हुई');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'सर्वर त्रुटि');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md my-auto shadow-2xl border border-orange-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Withdrawal (निकासी)</h2>
              <p className="text-xs text-orange-100">
                Available: <span className="font-bold text-white">₹ {currentUser.balance.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Amount Selection - STRICT RULE: NO CUSTOM INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Select Withdrawal Amount (निकासी राशि चुनें):
              </label>
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Fixed Amounts Only
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {allowedAmounts.map((amt) => {
                const isSelected = selectedAmount === amt;
                const canAfford = currentUser.balance >= amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-3 px-4 rounded-2xl font-black text-sm transition-all border text-center flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-300'
                        : canAfford
                        ? 'border-slate-200 bg-white text-slate-800 hover:border-orange-300'
                        : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-base tracking-tight">₹ {amt.toLocaleString()}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                      {canAfford ? 'Eligible' : 'Low Balance'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              * निकासी राशि 100, 1000, 2000 या 5000 ही स्वीकार्य है। (कस्टम राशि दर्ज नहीं हो सकती)
            </p>
          </div>

          {/* Withdrawal Channel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Withdrawal Method (निकासी माध्यम):
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  method === 'UPI'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                UPI Transfer
              </button>
              <button
                type="button"
                onClick={() => setMethod('Bank')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  method === 'Bank'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bank Account
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {method === 'UPI' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient UPI ID (आपकी UPI ID):
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis / 9876543210@paytm"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Holder Name (खाता धारक का नाम):
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full name as in passbook"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name:</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="SBI, HDFC, etc."
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code:</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number:</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter Bank Account Number"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>निकासी अनुरोध एडमिन द्वारा सत्यापित होने के बाद आपके बैंक/UPI में सीधे क्रेडिट हो जाएगा।</span>
            </div>

            <button
              type="submit"
              id="withdrawal-submit-btn"
              disabled={isSubmitting || currentUser.balance < selectedAmount}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Confirm Withdraw ₹${selectedAmount}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
