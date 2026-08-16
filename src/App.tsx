import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNavigation } from './components/MobileNavigation';
import { StudioModal } from './components/StudioModal';
import { WorkspaceView } from './components/views/WorkspaceView';
import { TemplateBuilderView } from './components/views/TemplateBuilderView';
import { ExploreFeedView } from './components/views/ExploreFeedView';
import { AuthView } from './components/views/AuthView';
import { GovernanceView } from './components/views/GovernanceView';
import { ProfileView } from './components/views/ProfileView';

import { 
  INITIAL_TEMPLATES, 
  INITIAL_ASSETS, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { 
  ApplianceTemplate, 
  GeneratedAsset, 
  PersonnelUser, 
  AuditLogEntry, 
  Role 
} from './types';
import { storageService, StorageStats } from './services/storageService';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('workspace');
  
  // Core Application State
  const [templates, setTemplates] = useState<ApplianceTemplate[]>(INITIAL_TEMPLATES);
  const [assets, setAssets] = useState<GeneratedAsset[]>(INITIAL_ASSETS);
  const [users, setUsers] = useState<PersonnelUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [defaultGenerationLimit, setDefaultGenerationLimit] = useState<number>(50);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // Modal & Builder State
  const [activeStudioTemplate, setActiveStudioTemplate] = useState<ApplianceTemplate | null>(null);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState<boolean>(false);
  const [builderTemplate, setBuilderTemplate] = useState<ApplianceTemplate | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Authentication State with browser cache verification
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const localAuth = localStorage.getItem('isAuthenticated');
    const sessionAuth = sessionStorage.getItem('isAuthenticated');
    return localAuth === 'true' || sessionAuth === 'true';
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail') || '';
  });

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem('currentUserName') || sessionStorage.getItem('currentUserName') || '';
  });

  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    return localStorage.getItem('currentUserRole') || sessionStorage.getItem('currentUserRole') || 'Viewer';
  });

  const [currentUserDepartment, setCurrentUserDepartment] = useState<string>(() => {
    return localStorage.getItem('currentUserDepartment') || sessionStorage.getItem('currentUserDepartment') || 'Design & Engineering';
  });

  const handleAuth = (data: { email: string; name?: string; role?: string; department?: string; rememberMe?: boolean }) => {
    const email = data.email.trim();
    // Resolve user details
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const assignedRole = (data.role || existingUser?.role || (email.toLowerCase().includes('farhad') ? 'Admin' : 'Editor')) as Role;
    const assignedName = data.name?.trim() || existingUser?.name || email.split('@')[0];
    const assignedDept = data.department?.trim() || existingUser?.department || 'Enterprise AI Architecture';

    setCurrentUserEmail(email);
    setCurrentUserName(assignedName);
    setCurrentUserRole(assignedRole);
    setCurrentUserDepartment(assignedDept);

    const storage = data.rememberMe !== false ? localStorage : sessionStorage;
    storage.setItem('isAuthenticated', 'true');
    storage.setItem('currentUserEmail', email);
    storage.setItem('currentUserName', assignedName);
    storage.setItem('currentUserRole', assignedRole);
    storage.setItem('currentUserDepartment', assignedDept);

    if (data.rememberMe !== false) {
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('currentUserEmail');
      sessionStorage.removeItem('currentUserName');
      sessionStorage.removeItem('currentUserRole');
      sessionStorage.removeItem('currentUserDepartment');
    }

    // Ensure user exists in personnel users list
    setUsers((prev) => {
      const match = prev.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        return prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, name: assignedName, role: assignedRole, lastActive: 'Just now' }
            : u
        );
      } else {
        const newUser: PersonnelUser = {
          id: `user-${Date.now()}`,
          name: assignedName,
          email: email,
          role: assignedRole,
          department: assignedDept,
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          generationLimit: defaultGenerationLimit,
          completedGenerations: 0,
          allowUnlimited: assignedRole === 'Admin',
          lastActive: 'Just now',
        };
        storageService.saveUser(newUser);
        return [newUser, ...prev];
      }
    });

    // Record enterprise audit log entry
    const authLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: `${assignedName} (${assignedRole})`,
      action: 'User Authenticated',
      type: 'Role Changed',
      details: `Session verified for ${email} (${assignedRole} in ${assignedDept}). Insured SOC-2 session active.`,
      units: '-',
    };
    setAuditLogs((prev) => [authLog, ...prev]);
    storageService.addAuditLog(authLog);

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('currentUserDepartment');

    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('currentUserName');
    sessionStorage.removeItem('currentUserRole');
    sessionStorage.removeItem('currentUserDepartment');

    setCurrentUserEmail('');
    setCurrentUserName('');
    setCurrentUserRole('Viewer');
    setCurrentUserDepartment('Design & Engineering');
    setCurrentView('workspace');
  };

  // Fetch initial data from local server disk database (or localStorage fallback)
  useEffect(() => {
    async function loadData() {
      try {
        const payload = await storageService.initStorage();
        if (payload.templates) setTemplates(payload.templates);
        if (payload.assets) setAssets(payload.assets);
        if (payload.users) setUsers(payload.users);
        if (payload.auditLogs) setAuditLogs(payload.auditLogs);
        if (payload.settings?.defaultLimit) setDefaultGenerationLimit(payload.settings.defaultLimit);
        if (payload.stats) setStorageStats(payload.stats);
      } catch (err) {
        console.warn('Initial storage load fallback notice:', err);
      }
    }
    loadData();
  }, []);

  // Find active current user record
  const currentPersonnelUser = users.find(
    (u) => u.email.toLowerCase() === currentUserEmail.toLowerCase()
  ) || {
    id: 'current-user-session',
    name: currentUserName || 'Workspace Member',
    email: currentUserEmail || 'user@company.com',
    role: (currentUserRole as Role) || 'Viewer',
    department: currentUserDepartment || 'Design & Engineering',
    status: 'Active' as const,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    generationLimit: defaultGenerationLimit,
    completedGenerations: 0,
    allowUnlimited: currentUserRole === 'Admin',
    lastActive: 'Just now',
  };
  const currentUserLimit = currentPersonnelUser?.generationLimit || defaultGenerationLimit;
  const currentUserCompleted = currentPersonnelUser?.completedGenerations || 0;
  const currentUserUnlimited = !!currentPersonnelUser?.allowUnlimited;

  // Unauthenticated Guard: Display Enterprise Auth Screen if not logged in
  if (!isAuthenticated) {
    return (
      <AuthView
        onAuth={handleAuth}
        initialEmail={currentUserEmail}
      />
    );
  }

  const handleSelectTemplate = (template: ApplianceTemplate) => {
    setActiveStudioTemplate(template);
    setIsStudioModalOpen(true);
  };

  // Handle creating new template
  const handleOpenNewTemplate = () => {
    setBuilderTemplate(null);
    setCurrentView('builder');
    setMobileSidebarOpen(false);
  };

  // Handle editing existing template (Admin)
  const handleEditTemplate = (template: ApplianceTemplate) => {
    setBuilderTemplate(template);
    setCurrentView('builder');
    setMobileSidebarOpen(false);
  };

  // Handle deleting template (Admin)
  const handleDeleteTemplate = async (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    storageService.deleteTemplate(templateId);

    if (target) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        user: 'Farhad Abdollahi (Admin)',
        action: 'Template Deleted',
        type: 'Template Deleted' as any,
        details: `Deleted template "${target.name}" (${target.category} / ${target.model}).`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      storageService.addAuditLog(newLog);
    }
  };

  // Handle saving template from Builder (writes to Server Disk JSON DB)
  const handleSaveTemplate = async (savedTemplate: ApplianceTemplate) => {
    const isExisting = templates.some((t) => t.id === savedTemplate.id);

    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === savedTemplate.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t));
      }
      return [savedTemplate, ...prev];
    });

    // Write to server disk
    storageService.saveTemplate(savedTemplate);

    // Log to audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi (Admin)',
      action: isExisting ? 'Template Modified' : 'Template Created',
      type: isExisting ? ('Template Modified' as any) : 'Template Saved',
      details: isExisting
        ? `Updated template "${savedTemplate.name}" (Model: ${savedTemplate.model}, Mode: ${savedTemplate.variableMode}).`
        : `Created new template "${savedTemplate.name}" configured with model ${savedTemplate.model}.`,
      units: '-',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    storageService.addAuditLog(newLog);

    setBuilderTemplate(null);
    setCurrentView('workspace');
  };

  // Handle newly generated visual asset from Studio Modal and increment user quota
  const handleAssetGenerated = async (newAsset: GeneratedAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    storageService.saveAsset(newAsset);

    // Increment completedGenerations for current user
    setUsers((prev) =>
      prev.map((u) => {
        if (u.email === currentUserEmail || u.id === currentPersonnelUser?.id) {
          const nextCount = (u.completedGenerations || 0) + 1;
          return {
            ...u,
            completedGenerations: nextCount,
            lastActive: 'Just now',
          };
        }
        return u;
      })
    );
    storageService.incrementUserUsage(currentUserEmail);

    // Add corresponding audit log with telemetry
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: currentUserName,
      action: 'Generated Image',
      type: 'Generated Image',
      details: `Prompt: "${newAsset.prompt.slice(0, 45)}..." Model: ${newAsset.model} (Quota: ${currentUserCompleted + 1}/${currentUserLimit})`,
      units: 24,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    storageService.addAuditLog(newLog);
  };

  // Update specific user's generation limit
  const handleUpdateUserLimit = (userId: string, newLimit: number, allowUnlimited?: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, generationLimit: newLimit, allowUnlimited: !!allowUnlimited }
          : u
      )
    );
    storageService.updateUserLimit(userId, newLimit, allowUnlimited);

    if (targetUser) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        user: 'Farhad Abdollahi (Admin)',
        action: 'Limit Modified',
        type: 'Limit Modified',
        details: `Updated AI generation limit for ${targetUser.name} to ${allowUnlimited ? 'Unlimited' : `${newLimit} images`}.`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      storageService.addAuditLog(newLog);
    }
  };

  // Reset specific user's completed generation count to 0
  const handleResetUserUsage = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, completedGenerations: 0 } : u))
    );
    storageService.resetUserUsage(userId);

    if (targetUser) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        user: 'Farhad Abdollahi (Admin)',
        action: 'Quota Reset',
        type: 'Quota Reset',
        details: `Reset completed image generations count to 0 for ${targetUser.name}.`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      storageService.addAuditLog(newLog);
    }
  };

  // Update default limit across workspace & optionally apply to all users
  const handleUpdateDefaultLimit = (newLimit: number, applyToAll?: boolean) => {
    setDefaultGenerationLimit(newLimit);

    if (applyToAll) {
      setUsers((prev) =>
        prev.map((u) =>
          u.allowUnlimited ? u : { ...u, generationLimit: newLimit }
        )
      );
    }

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi (Admin)',
      action: 'Limit Modified',
      type: 'Limit Modified',
      details: `Set workspace default AI image generation limit to ${newLimit} per user${applyToAll ? ' (Applied to all existing members)' : ''}.`,
      units: '-',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    storageService.addAuditLog(newLog);
  };

  // Batch reset completed count for all users
  const handleBatchResetUsage = () => {
    setUsers((prev) => prev.map((u) => ({ ...u, completedGenerations: 0 })));
    storageService.resetAllUsage();

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi (Admin)',
      action: 'Quota Reset',
      type: 'Quota Reset',
      details: `Batch reset completed generations count to 0 for all ${users.length} active workspace members.`,
      units: '-',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    storageService.addAuditLog(newLog);
  };

  // Export full JSON backup
  const handleExportBackup = async () => {
    const backup = await storageService.exportBackup();
    if (backup) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `parspack_radmehrai_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // Import full JSON backup
  const handleImportBackup = async (backupData: any) => {
    const success = await storageService.importBackup(backupData);
    if (success) {
      const payload = await storageService.initStorage();
      if (payload.templates) setTemplates(payload.templates);
      if (payload.assets) setAssets(payload.assets);
      if (payload.users) setUsers(payload.users);
      if (payload.auditLogs) setAuditLogs(payload.auditLogs);
    }
  };

  // Toggle bookmark on asset
  const handleBookmarkToggle = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, bookmarked: !a.bookmarked } : a))
    );
  };

  // Select template by ID from Explore Feed
  const handleSelectTemplateById = (templateId: string) => {
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setActiveStudioTemplate(found);
      setIsStudioModalOpen(true);
    } else {
      setCurrentView('workspace');
    }
  };

  // Invite new user
  const handleInviteUser = (newUser: Omit<PersonnelUser, 'id' | 'lastActive'>) => {
    const userWithId: PersonnelUser = {
      ...newUser,
      id: `user-${Date.now()}`,
      lastActive: 'Just invited',
    };
    setUsers((prev) => [userWithId, ...prev]);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi',
      action: 'Role Modified',
      type: 'Role Changed',
      details: `Invited user ${newUser.name} (${newUser.email}) with role ${newUser.role} & limit ${newUser.generationLimit}.`,
      units: '-',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    storageService.addAuditLog(newLog);
  };

  // Update user role
  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (targetUser) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        user: 'Farhad Abdollahi',
        action: 'Role Modified',
        type: 'Role Changed',
        details: `Modified role for ${targetUser.name} to ${newRole}.`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      storageService.addAuditLog(newLog);
    }
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (targetUser) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        user: 'Farhad Abdollahi',
        action: 'User Deleted',
        type: 'Role Changed',
        details: `Removed user ${targetUser.name} (${targetUser.email}) from workspace.`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      storageService.addAuditLog(newLog);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFCF6] text-[#191c23] antialiased selection:bg-[#1A73E8] selection:text-white font-sans">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        userName={currentUserName}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'builder') setBuilderTemplate(null);
        }}
        onNewTemplate={handleOpenNewTemplate}
        workspaceName="RadmehrAI Studio"
      />

      {/* Main App Workspace Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          currentView={currentView}
          onLogout={handleLogout}
          onNavigate={(view) => setCurrentView(view)}
          user={{
            name: currentUserName,
            email: currentUserEmail,
            role: currentUserRole,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          }}
          userLimit={currentUserLimit}
          userCompleted={currentUserCompleted}
          userUnlimited={currentUserUnlimited}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onNewTemplate={handleOpenNewTemplate}
          onOpenGovernance={() => setCurrentView('governance')}
        />

        {/* Dynamic View Router */}
        <main className="flex-1">
          {currentView === 'workspace' && (
            <WorkspaceView
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
              onCreateNewTemplate={handleOpenNewTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              userEmail={currentUserEmail}
              completedGenerations={currentUserCompleted}
              generationLimit={currentUserLimit}
              allowUnlimited={currentUserUnlimited}
              onNavigateToGovernance={() => setCurrentView('governance')}
            />
          )}

          {currentView === 'builder' && (
            <TemplateBuilderView
              initialTemplate={builderTemplate}
              onSaveTemplate={handleSaveTemplate}
              onCancel={() => {
                setBuilderTemplate(null);
                setCurrentView('workspace');
              }}
            />
          )}

          {currentView === 'explore' && (
            <ExploreFeedView
              assets={assets}
              onSelectTemplate={handleSelectTemplateById}
              onBookmarkToggle={handleBookmarkToggle}
            />
          )}

          {currentView === 'governance' && (
            <GovernanceView
              users={users}
              auditLogs={auditLogs}
              defaultGenerationLimit={defaultGenerationLimit}
              storageStats={storageStats}
              onInviteUser={handleInviteUser}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateUserLimit={handleUpdateUserLimit}
              onResetUserUsage={handleResetUserUsage}
              onUpdateDefaultLimit={handleUpdateDefaultLimit}
              onBatchResetUsage={handleBatchResetUsage}
              onDeleteUser={handleDeleteUser}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView
              user={{
                name: currentUserName,
                email: currentUserEmail,
                role: currentUserRole,
                department: 'Enterprise AI Architecture',
                initials: currentUserName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                status: 'Active',
                generationLimit: currentUserLimit,
                completedGenerations: currentUserCompleted,
                allowUnlimited: currentUserUnlimited,
              }}
              auditLogs={auditLogs.filter((l) => l.user === currentUserName)}
              userAssets={assets.filter((a) => a.creator.email === currentUserEmail)}
              onOpenGovernance={() => setCurrentView('governance')}
            />
          )}
        </main>
      </div>

      {/* Generation Studio Modal Dialog */}
      <StudioModal
        template={activeStudioTemplate}
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        onAssetGenerated={handleAssetGenerated}
        onEditTemplate={handleEditTemplate}
        userGenerationLimit={currentUserLimit}
        userCompletedGenerations={currentUserCompleted}
        userAllowUnlimited={currentUserUnlimited}
        onOpenGovernance={() => {
          setIsStudioModalOpen(false);
          setCurrentView('governance');
        }}
      />

      {/* Mobile Navigation Drawer / Tab Bar */}
      <MobileNavigation
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'builder') setBuilderTemplate(null);
        }}
        onNewTemplate={handleOpenNewTemplate}
      />
    </div>
  );
}
