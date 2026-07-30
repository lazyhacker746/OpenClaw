import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPinned,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import Logo from '../layout/Logo';

const benefits = [
  {
    icon: MapPinned,
    title: 'Local market targeting',
    description: 'Search cities or precise map areas with review and website-quality filters.',
  },
  {
    icon: ShieldCheck,
    title: 'Qualified lead intelligence',
    description: 'Save structured opportunities, contact routes, and website findings in one Vault.',
  },
  {
    icon: Sparkles,
    title: 'Pitch-ready outreach',
    description: 'Turn local business context into editable, WhatsApp-ready messaging.',
  },
];

export default function AuthScreen({ initialMode = 'login', onBack }) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!showOtp || timeLeft <= 0) return undefined;
    const timer = window.setInterval(() => setTimeLeft((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [showOtp, timeLeft]);

  const formattedTime = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim();

    if (!isLogin && !cleanEmail.toLowerCase().endsWith('@gmail.com')) {
      toast.error('Registration is currently restricted to @gmail.com accounts.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast.success('Welcome back to Clarion.');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;

        if (data?.user && !data?.session) {
          toast.success('Verification code sent to your inbox.');
          setShowOtp(true);
          setTimeLeft(300);
          setOtp('');
        } else {
          toast.success('Account created successfully.');
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (timeLeft === 0) {
      toast.error('This code has expired. Register again to receive a new code.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'signup',
      });
      if (error) throw error;
      toast.success('Email verified. Your workspace is ready.');
    } catch {
      toast.error('The code is invalid. Check it and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="clarion-app-shell relative grid min-h-dvh lg:grid-cols-[1.08fr_0.92fr]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="clarion-focus fixed right-4 top-4 z-[1000] inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-sm font-extrabold text-slate-700 shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-[#111827]/90 dark:text-slate-200 dark:shadow-black/30 dark:hover:bg-[#172033] dark:hover:text-white sm:right-6 sm:top-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Clarion
        </button>
      )}
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#07101d] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-indigo-500/16 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-teal-400/12 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-11 shadow-xl shadow-indigo-500/25" />
            <div>
              <p className="text-xl font-black tracking-[-0.03em]">Clarion</p>
              <p className="text-xs font-semibold text-slate-400">Lead intelligence workspace</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-2xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-300/[0.07] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
            Prospect with clarity
          </span>
          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[1.04] tracking-[-0.055em] xl:text-6xl">
            Find the right businesses. Reach them with context.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
            Clarion combines local discovery, website signals, lead storage, and editable outreach into one focused operating system.
          </p>

          <div className="mt-10 grid gap-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-teal-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="relative text-xs font-semibold text-slate-500">Secure authentication powered by Supabase.</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[470px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-11 w-11 shadow-lg shadow-indigo-600/20" />
            <div>
              <p className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Clarion</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lead intelligence workspace</p>
            </div>
          </div>

          <div className="clarion-surface-strong rounded-[2rem] p-6 sm:p-8">
            {showOtp ? (
              <div className="clarion-enter">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    setTimeLeft(300);
                    setOtp('');
                  }}
                  className="clarion-focus inline-flex items-center gap-2 rounded-lg text-xs font-extrabold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to account form
                </button>

                <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Verify your email</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Enter the eight-digit code sent to <span className="font-extrabold text-slate-900 dark:text-slate-200">{email}</span>.
                </p>

                <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="otp" className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Verification code</label>
                      <span className={`text-xs font-black tabular-nums ${timeLeft < 60 ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {timeLeft > 0 ? formattedTime : 'Expired'}
                      </span>
                    </div>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength="8"
                      value={otp}
                      disabled={timeLeft === 0}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                      className="clarion-input h-14 px-4 text-center text-xl font-black tracking-[0.42em]"
                      placeholder="00000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || timeLeft === 0 || otp.length < 8}
                    className="clarion-button-primary clarion-focus inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                    Confirm registration
                  </button>
                </form>
              </div>
            ) : (
              <div className="clarion-enter">
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/[0.06]" role="tablist" aria-label="Authentication mode">
                  {[
                    { value: true, label: 'Sign in' },
                    { value: false, label: 'Create account' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="tab"
                      aria-selected={isLogin === item.value}
                      onClick={() => setIsLogin(item.value)}
                      className={`clarion-focus flex-1 rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${isLogin === item.value ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-7">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">{isLogin ? 'Welcome back' : 'Start prospecting'}</p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                    {isLogin ? 'Open your workspace' : 'Create your Clarion account'}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {isLogin ? 'Sign in to continue managing searches, leads, and outreach.' : 'Registration currently supports verified Gmail addresses.'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="mt-7 space-y-4">
                  {!isLogin && (
                    <div className="clarion-enter">
                      <label htmlFor="full-name" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Full name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input
                          id="full-name"
                          type="text"
                          autoComplete="name"
                          required
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          className="clarion-input h-12 pl-11 pr-4 text-sm font-semibold"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="clarion-input h-12 pl-11 pr-4 text-sm font-semibold"
                        placeholder="you@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        required
                        minLength="6"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="clarion-input h-12 pl-11 pr-12 text-sm font-semibold"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="clarion-icon-button clarion-focus absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.07] dark:hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="clarion-button-primary clarion-focus mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
                    {isLogin ? 'Sign in to Clarion' : 'Create account'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            By continuing, you confirm that you are authorized to use Clarion for legitimate business prospecting.
          </p>
        </div>
      </section>
    </main>
  );
}
