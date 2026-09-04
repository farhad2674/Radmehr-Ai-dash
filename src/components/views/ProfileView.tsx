import React, { useState } from 'react';
import { formatFaNumber, localizeRole } from '../../utils/localization';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Cpu, 
  Activity, 
  Zap, 
  Clock, 
  HardDrive, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Lock,
  Gauge,
  Sliders,
  Check
} from 'lucide-react';

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    role: string;
    department: string;
    initials: string;
    avatar: string;
    status: string;
    generationLimit: number;
    completedGenerations: number;
    allowUnlimited: boolean;
  };
  auditLogs: any[];
  userAssets: any[];
  onOpenGovernance: () => void;
  isAdmin?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  auditLogs,
  userAssets,
  onOpenGovernance,
  isAdmin = false,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const percentageUsed = user.allowUnlimited ? 0 : Math.min(100, Math.round((user.completedGenerations / user.generationLimit) * 100));
  const remaining = user.allowUnlimited ? 999999 : Math.max(0, user.generationLimit - user.completedGenerations);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-28 md:pb-10">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            {user.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <h2 className="text-xl font-bold text-[#191c23]">
                {user.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#1A73E8]">
                {localizeRole(user.role)}
              </span>
            </div>
            <p dir="ltr" className="mt-1 break-all text-xs text-[#5F6368] font-mono">
              {user.email}
            </p>
            <p className="text-xs text-[#727785] mt-0.5">
              واحد سازمانی: {user.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <div className="px-4 py-2 bg-[#F8F9FD] border border-[#E0E2EC] rounded-xl text-xs text-center flex-1 md:flex-initial">
            <span className="text-[#5F6368] block">وضعیت حساب</span>
            <span className="font-semibold text-green-600 flex items-center justify-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> فعال و تأییدشده
            </span>
          </div>
          <div className="px-4 py-2 bg-[#F8F9FD] border border-[#E0E2EC] rounded-xl text-xs text-center flex-1 md:flex-initial">
            <span className="text-[#5F6368] block">سقف تولید</span>
            <span className="font-semibold text-[#1A73E8] mt-0.5 block font-mono">
              {user.allowUnlimited ? 'نامحدود' : `${formatFaNumber(user.generationLimit)} max`}
            </span>
          </div>
        </div>
      </div>

      {/* Engine & Quota Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* انجام‌شده سهمیه تولید تصویر & Quota Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#1A73E8]" />
              AI Image Generation Limit
            </h3>
            <span dir="ltr" className="text-xs font-mono font-bold text-[#1A73E8]">
              {user.allowUnlimited ? 'نامحدود' : `${formatFaNumber(user.completedGenerations)} / ${formatFaNumber(user.generationLimit)} Images`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-[#E0E2EC] h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentageUsed >= 100 
                    ? 'bg-red-500' 
                    : percentageUsed >= 80 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-r from-[#1A73E8] to-[#4648d4]'
                }`}
                style={{ width: `${formatFaNumber(percentageUsed)}٪` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#5F6368]">
              <span>
                {user.allowUnlimited ? 'بدون محدودیت' : `${formatFaNumber(remaining)} تصویر باقی‌مانده`}
              </span>
              <span>{formatFaNumber(percentageUsed)}٪ از سهمیه مصرف شده</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-[#F8F9FD] rounded-lg border border-[#E0E2EC]">
              <span className="text-[#5F6368] text-[11px] block">سقف سهمیه</span>
              <span className="font-semibold text-[#191c23] font-mono">
                {user.allowUnlimited ? 'نامحدود' : `${formatFaNumber(user.generationLimit)} تصویر`}
              </span>
            </div>
            <div className="p-2.5 bg-[#F8F9FD] rounded-lg border border-[#E0E2EC]">
              <span className="text-[#5F6368] text-[11px] block">تولیدهای انجام‌شده</span>
              <span className="font-semibold text-[#191c23] font-mono">{formatFaNumber(user.completedGenerations)} انجام‌شده</span>
            </div>
          </div>

          {isAdmin && onOpenGovernance && (
            <div className="pt-1">
              <button
                onClick={onOpenGovernance}
                className="w-full py-2 bg-[#F1F4F9] hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#1A73E8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تنظیم سهمیه در بخش تیم و راهبری</span>
              </button>
            </div>
          )}
        </div>

        {/* API Engine Status */}
        <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1A73E8]" />
            وضعیت موتور تولید تصویر
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1A73E8] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#191c23]">پروتکل غیرهمگام OpenRouter</h4>
                  <p className="text-[11px] text-[#5F6368]">پایش فعال پنج‌ثانیه‌ای و بازیابی خطا</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                عملیاتی
              </span>
            </div>

            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#191c23]">Google Gemini 3.7 و Flash Image</h4>
                  <p className="text-[11px] text-[#5F6368]">بهینه‌ساز خودکار پرامپت و خط پردازش تصویر</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                متصل
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Enterprise Security Policies */}
      <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#1A73E8]" />
          سیاست‌های امنیت و انطباق سهمیه سازمانی
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>اعمال سهمیه برای هر کاربر</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              هر تولید تکمیل‌شده از سهمیه کاربر کسر می‌شود تا مصرف پردازشی کنترل شود.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>راهبری دسترسی مبتنی بر نقش</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              مدیران می‌توانند سهمیه هر کاربر، اعتبار موقت و مقدار پیش‌فرض فضای کار را تنظیم کنند.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت رویدادهای نظارتی</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              شناسه هر فرایند تولید و همه تغییرات سهمیه در گزارش رویدادها ثبت می‌شود.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
