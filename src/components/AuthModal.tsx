import { useState } from 'react';
import { ShaktiPayLogo } from './ShaktiPayLogo';
import { User, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserType) => void;
  onOpenAdminPrompt: () => void;
}

export function AuthModal({ onSuccess, onOpenAdminPrompt }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('7667340425');
  const [password, setPassword] = useState('123456');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Loading animation states matching video: 'idle' | 'loading' | 'submitting' | 'success'
  const [status, setStatus] = useState<'idle' | 'loading' | 'submitting' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Discreet clicks on version to open admin PIN
  const [versionClicks, setVersionClicks] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone || phone.length < 10) {
      setErrorMessage('कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें (Please enter valid phone)');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('कृपया पासवर्ड दर्ज करें (कम से कम 4 अक्षर)');
      return;
    }

    if (isRegister && confirmPassword && password !== confirmPassword) {
      setErrorMessage('पासवर्ड मेल नहीं खा रहे हैं (Passwords do not match)');
      return;
    }

    if (!agreed) {
      setErrorMessage("कृपया 'User Privacy Agreement' स्वीकार करें");
      return;
    }

    // Step 1: Loading
    setStatus('loading');

    setTimeout(async () => {
      setStatus('submitting');

      try {
        if (isRegister) {
          const res = await api.register(phone, password);
          if (res.success && res.user) {
            setStatus('success');
            setTimeout(() => {
              onSuccess(res.user!);
            }, 800);
          } else {
            setStatus('idle');
            setErrorMessage(res.message || 'पंजीकरण विफल रहा');
          }
        } else {
          const res = await api.login(phone, password);
          if (res.success && res.user) {
            setStatus('success');
            setTimeout(() => {
              onSuccess(res.user!);
            }, 800);
          } else {
            setStatus('idle');
            setErrorMessage(res.message || 'लॉगिन विफल रहा। कृपया विवरण जांचें या रजिस्टर करें।');
          }
        }
      } catch (err: any) {
        setStatus('idle');
        setErrorMessage(err.message || 'सर्वर कनेक्शन त्रुटि');
      }
    }, 700);
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
    <div className="min-h-screen bg-[#fcf8f3] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Decorative Warm Top Background Gradient Arc */}
      <div className="absolute -top-32 -left-20 -right-20 h-72 bg-gradient-to-b from-orange-200/50 via-amber-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center relative z-10">
        {/* Brand Logo */}
        <div className="mb-8">
          <ShaktiPayLogo size="lg" showSubtitle={false} />
        </div>

        {/* Auth Box */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-7 shadow-xl shadow-orange-500/5 border border-orange-100/70">
          {/* Tabs */}
          <div className="flex border-b border-orange-100 pb-3 mb-5">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage('');
              }}
              className={`flex-1 text-center font-bold pb-2 text-base transition-colors relative ${
                !isRegister ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In (लॉग इन)
              {!isRegister && (
                <div className="absolute bottom-[-13px] left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
              )}
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage('');
              }}
              className={`flex-1 text-center font-bold pb-2 text-base transition-colors relative ${
                isRegister ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Register (रजिस्टर)
              {isRegister && (
                <div className="absolute bottom-[-13px] left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Phone Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="auth-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="7667340425"
                maxLength={10}
                required
                className="w-full pl-11 pr-4 py-3 bg-[#fdf9f4] border border-orange-200/60 rounded-2xl text-slate-800 text-sm font-semibold tracking-wide placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                required
                className="w-full pl-11 pr-11 py-3 bg-[#fdf9f4] border border-orange-200/60 rounded-2xl text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password if Register */}
            {isRegister && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="auth-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#fdf9f4] border border-orange-200/60 rounded-2xl text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>
            )}

            {/* Row with Switch & Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-orange-600 font-bold hover:underline"
              >
                {isRegister ? 'Already have account? Sign In' : 'Register'}
              </button>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-orange-500 border-slate-300 rounded focus:ring-orange-400"
                />
                <span>Remember Me</span>
              </label>
            </div>

            {/* User Privacy Agreement checkbox exactly like video */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-400"
                />
                <span className="flex items-center gap-1">
                  Agree <span className="text-orange-600 font-medium">"User Privacy Agreement"</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="auth-submit-btn"
                disabled={status !== 'idle'}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ffa000] text-white font-bold text-base shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
              >
                {isRegister ? 'Register & Get Bonus' : 'Sign In'}
              </button>
            </div>

            {/* Forget Password link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() =>
                  alert('पासवर्ड रीसेट करने के लिए कृपया टेलीग्राम ग्राहक सेवा से संपर्क करें (Contact Customer Support).')
                }
                className="text-xs text-orange-500 hover:text-orange-700 underline font-medium"
              >
                Forget Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Version Tag (clickable 3 times for Admin Portal) */}
      <div className="relative z-10 text-center py-2">
        <button
          type="button"
          onClick={handleVersionClick}
          title="Click 3 times for Admin Login"
          className="text-xs text-slate-400 hover:text-slate-600 tracking-wider font-mono cursor-pointer"
        >
          v1.4.1
        </button>
      </div>

      {/* Video-style Loading Modal Overlay */}
      {status !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#242426]/90 text-white rounded-2xl px-8 py-6 flex flex-col items-center justify-center shadow-2xl min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
            {status === 'loading' && (
              <>
                <div className="w-10 h-10 border-4 border-slate-500 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold tracking-wide text-slate-200">Loading</p>
              </>
            )}

            {status === 'submitting' && (
              <>
                <div className="w-10 h-10 border-4 border-amber-500 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold tracking-wide text-amber-200">Submitting...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <p className="text-sm font-semibold tracking-wide text-emerald-300">
                  {isRegister ? 'Registered!' : 'Signed In'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
