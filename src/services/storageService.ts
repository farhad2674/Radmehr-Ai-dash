import { ApplianceTemplate, GeneratedAsset, PersonnelUser, AuditLogEntry } from '../types';
import { INITIAL_TEMPLATES, INITIAL_ASSETS, INITIAL_USERS, INITIAL_AUDIT_LOGS } from '../data/initialData';

export interface StorageStats {
  storageType: string;
  status: string;
  dataDirectory?: string;
  uploadsDirectory?: string;
  imagesStored: number;
  imagesDiskSizeKB: number;
  databaseDiskSizeKB: number;
  templatesCount: number;
  assetsCount: number;
  usersCount: number;
  logsCount: number;
  serverTime?: string;
}

export interface InitialDataPayload {
  templates: ApplianceTemplate[];
  assets: GeneratedAsset[];
  users: PersonnelUser[];
  auditLogs: AuditLogEntry[];
  settings?: { defaultLimit: number; workspaceName: string };
  stats?: StorageStats;
}

// Client-side local cache keys
const CACHE_KEYS = {
  TEMPLATES: 'radmehrai_disk_templates',
  ASSETS: 'radmehrai_disk_assets',
  USERS: 'radmehrai_disk_users',
  LOGS: 'radmehrai_disk_logs',
};

export const storageService = {
  // Fetch initial state from server disk or fallback to local cache
  async initStorage(): Promise<InitialDataPayload> {
    try {
      const res = await fetch('/api/storage/init');
      if (res.ok) {
        const data = await res.json();
        if (data && data.templates) {
          // Cache in local storage for offline resilience
          localStorage.setItem(CACHE_KEYS.TEMPLATES, JSON.stringify(data.templates));
          localStorage.setItem(CACHE_KEYS.ASSETS, JSON.stringify(data.assets));
          localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data.users));
          localStorage.setItem(CACHE_KEYS.LOGS, JSON.stringify(data.auditLogs));
          return data;
        }
      }
    } catch (err) {
      console.warn('[StorageService] Server offline or unreachable, reading from client localStorage cache:', err);
    }

    // Offline / Fallback reading
    const cachedTemplates = localStorage.getItem(CACHE_KEYS.TEMPLATES);
    const cachedAssets = localStorage.getItem(CACHE_KEYS.ASSETS);
    const cachedUsers = localStorage.getItem(CACHE_KEYS.USERS);
    const cachedLogs = localStorage.getItem(CACHE_KEYS.LOGS);

    return {
      templates: cachedTemplates ? JSON.parse(cachedTemplates) : INITIAL_TEMPLATES,
      assets: cachedAssets ? JSON.parse(cachedAssets) : INITIAL_ASSETS,
      users: cachedUsers ? JSON.parse(cachedUsers) : INITIAL_USERS,
      auditLogs: cachedLogs ? JSON.parse(cachedLogs) : INITIAL_AUDIT_LOGS,
    };
  },

  // Save template to server disk
  async saveTemplate(template: ApplianceTemplate): Promise<ApplianceTemplate[]> {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.TEMPLATES, JSON.stringify(data.templates));
        return data.templates;
      }
    } catch (e) {
      console.warn('Failed saving template to server disk:', e);
    }
    return [];
  },

  // Delete template from server disk
  async deleteTemplate(templateId: string): Promise<ApplianceTemplate[]> {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.TEMPLATES, JSON.stringify(data.templates));
        return data.templates;
      }
    } catch (e) {
      console.warn('Failed deleting template from server disk:', e);
    }
    return [];
  },

  // Save generated asset to server disk
  async saveAsset(asset: GeneratedAsset): Promise<GeneratedAsset[]> {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.ASSETS, JSON.stringify(data.assets));
        return data.assets;
      }
    } catch (e) {
      console.warn('Failed saving asset to server disk:', e);
    }
    return [];
  },

  // Update user quota limits
  async updateUserLimit(userId: string, limit: number, allowUnlimited?: boolean): Promise<PersonnelUser[]> {
    try {
      const res = await fetch(`/api/users/${userId}/limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, allowUnlimited }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data.users));
        return data.users;
      }
    } catch (e) {
      console.warn('Failed updating user limit on server disk:', e);
    }
    return [];
  },

  // Increment user usage counter
  async incrementUserUsage(userIdOrEmail: string): Promise<PersonnelUser[]> {
    try {
      const res = await fetch(`/api/users/${userIdOrEmail}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data.users));
        return data.users;
      }
    } catch (e) {
      console.warn('Failed incrementing user usage on server disk:', e);
    }
    return [];
  },

  // Reset user usage count
  async resetUserUsage(userId: string): Promise<PersonnelUser[]> {
    try {
      const res = await fetch(`/api/users/${userId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data.users));
        return data.users;
      }
    } catch (e) {
      console.warn('Failed resetting user usage on server disk:', e);
    }
    return [];
  },

  // Batch reset all users usage count
  async resetAllUsage(): Promise<PersonnelUser[]> {
    try {
      const res = await fetch('/api/users/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data.users));
        return data.users;
      }
    } catch (e) {
      console.warn('Failed batch resetting all usage on server disk:', e);
    }
    return [];
  },

  // Add audit log entry
  async addAuditLog(log: AuditLogEntry): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.LOGS, JSON.stringify(data.auditLogs));
        return data.auditLogs;
      }
    } catch (e) {
      console.warn('Failed adding audit log to server disk:', e);
    }
    return [];
  },

  // Get live disk storage stats
  async getStorageStats(): Promise<StorageStats | null> {
    try {
      const res = await fetch('/api/storage/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed fetching storage stats:', e);
    }
    return null;
  },

  // Export full JSON backup
  async exportBackup(): Promise<any> {
    try {
      const res = await fetch('/api/storage/backup/export');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Export backup failed:', e);
    }
    return null;
  },

  // Import full JSON backup
  async importBackup(backupJson: any): Promise<boolean> {
    try {
      const res = await fetch('/api/storage/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson),
      });
      return res.ok;
    } catch (e) {
      console.warn('Import backup failed:', e);
      return false;
    }
  },
};
