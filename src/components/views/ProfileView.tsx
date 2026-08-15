import React, { useState } from 'react';
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
  userEmail?: string;
  totalAssetsCount: number;
  completedGenerations?: number;
  generationLimit?: number;
  allowUnlimited?: boolean;
  onNavigateToGovernance?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userEmail = 'farhad.abdollahi28@gmail.com',
  totalAssetsCount,
  completedGenerations = 24,
  generationLimit = 50,
  allowUnlimited = false,
  onNavigateToGovernance,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const percentageUsed = allowUnlimited ? 0 : Math.min(100, Math.round((completedGenerations / generationLimit) * 100));
  const remaining = allowUnlimited ? 999999 : Math.max(0, generationLimit - completedGenerations);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-28 md:pb-10">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            FA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#191c23]">
                Farhad Abdollahi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#1A73E8]">
                Enterprise AI Admin
              </span>
            </div>
            <p className="text-xs text-[#5F6368] font-mono mt-1">
              {userEmail}
            </p>
            <p className="text-xs text-[#727785] mt-0.5">
              Department: Enterprise AI Governance & Appliance Vision Systems
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <div className="px-4 py-2 bg-[#F8F9FD] border border-[#E0E2EC] rounded-xl text-xs text-center flex-1 md:flex-initial">
            <span className="text-[#5F6368] block">Account Status</span>
            <span className="font-semibold text-green-600 flex items-center justify-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Verified Active
            </span>
          </div>
          <div className="px-4 py-2 bg-[#F8F9FD] border border-[#E0E2EC] rounded-xl text-xs text-center flex-1 md:flex-initial">
            <span className="text-[#5F6368] block">Generation Limit</span>
            <span className="font-semibold text-[#1A73E8] mt-0.5 block font-mono">
              {allowUnlimited ? 'Unlimited' : `${generationLimit} max`}
            </span>
          </div>
        </div>
      </div>

      {/* Engine & Quota Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Completed AI Image Generation Limit & Quota Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#1A73E8]" />
              AI Image Generation Limit
            </h3>
            <span className="text-xs font-mono font-bold text-[#1A73E8]">
              {allowUnlimited ? 'Unlimited' : `${completedGenerations} / ${generationLimit} Images`}
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
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#5F6368]">
              <span>
                {allowUnlimited ? 'No Limit Active' : `${remaining} images remaining`}
              </span>
              <span>{percentageUsed}% of quota used</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-[#F8F9FD] rounded-lg border border-[#E0E2EC]">
              <span className="text-[#5F6368] text-[11px] block">Quota Cap</span>
              <span className="font-semibold text-[#191c23] font-mono">
                {allowUnlimited ? 'Unlimited' : `${generationLimit} Max Images`}
              </span>
            </div>
            <div className="p-2.5 bg-[#F8F9FD] rounded-lg border border-[#E0E2EC]">
              <span className="text-[#5F6368] text-[11px] block">Completed Generations</span>
              <span className="font-semibold text-[#191c23] font-mono">{completedGenerations} Completed</span>
            </div>
          </div>

          {onNavigateToGovernance && (
            <div className="pt-1">
              <button
                onClick={onNavigateToGovernance}
                className="w-full py-2 bg-[#F1F4F9] hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#1A73E8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Limits in Team & Governance</span>
              </button>
            </div>
          )}
        </div>

        {/* API Engine Status */}
        <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1A73E8]" />
            AI Generation Engine Status
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1A73E8] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#191c23]">Kie.ai Async Protocol</h4>
                  <p className="text-[11px] text-[#5F6368]">5-Second Active Polling & Error Recovery</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                Operational
              </span>
            </div>

            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#191c23]">Google Gemini 3.7 / Flash Image</h4>
                  <p className="text-[11px] text-[#5F6368]">Prompt Auto-Optimizer & Visual Pipeline</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                Connected
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Enterprise Security Policies */}
      <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-[#191c23] uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#1A73E8]" />
          Enterprise Security & Quota Compliance Policies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Per-User Quota Enforced</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              Every completed generation is debited against the user's allocated limit to prevent runaway GPU consumption.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>RBAC Governance</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              Admins can dynamically adjust individual limits, grant temporary bonuses, or apply workspace defaults.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Audit Telemetry</span>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              Every job generation ID and quota modification is cryptographically hashed and recorded to the audit log.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
