'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { useToast } from '../../components/ui/toast';
import { Captcha, CaptchaHandle } from '../../components/security/captcha';
import {
  LogIn,
  Sprout,
  Building2,
  ShieldCheck,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  UserCheck,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { login, user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const captchaRef = useRef<CaptchaHandle>(null);

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'FARMER' | 'BUYER' | 'ADMIN'>('FARMER');
  const [captchaData, setCaptchaData] = useState<{ captchaId: string; captchaAnswer: string }>({
    captchaId: '',
    captchaAnswer: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Fast-Fill
  const handleFastFill = (role: 'FARMER' | 'BUYER' | 'ADMIN') => {
    setSelectedRole(role);
    if (role === 'FARMER') {
      setPhoneOrEmail('9876543210');
      setPassword('farmer123');
    } else if (role === 'BUYER') {
      setPhoneOrEmail('9876543220');
      setPassword('buyer123');
    } else if (role === 'ADMIN') {
      setPhoneOrEmail('admin@vanijya.gov.in');
      setPassword('admin@123');
    }
    setErrorMessage(null);
  };

  const handleCaptchaChange = (data: { captchaId: string; captchaAnswer: string }) => {
    setCaptchaData(data);
    if (errorMessage && errorMessage.includes('CAPTCHA')) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phoneOrEmail.trim() || !password.trim()) {
      setErrorMessage(t.msgPhoneRequired);
      return;
    }

    if (!captchaData.captchaId || !captchaData.captchaAnswer.trim()) {
      setErrorMessage(t.msgCaptchaRequired);
      return;
    }

    setIsLoading(true);

    try {
      await login(
        phoneOrEmail.trim(),
        password,
        selectedRole,
        captchaData.captchaId,
        captchaData.captchaAnswer.trim(),
      );

      showToast(t.signedInSuccessfullyTitle, 'success');
      router.push(redirectPath);
    } catch (err: any) {
      const msg = err.message || t.msgLoginFailed;
      setErrorMessage(msg);
      showToast(msg, 'error');

      // Refresh CAPTCHA on failure
      if (captchaRef.current) {
        captchaRef.current.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-amber-200 shadow-xl text-center space-y-4 my-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <UserCheck className="w-8 h-8 text-amber-700" />
        </div>
        <h2 className="text-xl font-black text-slate-900">{t.signedInSuccessfullyTitle}</h2>
        <p className="text-xs text-slate-600">
          {t.loggedInAsLabel} <strong>{user.name}</strong> ({user.role})
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition shadow-md"
          >
            {user.role === 'FARMER' ? t.goToFarmerHubBtn : user.role === 'BUYER' ? t.goToProcurementDeskBtn : t.goToAdminPanelBtn}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl border border-amber-300/80 p-6 md:p-8 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5 border-b border-amber-100 pb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center font-black mx-auto shadow-md shadow-amber-500/25">
            <LogIn className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.loginTitle}
          </h1>
          <p className="text-xs text-slate-500">
            {t.loginSubtitle}
          </p>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            {t.chooseAccountDemoFill}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleFastFill('FARMER')}
              className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                selectedRole === 'FARMER'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-sm'
                  : 'bg-amber-50/40 text-slate-600 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[11px]">{t.roleFarmer}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFastFill('BUYER')}
              className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                selectedRole === 'BUYER'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-sm'
                  : 'bg-amber-50/40 text-slate-600 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-[11px]">{t.roleBuyer}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFastFill('ADMIN')}
              className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-sm'
                  : 'bg-amber-50/40 text-slate-600 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-[11px]">{t.roleAdmin}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.phoneOrEmailLabel}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder={t.phoneOrEmailPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Integrated Visual CAPTCHA */}
          <Captcha
            ref={captchaRef}
            onCaptchaChange={handleCaptchaChange}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.signingIn}</span>
              </>
            ) : (
              <>
                <span>{t.btnSignIn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Registration Link */}
        <div className="pt-2 border-t border-amber-100 text-center space-y-1">
          <p className="text-xs text-slate-500">
            {t.newToVanijya}{' '}
            <Link href="/signup" className="text-amber-800 font-bold hover:underline">
              {t.createAccountLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
