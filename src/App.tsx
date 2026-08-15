import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNavigation } from './components/MobileNavigation';
import { StudioModal } from './components/StudioModal';
import { WorkspaceView } from './components/views/WorkspaceView';
import { TemplateBuilderView } from './components/views/TemplateBuilderView';
import { ExploreFeedView } from './components/views/ExploreFeedView';
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

export default function App() {
  const [currentView, setCurrentView] = useState<string>('workspace');
  
  // Core Application State
  const [templates, setTemplates] = useState<ApplianceTemplate[]>(INITIAL_TEMPLATES);
  const [assets, setAssets] = useState<GeneratedAsset[]>(INITIAL_ASSETS);
  const [users, setUsers] = useState<PersonnelUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [defaultGenerationLimit, setDefaultGenerationLimit] = useState<number>(50);

  // Modal & Builder State
  const [activeStudioTemplate, setActiveStudioTemplate] = useState<ApplianceTemplate | null>(null);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState<boolean>(false);
  const [builderTemplate, setBuilderTemplate] = useState<ApplianceTemplate | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const currentUserEmail = 'farhad.abdollahi28@gmail.com';
  const currentUserRole = 'Enterprise AI Admin';

  // Find active current user record
  const currentPersonnelUser = users.find((u) => u.email === currentUserEmail) || users[0];
  const currentUserLimit = currentPersonnelUser?.generationLimit || defaultGenerationLimit;
  const currentUserCompleted = currentPersonnelUser?.completedGenerations || 0;
  const currentUserUnlimited = !!currentPersonnelUser?.allowUnlimited;

  // Handle template selection to open Generation Studio Modal
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

  // Handle saving template from Builder
  const handleSaveTemplate = (savedTemplate: ApplianceTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === savedTemplate.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t));
      }
      return [savedTemplate, ...prev];
    });

    // Log to audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi',
      action: 'Template Saved',
      type: 'Template Saved',
      details: `Template "${savedTemplate.name}" configured with model ${savedTemplate.model}.`,
      units: '-',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    setCurrentView('workspace');
  };

  // Handle newly generated visual asset from Studio Modal and increment user quota
  const handleAssetGenerated = (newAsset: GeneratedAsset) => {
    setAssets((prev) => [newAsset, ...prev]);

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

    // Add corresponding audit log with telemetry
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: 'Farhad Abdollahi',
      action: 'Generated Image',
      type: 'Generated Image',
      details: `Prompt: "${newAsset.prompt.slice(0, 45)}..." Model: ${newAsset.model} (Quota: ${currentUserCompleted + 1}/${currentUserLimit})`,
      units: 24,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
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
    }
  };

  // Reset specific user's completed generation count to 0
  const handleResetUserUsage = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, completedGenerations: 0 } : u))
    );

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
  };

  // Batch reset completed count for all users
  const handleBatchResetUsage = () => {
    setUsers((prev) => prev.map((u) => ({ ...u, completedGenerations: 0 })));

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
        details: `Updated role for ${targetUser.name}: ${targetUser.role} -> ${newRole}`,
        units: '-',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-[#191c23] flex font-sans antialiased selection:bg-[#1A73E8]/20 selection:text-[#1A73E8]">
      
      {/* Desktop Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenNewTemplate={handleOpenNewTemplate}
          userEmail={currentUserEmail}
          userRole={currentUserRole}
          completedGenerations={currentUserCompleted}
          generationLimit={currentUserLimit}
          allowUnlimited={currentUserUnlimited}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-white shadow-2xl">
            <Sidebar
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                setMobileSidebarOpen(false);
              }}
              onOpenNewTemplate={handleOpenNewTemplate}
              userEmail={currentUserEmail}
              userRole={currentUserRole}
              completedGenerations={currentUserCompleted}
              generationLimit={currentUserLimit}
              allowUnlimited={currentUserUnlimited}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          currentView={currentView}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenNewTemplate={handleOpenNewTemplate}
          onNavigateToGovernance={() => setCurrentView('governance')}
          userEmail={currentUserEmail}
          userRole={currentUserRole}
          completedGenerations={currentUserCompleted}
          generationLimit={currentUserLimit}
          allowUnlimited={currentUserUnlimited}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'workspace' && (
            <WorkspaceView
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
              onCreateNewTemplate={handleOpenNewTemplate}
              onNavigateToGovernance={() => setCurrentView('governance')}
              userEmail={currentUserEmail}
              completedGenerations={currentUserCompleted}
              generationLimit={currentUserLimit}
              allowUnlimited={currentUserUnlimited}
            />
          )}

          {currentView === 'builder' && (
            <TemplateBuilderView
              onSaveTemplate={handleSaveTemplate}
              onCancel={() => setCurrentView('workspace')}
              initialTemplate={builderTemplate}
            />
          )}

          {currentView === 'explore' && (
            <ExploreFeedView
              assets={assets}
              onSelectTemplateById={handleSelectTemplateById}
              onBookmarkToggle={handleBookmarkToggle}
            />
          )}

          {currentView === 'governance' && (
            <GovernanceView
              users={users}
              auditLogs={auditLogs}
              defaultGenerationLimit={defaultGenerationLimit}
              onInviteUser={handleInviteUser}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateUserLimit={handleUpdateUserLimit}
              onResetUserUsage={handleResetUserUsage}
              onUpdateDefaultLimit={handleUpdateDefaultLimit}
              onBatchResetUsage={handleBatchResetUsage}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView
              userEmail={currentUserEmail}
              totalAssetsCount={assets.length}
              completedGenerations={currentUserCompleted}
              generationLimit={currentUserLimit}
              allowUnlimited={currentUserUnlimited}
              onNavigateToGovernance={() => setCurrentView('governance')}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
        />
      </div>

      {/* Studio Image Generation Modal */}
      <StudioModal
        template={activeStudioTemplate}
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        onAssetGenerated={handleAssetGenerated}
        userGenerationLimit={currentUserLimit}
        userCompletedGenerations={currentUserCompleted}
        userAllowUnlimited={currentUserUnlimited}
        onOpenGovernance={() => {
          setIsStudioModalOpen(false);
          setCurrentView('governance');
        }}
      />

    </div>
  );
}
