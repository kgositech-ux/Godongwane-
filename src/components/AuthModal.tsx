import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    sendVerificationEmail,
    checkEmailVerified,
    isEmailVerified,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        // If email is not verified, prompt user to verify
        if (currentUser && !currentUser.emailVerified) {
          setMode('verify');
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        await registerWithEmail(email, password, displayName);
        setMode('verify');
        setSuccessMsg(
          `Verification email sent to ${email.trim()}! Please confirm your email to activate full platform access.`
        );
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMsg('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      // Error caught in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setSubmitting(true);
    try {
      await sendVerificationEmail();
      setSuccessMsg(`A new confirmation email has been dispatched to ${currentUser?.email || email}.`);
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30000);
    } catch (err) {
      // Error in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    setSubmitting(true);
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        setSuccessMsg('Email verified successfully! Welcome to Godongwane Progressive Projects.');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSuccessMsg('Email not verified yet. Please check your inbox and spam folder for the confirmation link.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setQuickAdmin = (adminEmail: string) => {
    setEmail(adminEmail);
    setPassword('Godongwane2026!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shadow-inner">
              G
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'signin' && 'Sign In to Godongwane Portal'}
                {mode === 'signup' && 'Create Enterprise Account'}
                {mode === 'reset' && 'Reset Your Password'}
                {mode === 'verify' && 'Verify Your Email Address'}
              </h2>
              <p className="text-xs text-slate-400">
                Godongwane Progressive Projects • Secure Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode: Email Verification Step */}
          {mode === 'verify' ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Check Your Inbox</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  We've sent a verification link to{' '}
                  <strong className="text-amber-400 font-mono">
                    {currentUser?.email || email}
                  </strong>
                  . Please confirm your email to complete verification with Firebase.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerificationStatus}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  <span>I've Verified My Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={submitting || resendCooldown}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{resendCooldown ? 'Wait 30s to Resend' : 'Resend Verification Email'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Official Google Sign-in Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Or with email address
                </span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Praise-God Cebolenkosi Mthethwa"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. mthethwapraisegodcebolenkosi@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('reset')}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {submitting
                      ? 'Processing...'
                      : mode === 'signin'
                      ? 'Sign In with Email'
                      : mode === 'signup'
                      ? 'Create Account & Send Verification'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Admin Quick Login Callout */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Executive Administrative Accounts</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {ADMIN_EMAILS.map((adminEmail) => (
                    <button
                      key={adminEmail}
                      type="button"
                      onClick={() => setQuickAdmin(adminEmail)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white border border-slate-800 text-left transition-colors"
                    >
                      <span className="font-mono truncate">{adminEmail}</span>
                      <span className="text-[10px] text-amber-400 shrink-0 font-medium">Auto-fill</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="pt-1 text-center text-xs text-slate-400">
                {mode === 'signin' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-amber-400 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-amber-400 hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
