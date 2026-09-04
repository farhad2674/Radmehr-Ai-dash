import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ApplianceParticleMorphCanvas } from '../ApplianceParticleMorphCanvas';
import { localizeRole } from '../../utils/localization';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Zap,
  Shield,
  ShieldCheck,
  Key,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Check,
  ExternalLink,
  X,
  Cpu
} from 'lucide-react';

export interface AuthSuccessPayload {
  email: string;
  name: string;
  role?: string;
  department?: string;
  rememberMe?: boolean;
}

interface AuthViewProps {
  onAuth: (data: AuthSuccessPayload) => void;
  initialEmail?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuth, initialEmail = '' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Design & Engineering');
  const [role, setRole] = useState('Editor');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  
  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Password Strength Calculation
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const pwdScore = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  // Handle CapsLock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Demo accounts for quick-start access
  const demoAccounts = [
    { name: 'Farhad Abdollahi', email: 'farhad.abdollahi28@gmail.com', role: 'Admin', dept: 'Enterprise AI Architecture' },
    { name: 'Sarah Chen', email: 'sarah.chen@radmehrai.com', role: 'Supervisor', dept: 'Generative Design Lab' },
    { name: 'Marcus Vance', email: 'marcus.v@studio-appliances.io', role: 'Manager', dept: 'Smart Appliances UX' },
  ];

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setName(account.name);
    setEmail(account.email);
    setRole(account.role);
    setDepartment(account.dept);
    setPassword('Enterprise#2026');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('لطفاً یک نشانی ایمیل معتبر وارد کنید.');
      return;
    }

    if (!password) {
      setError('برای ورود به فضای کاری سازمانی، رمز عبور الزامی است.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('لطفاً نام کامل خود را وارد کنید.');
        return;
      }
      if (password.length < 6) {
        setError('رمز عبور باید دست‌کم ۶ نویسه داشته باشد.');
        return;
      }
      if (confirmPassword && confirmPassword !== password) {
        setError('رمزهای عبور یکسان نیستند؛ دوباره بررسی کنید.');
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('اطلاعات ورود تأیید شد؛ در حال ایجاد نشست فضای کاری…');
      
      setTimeout(() => {
        onAuth({
          email: email.trim(),
          name: isLogin ? (name || email.split('@')[0]) : name.trim(),
          role,
          department,
          rememberMe,
        });
      }, 500);
    }, 800);
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setError('');
    setTimeout(() => {
      setBiometricScanning(false);
      setSuccessMessage('کلید زیست‌سنجی WebAuthn FIDO2 تأیید شد.');
      setTimeout(() => {
        onAuth({
          email: email || 'farhad.abdollahi28@gmail.com',
          name: name || 'Farhad Abdollahi',
          role: 'Admin',
          department: 'Enterprise AI Architecture',
          rememberMe: true,
        });
      }, 500);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Dynamic Animated Atmospheric Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-[38rem] h-[38rem] bg-gradient-to-br from-blue-600/25 to-indigo-700/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-48 -right-36 w-[44rem] h-[44rem] bg-gradient-to-tr from-cyan-600/20 via-blue-700/15 to-purple-800/15 rounded-full blur-[150px]"
        />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center z-10 px-4 sm:px-10 py-6 sm:py-10">
        
        {/* Left Side: Dynamic Generative AI Particle Morph Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* The Interactive AI Particle Morphing Canvas */}
            <ApplianceParticleMorphCanvas />

            {/* Bottom Quick-Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setShowCertificateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>$5پوشش بیمه ۵ میلیون دلاری و SOC-2 Type II</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Key className="w-3 h-3 text-blue-400" />
                  ورود سریع:
                </span>
                {demoAccounts.map((account, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDemo(account)}
                    className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {account.name.split(' ')[0]} ({localizeRole(account.role)})
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Card with Motion Transitions */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="w-full max-w-[440px]"
          >
            <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/70 shadow-2xl backdrop-blur-2xl p-7 sm:p-9 overflow-hidden">
              
              {/* Subtle top glare reflection */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-3xl" />

              <div className="relative mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-semibold text-blue-300">
                <Shield className="h-4 w-4" /> دسترسی امن به فضای کاری
              </div>

              {/* Header Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-between">
                  <span>خوش آمدید</span>
                  <Shield className="w-5 h-5 text-blue-400" />
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  برای ورود به استودیوی تولید تصاویر محصول، احراز هویت کنید.
                </p>
              </div>

              {/* Interactive Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* نام کامل & Department (Sign Up Only) */}
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="space-y-3.5 overflow-hidden"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 ml-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          نام کامل
                        </label>
                        <input
                          type="text"
                          id="input-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="برای نمونه: سارا رادمهر"
                          className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 ml-0.5">نقش</label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          >
                            <option value="Admin">مدیر</option>
                            <option value="Supervisor">سرپرست</option>
                            <option value="Manager">مدیر واحد</option>
                            <option value="Editor">ویرایشگر</option>
                            <option value="Viewer">مشاهده‌گر</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 ml-0.5">واحد سازمانی</label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="طراحی و مهندسی"
                            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 ml-0.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      نشانی ایمیل
                    </span>
                    <span className="text-[11px] text-blue-400 font-mono">آماده SSO</span>
                  </label>
                  <input
                    type="email" dir="ltr"
                    id="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                {/* Password Field with Show/Hide & CapsLock Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 ml-0.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      رمز عبور
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => alert('پیوند بازیابی رمز عبور ارسال شد به ' + (email || 'ایمیل ثبت‌شده شما'))}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                      >
                        رمز عبور را فراموش کرده‌اید؟
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-password" dir="ltr"
                      value={password}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'پنهان‌کردن رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* CapsLock Alert */}
                  {capsLockActive && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> Caps Lock روشن است
                    </p>
                  )}
                </div>

                {/* Password Strength Meter (Sign Up Only) */}
                <AnimatePresence>
                  {!isLogin && password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-1.5 space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">قدرت رمز عبور:</span>
                        <span className={`font-semibold ${
                          pwdScore <= 2 ? 'text-red-400' : pwdScore <= 4 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {pwdScore <= 2 ? 'ضعیف' : pwdScore <= 4 ? 'متوسط' : 'قوی'}
                        </span>
                      </div>

                      {/* Multi-tier animated strength bar */}
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              pwdScore >= level
                                ? pwdScore <= 2
                                  ? 'bg-red-500'
                                  : pwdScore <= 4
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Micro Checklist */}
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                        <span className={`flex items-center gap-1 ${hasLength ? 'text-emerald-400' : ''}`}>
                          <Check className={`w-3 h-3 ${hasLength ? 'opacity-100' : 'opacity-30'}`} /> حداقل ۸ نویسه
                        </span>
                        <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400' : ''}`}>
                          <Check className={`w-3 h-3 ${hasUpper ? 'opacity-100' : 'opacity-30'}`} /> حرف بزرگ انگلیسی
                        </span>
                        <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : ''}`}>
                          <Check className={`w-3 h-3 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} /> عدد (0-9)
                        </span>
                        <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : ''}`}>
                          <Check className={`w-3 h-3 ${hasSpecial ? 'opacity-100' : 'opacity-30'}`} /> نویسه ویژه
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Session Persistence (Remember Me Toggle) */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <span>مرا در این مرورگر به خاطر بسپار</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">حافظه رمزگذاری‌شده</span>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Banner */}
                <AnimatePresence>
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="submit-auth-btn"
                    disabled={isLoading || biometricScanning}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span className={`flex items-center justify-center gap-2 transition-transform duration-200 ${
                      isLoading ? 'opacity-0' : 'opacity-100'
                    }`}>
                      {isLogin ? 'ورود' : 'ایجاد حساب'}
                      <ArrowRight className="w-4 h-4 mirror-rtl group-hover:translate-x-1 transition-transform" />
                    </span>
                    {isLoading && (
                      <span className="absolute inset-0 flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-xs">در حال احراز هویت…</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Biometric & SSO Fast Access */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="text-center mb-3">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    یا ورود با
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    disabled={biometricScanning || isLoading}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer hover:border-blue-500/40 relative overflow-hidden group"
                  >
                    <Fingerprint className={`w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform ${
                      biometricScanning ? 'animate-pulse' : ''
                    }`} />
                    <span>{biometricScanning ? 'در حال اسکن…' : 'کلید عبور'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        setIsLoading(false);
                        const userMail = email || 'user@company.com';
                        onAuth({
                          email: userMail,
                          name: userMail.split('@')[0],
                          role: 'Editor',
                          department: 'Product Design',
                          rememberMe: true,
                        });
                      }, 700);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer hover:border-blue-500/40"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>گوگل</span>
                  </button>
                </div>
              </div>

              {/* Bottom Security Assurance */}
              <div className="mt-5 text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  امنیت سخت‌افزاری EAL6+ HSM • بدون نشت داده‌های تله‌متری
                </p>
              </div>

            </div>
          </motion.div>
        </div>

      </div>

      {/* Insured Security & Warranty Verification Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-200"
            >
              <button
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-5 end-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">گواهی ضمانت امنیت سایبری</h3>
                  <p className="text-xs text-slate-400 font-mono">شناسه بیمه‌نامه: RAD-AI-INS-98842-X</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between font-semibold text-white">
                    <span>پوشش بیمه‌ای</span>
                    <span className="text-emerald-400 font-mono">$5,000,000 USD</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    پوشش سندیکای Lloyd's برای نقض حریم خصوصی داده، اختلال در جداسازی پرامپت و تخطی از سیاست نگهداری صفر.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between font-semibold text-white">
                    <span>تأییدیه‌های انطباق</span>
                    <span className="text-blue-400 font-mono">SOC 2 Type II • ISO 27001</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    ممیزی دوسالانه توسط مشاوران ریسک سایبری Ernst & Young.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between font-semibold text-white">
                    <span>سیاست ورود داده به مدل</span>
                    <span className="text-purple-400 font-mono">عدم آموزش با داده مشتری</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    تصاویر کاربران، مراجع محصول و تنظیمات پرامپت هرگز در مدل‌های پایه عمومی نمایه نمی‌شوند.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">وضعیت: فعال و تأییدشده</span>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  بستن گواهی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

