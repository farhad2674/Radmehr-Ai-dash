import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  MoreVertical, 
  Trash2, 
  Mail, 
  UserCheck, 
  Cpu, 
  ChevronDown,
  RefreshCw,
  Gauge,
  Sliders,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Info,
  X,
  Plus,
  RotateCcw,
  Check
} from 'lucide-react';
import { PersonnelUser, AuditLogEntry, Role } from '../../types';

interface GovernanceViewProps {
  users: PersonnelUser[];
  auditLogs: AuditLogEntry[];
  defaultGenerationLimit: number;
  onInviteUser: (user: Omit<PersonnelUser, 'id' | 'lastActive'>) => void;
  onUpdateUserRole: (userId: string, newRole: Role) => void;
  onUpdateUserLimit: (userId: string, newLimit: number, allowUnlimited?: boolean) => void;
  onResetUserUsage: (userId: string) => void;
  onUpdateDefaultLimit: (newLimit: number, applyToAll?: boolean) => void;
  onBatchResetUsage: () => void;
  onDeleteUser: (userId: string) => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  users,
  auditLogs,
  defaultGenerationLimit = 50,
  onInviteUser,
  onUpdateUserRole,
  onUpdateUserLimit,
  onResetUserUsage,
  onUpdateDefaultLimit,
  onBatchResetUsage,
  onDeleteUser,
}) => {
  // Invite Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [inviteLimit, setInviteLimit] = useState<number>(defaultGenerationLimit);
  const [inviteUnlimited, setInviteUnlimited] = useState<boolean>(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [quotaFilter, setQuotaFilter] = useState<'All' | 'AtLimit' | 'NearLimit' | 'Healthy'>('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('All Events');

  // Edit User Limit Modal State
  const [editingUser, setEditingUser] = useState<PersonnelUser | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(50);
  const [tempUnlimited, setTempUnlimited] = useState<boolean>(false);

  // Global Default Limit Edit State
  const [globalLimitInput, setGlobalLimitInput] = useState<number>(defaultGenerationLimit);
  const [showGlobalLimitSuccess, setShowGlobalLimitSuccess] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    onInviteUser({
      name: fullName,
      email,
      role,
      status: 'Active',
      avatar: '',
      initials: fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      department: 'AI Operations',
      generationLimit: inviteUnlimited ? 999999 : Number(inviteLimit) || 50,
      completedGenerations: 0,
      allowUnlimited: inviteUnlimited,
    });

    setFullName('');
    setEmail('');
    setRole('Editor');
    setInviteLimit(defaultGenerationLimit);
    setInviteUnlimited(false);
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 2500);
  };

  const handleOpenEditLimit = (user: PersonnelUser) => {
    setEditingUser(user);
    setTempLimit(user.generationLimit);
    setTempUnlimited(!!user.allowUnlimited);
  };

  const handleSaveEditLimit = () => {
    if (!editingUser) return;
    onUpdateUserLimit(editingUser.id, Number(tempLimit) || 50, tempUnlimited);
    setEditingUser(null);
  };

  const handleApplyGlobalLimit = (applyToAll: boolean) => {
    onUpdateDefaultLimit(Number(globalLimitInput) || 50, applyToAll);
    setShowGlobalLimitSuccess(true);
    setTimeout(() => setShowGlobalLimitSuccess(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,User,Type,Action,Details,Units\n';
    const rows = auditLogs
      .map(
        (log) =>
          `"${log.id}","${log.timestamp}","${log.user}","${log.type}","${log.action}","${log.details.replace(/"/g, '""')}","${log.units || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_audit_logs_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Quota Metrics Calculations
  const totalCompletedGenerations = users.reduce((acc, u) => acc + (u.completedGenerations || 0), 0);
  const totalAllocatedLimit = users.reduce((acc, u) => acc + (u.allowUnlimited ? 0 : (u.generationLimit || 0)), 0);
  const usersAtLimitCount = users.filter((u) => !u.allowUnlimited && u.completedGenerations >= u.generationLimit).length;
  const usersNearLimitCount = users.filter((u) => !u.allowUnlimited && u.completedGenerations < u.generationLimit && (u.completedGenerations / u.generationLimit) >= 0.8).length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (quotaFilter === 'AtLimit') {
      return !u.allowUnlimited && u.completedGenerations >= u.generationLimit;
    }
    if (quotaFilter === 'NearLimit') {
      return !u.allowUnlimited && u.completedGenerations < u.generationLimit && (u.completedGenerations / u.generationLimit) >= 0.8;
    }
    if (quotaFilter === 'Healthy') {
      return u.allowUnlimited || (u.completedGenerations / u.generationLimit) < 0.8;
    }
    return true;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesFilter = auditFilter === 'All Events' || log.type === auditFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-28 md:pb-10">
      
      {/* Top Header */}
      <div className="border-b border-[#E0E2EC] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#191c23] flex items-center gap-3">
            Team & Governance
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-[#1A73E8] font-mono font-semibold border border-blue-100">
              Limit Control: {defaultGenerationLimit} / user
            </span>
          </h2>
          <p className="text-sm text-[#5F6368] mt-1">
            Manage user roles, set and enforce completed AI image generation limits, monitor telemetry, and audit access.
          </p>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-[#F8F9FD] border border-[#DADCE0] text-[#414754] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Reset Completed Counts for All Users"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>Reset All Quotas</span>
          </button>
        </div>
      </div>

      {/* AI Image Generation Limit Policy & Metrics Banner */}
      <div className="bg-gradient-to-br from-white to-[#F8F9FD] rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E0E2EC]">
          
          {/* Policy Headline */}
          <div className="flex items-start gap-3.5 max-w-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#1A73E8] flex items-center justify-center shrink-0 shadow-xs">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#191c23]">
                  AI Image Generation Limit Policy
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider">
                  Enforcement Active
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-1 leading-relaxed">
                Control the maximum number of completed AI images each team member can generate. When a user reaches their quota (e.g. 50/50), new image requests are locked until increased or reset.
              </p>
            </div>
          </div>

          {/* Global Default Limit Configuration */}
          <div className="bg-white p-4 rounded-xl border border-[#DADCE0] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                Default User Limit
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={globalLimitInput}
                  onChange={(e) => setGlobalLimitInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-lg text-sm font-bold text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
                <span className="text-xs text-[#5F6368] font-medium">images / user</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#E0E2EC] sm:pl-3">
              <button
                type="button"
                onClick={() => handleApplyGlobalLimit(false)}
                className="px-3 py-2 bg-[#F1F4F9] hover:bg-[#E0E2EC] text-[#191c23] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Sets default for future invites only"
              >
                Set for New Users
              </button>
              <button
                type="button"
                onClick={() => handleApplyGlobalLimit(true)}
                className="px-3.5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Applies this limit to all existing users and future invites"
              >
                Apply to All ({globalLimitInput})
              </button>
            </div>
          </div>
        </div>

        {showGlobalLimitSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>Workspace default image generation limit updated to {globalLimitInput} per user!</span>
          </div>
        )}

        {/* Quota Telemetry Metrics 4-Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-[#DADCE0] shadow-2xs">
            <span className="text-[11px] text-[#5F6368] font-medium block">Total Completed Images</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#191c23]">{totalCompletedGenerations}</span>
              <span className="text-xs text-[#5F6368] font-mono">/ {totalAllocatedLimit}</span>
            </div>
            <div className="w-full bg-[#E0E2EC] h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-[#1A73E8] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((totalCompletedGenerations / Math.max(1, totalAllocatedLimit)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DADCE0] shadow-2xs">
            <span className="text-[11px] text-[#5F6368] font-medium block">Standard Limit per User</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono text-[#1A73E8]">{defaultGenerationLimit}</span>
              <span className="text-xs text-[#5F6368]">Generations</span>
            </div>
            <span className="text-[11px] text-green-600 font-medium block mt-1.5">✓ Configurable</span>
          </div>

          <div className={`p-4 bg-white rounded-xl border shadow-2xs ${usersAtLimitCount > 0 ? 'border-red-300 bg-red-50/30' : 'border-[#DADCE0]'}`}>
            <span className="text-[11px] text-[#5F6368] font-medium block">Users at Quota Limit (100%)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-bold font-mono ${usersAtLimitCount > 0 ? 'text-red-600' : 'text-[#191c23]'}`}>
                {usersAtLimitCount}
              </span>
              <span className="text-xs text-[#5F6368]">Users Locked</span>
            </div>
            <span className="text-[11px] text-[#727785] block mt-1.5">
              {usersAtLimitCount > 0 ? 'Requires limit boost/reset' : 'All users active'}
            </span>
          </div>

          <div className={`p-4 bg-white rounded-xl border shadow-2xs ${usersNearLimitCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-[#DADCE0]'}`}>
            <span className="text-[11px] text-[#5F6368] font-medium block">Near Limit Alert (&gt;80%)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-bold font-mono ${usersNearLimitCount > 0 ? 'text-amber-600' : 'text-[#191c23]'}`}>
                {usersNearLimitCount}
              </span>
              <span className="text-xs text-[#5F6368]">Users</span>
            </div>
            <span className="text-[11px] text-[#727785] block mt-1.5">High AI usage rate</span>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Invite New User + Active Personnel Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Card: Invite New User (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2F8]">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191c23]">
                  Invite New User
                </h3>
                <p className="text-[11px] text-[#5F6368]">Assign RBAC role & initial generation limit</p>
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#5F6368] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Elena Carter"
                  className="w-full px-4 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-sm text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5F6368] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena.c@radmehrai.com"
                  className="w-full px-4 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-sm text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1.5">
                    Governance Role
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full appearance-none px-3.5 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-xs font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all cursor-pointer pr-8"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#727785] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1.5">
                    AI Generation Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    disabled={inviteUnlimited}
                    value={inviteUnlimited ? '' : inviteLimit}
                    onChange={(e) => setInviteLimit(parseInt(e.target.value) || 50)}
                    placeholder={inviteUnlimited ? 'Unlimited' : '50'}
                    className="w-full px-3.5 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-xs font-bold text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="invite-unlimited"
                  checked={inviteUnlimited}
                  onChange={(e) => setInviteUnlimited(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1A73E8] focus:ring-[#1A73E8] border-[#DADCE0] cursor-pointer"
                />
                <label htmlFor="invite-unlimited" className="text-xs text-[#414754] font-medium cursor-pointer">
                  Grant Unlimited Image Generations
                </label>
              </div>

              {inviteSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                  <span>Invitation sent with {inviteUnlimited ? 'Unlimited' : `${inviteLimit} images`} limit to {email}!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFullName('');
                    setEmail('');
                    setInviteLimit(defaultGenerationLimit);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:text-[#191c23] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.99] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </button>
              </div>
            </form>
          </div>

          <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] text-[11px] text-[#5F6368] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1A73E8] shrink-0" />
            <span>Generation usage is automatically tracked and increments upon every completed image task.</span>
          </div>
        </div>

        {/* Right Card: Active Personnel Directory (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F2F8]">
            <div>
              <h3 className="font-bold text-base text-[#191c23] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1A73E8]" />
                Personnel & Limit Management
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#1A73E8] font-mono">
                  {users.length} members
                </span>
              </h3>
            </div>

            {/* Search and Quota filter */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-[#F1F4F9] border border-[#DADCE0] rounded-full text-xs text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>

              <select
                value={quotaFilter}
                onChange={(e) => setQuotaFilter(e.target.value as any)}
                className="px-2.5 py-1 bg-[#F1F4F9] border border-[#DADCE0] rounded-full text-xs font-medium text-[#414754] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] cursor-pointer"
              >
                <option value="All">All Quotas</option>
                <option value="AtLimit">At Limit (100%)</option>
                <option value="NearLimit">Near Limit (&gt;80%)</option>
                <option value="Healthy">Healthy (&lt;80%)</option>
              </select>
            </div>
          </div>

          {/* User Rows List */}
          <div className="divide-y divide-[#F0F2F8] max-h-[460px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#727785]">
                No users match the selected search or quota filter.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isUnlimited = !!u.allowUnlimited;
                const completed = u.completedGenerations || 0;
                const limit = u.generationLimit || defaultGenerationLimit;
                const percentage = isUnlimited ? 0 : Math.min(100, Math.round((completed / limit) * 100));
                const isAtLimit = !isUnlimited && completed >= limit;
                const isNearLimit = !isUnlimited && !isAtLimit && percentage >= 80;

                return (
                  <div
                    key={u.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F9FD] px-2.5 rounded-xl transition-colors"
                  >
                    {/* User Profile */}
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#DADCE0] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1A73E8] font-bold text-xs flex items-center justify-center shrink-0">
                          {u.initials || u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#191c23] truncate">
                            {u.name}
                          </p>
                          {isAtLimit && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                              Limit Reached
                            </span>
                          )}
                          {isNearLimit && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                              Near Limit
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#727785] truncate font-mono">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    {/* Quota Progress & Limit Control */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end">
                      
                      {/* Quota Visual Badge */}
                      <div className="min-w-[130px] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#5F6368] font-medium">Images:</span>
                          <span className="font-mono font-bold text-[#191c23]">
                            {isUnlimited ? (
                              <span className="text-[#1A73E8]">Unlimited</span>
                            ) : (
                              <span className={isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-[#191c23]'}>
                                {completed} / {limit}
                              </span>
                            )}
                          </span>
                        </div>

                        {!isUnlimited && (
                          <div className="w-full bg-[#E0E2EC] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isAtLimit 
                                  ? 'bg-red-500' 
                                  : isNearLimit 
                                  ? 'bg-amber-500' 
                                  : 'bg-[#1A73E8]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Role Selector */}
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value as Role)}
                        className="px-2 py-1 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#191c23] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] cursor-pointer shadow-2xs"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Manager">Manager</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      {/* Direct Limit Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Edit Limit Button */}
                        <button
                          onClick={() => handleOpenEditLimit(u)}
                          className="px-2.5 py-1 bg-white hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#1A73E8] rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                          title="Manage user limit (e.g. increase or decrease limit)"
                        >
                          Edit Limit
                        </button>

                        {/* Reset Count Button */}
                        <button
                          onClick={() => onResetUserUsage(u.id)}
                          className="p-1.5 text-[#727785] hover:text-[#1A73E8] hover:bg-[#F1F4F9] rounded-lg transition-colors cursor-pointer"
                          title="Reset completed count to 0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete user */}
                        {u.id !== 'user-farhad' && (
                          <button
                            onClick={() => onDeleteUser(u.id)}
                            className="p-1.5 text-[#727785] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Single User Limit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADCE0] w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[#E0E2EC] flex items-center justify-between bg-[#F8F9FD]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1A73E8] flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191c23]">
                    Manage AI Image Limit
                  </h3>
                  <p className="text-xs text-[#5F6368]">{editingUser.name} ({editingUser.email})</p>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-[#727785] hover:bg-[#E0E2EC] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Current Status Box */}
              <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-[#E0E2EC] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#5F6368] block">Current Completed</span>
                  <span className="font-bold text-base font-mono text-[#191c23]">
                    {editingUser.completedGenerations} Images
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetUserUsage(editingUser.id);
                    setEditingUser({ ...editingUser, completedGenerations: 0 });
                  }}
                  className="px-3 py-1.5 bg-white border border-[#DADCE0] hover:bg-gray-50 text-[#1A73E8] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to 0
                </button>
              </div>

              {/* Limit Input */}
              <div>
                <label className="block text-xs font-semibold text-[#414754] uppercase tracking-wider mb-2">
                  Completed Generation Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  disabled={tempUnlimited}
                  value={tempUnlimited ? '' : tempLimit}
                  onChange={(e) => setTempLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder={tempUnlimited ? 'Unlimited' : '50'}
                  className="w-full px-4 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-base font-bold text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] text-[#5F6368] font-medium mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 75, 100, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setTempLimit(preset);
                        setTempUnlimited(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !tempUnlimited && tempLimit === preset
                          ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8]'
                          : 'bg-white border-[#DADCE0] text-[#5F6368] hover:bg-gray-50'
                      }`}
                    >
                      {preset} images
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTempLimit(tempLimit + 25);
                      setTempUnlimited(false);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all cursor-pointer"
                  >
                    +25 Bonus
                  </button>
                </div>
              </div>

              {/* Unlimited Toggle */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#F0F2F8]">
                <input
                  type="checkbox"
                  id="modal-unlimited"
                  checked={tempUnlimited}
                  onChange={(e) => setTempUnlimited(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1A73E8] focus:ring-[#1A73E8] border-[#DADCE0] cursor-pointer"
                />
                <label htmlFor="modal-unlimited" className="text-xs text-[#414754] font-medium cursor-pointer">
                  Allow Unlimited Image Generations (No Quota Cap)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:text-[#191c23] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditLimit}
                  className="px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Save Limit Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Batch Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADCE0] w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-base text-[#191c23]">
                Reset Quotas for All Users?
              </h3>
              <p className="text-xs text-[#5F6368] mt-1.5 leading-relaxed">
                This will reset the completed AI generation count back to 0 for all {users.length} team members. Limits will remain unchanged.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:text-[#191c23] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onBatchResetUsage();
                  setShowResetConfirmModal(false);
                }}
                className="px-6 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Confirm Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: System Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-soft space-y-4">
        
        {/* Audit Log Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F0F2F8]">
          <div>
            <h3 className="font-bold text-base text-[#191c23] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1A73E8]" />
              System Audit Log
            </h3>
            <p className="text-xs text-[#5F6368]">
              Immutable telemetry for AI model calls, quota limit adjustments, and sync operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-lg text-xs font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs"
              >
                <option value="All Events">All Events</option>
                <option value="Generated Image">Generated Image</option>
                <option value="Limit Modified">Limit Modified</option>
                <option value="Quota Reset">Quota Reset</option>
                <option value="Role Changed">Role Changed</option>
                <option value="Sync">Sync</option>
                <option value="Model Update">Model Update</option>
                <option value="Security Block">Security Block</option>
                <option value="Template Saved">Template Saved</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#727785] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white border border-[#DADCE0] hover:bg-[#F1F4F9] text-[#191c23] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0F2F8] text-[#5F6368] font-semibold">
                <th className="pb-3 px-2">Time</th>
                <th className="pb-3 px-2">User / Principal</th>
                <th className="pb-3 px-2">Action Type</th>
                <th className="pb-3 px-2">Details</th>
                <th className="pb-3 px-2 text-right">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F8]">
              {filteredAuditLogs.map((log) => {
                let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                if (log.type === 'Security Block') {
                  badgeStyle = 'bg-red-50 text-red-700 border-red-200';
                } else if (log.type === 'Role Changed' || log.type === 'Limit Modified') {
                  badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (log.type === 'Sync' || log.type === 'Template Saved' || log.type === 'Quota Reset') {
                  badgeStyle = 'bg-green-50 text-green-700 border-green-200';
                }

                return (
                  <tr key={log.id} className="hover:bg-[#F8F9FD] transition-colors">
                    <td className="py-3 px-2 font-mono text-[#5F6368] whitespace-nowrap">
                      {log.time}
                    </td>
                    <td className="py-3 px-2 font-medium text-[#191c23] whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[#414754] font-mono text-[11px]">
                      {log.details}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-[#191c23]">
                      {log.units || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-2 flex items-center justify-between text-xs text-[#727785]">
          <span>Showing {filteredAuditLogs.length} recent governance events</span>
          <button
            onClick={() => alert('All recent audit logs are synchronized in real-time with Cloud Logging.')}
            className="text-[#1A73E8] hover:underline font-medium cursor-pointer"
          >
            Load More Activity
          </button>
        </div>
      </div>

    </div>
  );
};
