import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Upload, QrCode, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { SystemSettings, User } from '../types';
import { api } from '../lib/api';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: SystemSettings;
  preselectedAmount?: number;
  origin?: 'deposit' | 'claim';
  onDepositSuccess: () => void;
}

export function PaymentGatewayModal({
  isOpen,
  onClose,
  currentUser,
  settings,
  preselectedAmount,
  origin = 'deposit',
  onDepositSuccess,
}: PaymentGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<'UPI' | 'USDT'>('UPI');
  const [amount, setAmount] = useState<number>(preselectedAmount || 100);
  const [utrOrTxId, setUtrOrTxId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic amounts required by prompt: 100, 200, 300, 400, 500, 600
  const dynamicAmounts = [100, 200, 300, 400, 500, 600];

  useEffect(() => {
    if (preselectedAmount) {
      setAmount(preselectedAmount);
    }
  }, [preselectedAmount]);

  // Generate QR code whenever amount, activeTab, upiId or usdtAddress changes
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'UPI') {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=ShaktiPay&am=${amount}&cu=INR&tn=Deposit-${currentUser.phone}`;
      QRCode.toDataURL(upiUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    } else {
      // USDT TRC20 QR
      QRCode.toDataURL(settings.usdtAddress, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('USDT QR code error:', err));
    }
  }, [isOpen, activeTab, amount, settings.upiId, settings.usdtAddress, currentUser.phone]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('फ़ाइल का आकार 8MB से कम होना चाहिए (Max image size 8MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotUrl(reader.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!utrOrTxId.trim()) {
      setErrorMsg(activeTab === 'UPI' ? 'कृपया 12-अंकों का UTR / Ref No. दर्ज करें' : 'कृपया TXID / Transaction Hash दर्ज करें');
      return;
    }

    if (!screenshotUrl) {
      setErrorMsg('कृपया भुगतान का स्क्रीनशॉट अपलोड करें (Screenshot is required)');
      return;
    }

    setIsSubmitting(true);
    try {
      const usdtAmt = activeTab === 'USDT' ? Number((amount / settings.usdtRate).toFixed(2)) : undefined;

      const res = await api.submitDeposit({
        userId: currentUser.id,
        userPhone: currentUser.phone,
        method: activeTab,
        amount: Number(amount),
        usdtAmount: usdtAmt,
        utrOrTxId: utrOrTxId.trim(),
        screenshotUrl,
      });

      if (res.success) {
        setSuccessMsg('डिपॉजिट अनुरोध सफलतापूर्वक सबमिट हो गया! एडमिन द्वारा सत्यापन के बाद बैलेंस जुड़ जाएगा।');
        setTimeout(() => {
          onDepositSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.message || 'सबमिट करने में त्रुटि हुई');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedUsdt = (amount / settings.usdtRate).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md my-auto shadow-2xl border border-orange-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff6b00] to-[#ffa000] p-4 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                {origin === 'claim' ? 'Claim Payment Gateway' : 'Deposit Gateway'}
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                {origin === 'claim'
                  ? 'इनाम दावा करने के लिए डिपॉजिट आवश्यक है'
                  : 'Fast UPI & TRC20 USDT Deposit'}
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

        {/* Origin Claim Notice if opened from Claim button */}
        {origin === 'claim' && (
          <div className="bg-amber-50 border-b border-amber-200 p-2.5 px-4 text-xs text-amber-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Claim Verification:</strong> कृपया पेमेंट पूरा करें और स्क्रीनशॉट सबमिट करें।
            </span>
          </div>
        )}

        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('UPI')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'UPI'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              UPI Gateway (QR Code)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('USDT')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'USDT'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USDT TRC(20) Network
            </button>
          </div>

          {/* Dynamic Amount Selector: 100, 200, 300, 400, 500, 600 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Dynamic Payment Amount (रुपये चुनें):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dynamicAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all border ${
                    amount === amt
                      ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                  }`}
                >
                  ₹ {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab 1: UPI Gateway */}
          {activeTab === 'UPI' && (
            <div className="space-y-4">
              {/* QR Code Container */}
              <div className="bg-[#fff9f2] border border-orange-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">
                  Scan & Pay ₹{amount} with Any UPI App
                </span>

                <div className="p-3 bg-white rounded-2xl border-2 border-orange-200 shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* UPI ID Display & Copy Button */}
                <div className="mt-3 w-full max-w-xs flex items-center justify-between bg-white border border-orange-300 rounded-xl px-3 py-2">
                  <div className="text-left overflow-hidden">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">UPI ID</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {settings.upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.upiId)}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-xs font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Supports: PhonePe, Paytm, GooglePay, BHIM, Mobikwik</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab 2: USDT TRC20 Gateway */}
          {activeTab === 'USDT' && (
            <div className="space-y-4">
              <div className="bg-[#f0fdf4] border border-emerald-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Network: {settings.usdtNetwork || 'TRC20'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    Ratio: 1 USDT = {settings.usdtRate} INR
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-700 my-1">
                  Pay Amount: <span className="text-emerald-600 text-sm font-black">{calculatedUsdt} USDT</span> (₹{amount})
                </p>

                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-300 shadow-md my-2">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="USDT TRC20 QR"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                      Loading QR...
                    </div>
                  )}
                </div>

                {/* USDT Address Box */}
                <div className="w-full flex items-center justify-between bg-white border border-emerald-300 rounded-xl p-2.5">
                  <div className="text-left overflow-hidden mr-2">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">USDT TRC20 Address</span>
                    <span className="text-[11px] font-mono font-bold text-slate-800 break-all select-all">
                      {settings.usdtAddress}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.usdtAddress)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form for Screenshot upload & UTR Number */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Step 1: UTR / TXID Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeTab === 'UPI' ? '12-Digit UTR / Ref Number (यूटीआर नंबर):' : 'USDT TXID / Hash (लेन-देन हैश):'}
              </label>
              <input
                id="deposit-utr-input"
                type="text"
                value={utrOrTxId}
                onChange={(e) => setUtrOrTxId(e.target.value)}
                placeholder={activeTab === 'UPI' ? 'e.g. 428938291024' : 'e.g. 0x9d8213b7...'}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
              />
            </div>

            {/* Step 2: Screenshot Upload ("स्क्रीनशॉट सबमिट करने वाला आना चाहिए") */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Screenshot (भुगतान का स्क्रीनशॉट सबमिट करें):
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!screenshotUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-7 h-7 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Click to Upload Payment Screenshot</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, JPEG up to 8MB</p>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
                  <img
                    src={screenshotUrl}
                    alt="Uploaded payment screenshot"
                    className="w-full h-32 object-contain bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white text-xs hover:bg-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-2 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded">
                    Screenshot uploaded ✓
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="deposit-submit-btn"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ffa000] text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Deposit...</span>
                  </>
                ) : (
                  <>
                    <span>Submit ₹{amount} Deposit Proof</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
