import fs from 'fs';
import path from 'path';
import { ApplianceTemplate, GeneratedAsset, PersonnelUser, AuditLogEntry } from '../src/types';
import { INITIAL_TEMPLATES, INITIAL_ASSETS, INITIAL_USERS, INITIAL_AUDIT_LOGS } from '../src/data/initialData';

export const getUploadsDir = (): string => {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (fs.existsSync('/app/uploads')) return '/app/uploads';
  return path.join(process.cwd(), 'uploads');
};

export const getDataDir = (): string => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (fs.existsSync('/app/uploads')) {
    const p = path.join('/app/uploads', 'data');
    if (!fs.existsSync(p)) {
      try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
    }
    return p;
  }
  return path.join(process.cwd(), 'data');
};

const DATA_DIR = getDataDir();
const UPLOADS_DIR = getUploadsDir();

// File paths
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure directories exist
export function initDiskStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`[DiskStorage] Created data directory at: ${DATA_DIR}`);
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log(`[DiskStorage] Created uploads directory at: ${UPLOADS_DIR}`);
    }

    // Seed default files if they don't exist
    if (!fs.existsSync(TEMPLATES_FILE)) {
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(INITIAL_TEMPLATES, null, 2), 'utf-8');
    }
    if (!fs.existsSync(ASSETS_FILE)) {
      fs.writeFileSync(ASSETS_FILE, JSON.stringify(INITIAL_ASSETS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(INITIAL_AUDIT_LOGS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ defaultLimit: 50, workspaceName: 'RadmehrAI Appliance Studio' }, null, 2), 'utf-8');
    }
    console.log('[DiskStorage] Local disk JSON database initialized successfully for Parspack / Node.js.');
  } catch (err) {
    console.error('[DiskStorage] Error initializing local disk storage:', err);
  }
}

// Generic safe JSON read
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.error(`[DiskStorage] Failed reading ${filePath}:`, e);
  }
  return fallback;
}

// Generic safe JSON write
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`[DiskStorage] Failed writing ${filePath}:`, e);
    return false;
  }
}

// --- TEMPLATES CRUD ---
export function getTemplatesFromDisk(): ApplianceTemplate[] {
  return readJsonFile<ApplianceTemplate[]>(TEMPLATES_FILE, INITIAL_TEMPLATES);
}

export function saveTemplateToDisk(template: ApplianceTemplate): ApplianceTemplate[] {
  const current = getTemplatesFromDisk();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: ApplianceTemplate[];
  if (existingIdx >= 0) {
    updated = current.map((t) => (t.id === template.id ? template : t));
  } else {
    updated = [template, ...current];
  }
  writeJsonFile(TEMPLATES_FILE, updated);
  return updated;
}

export function deleteTemplateFromDisk(templateId: string): ApplianceTemplate[] {
  const current = getTemplatesFromDisk();
  const updated = current.filter((t) => t.id !== templateId);
  writeJsonFile(TEMPLATES_FILE, updated);
  return updated;
}

// --- ASSETS CRUD ---
export function getAssetsFromDisk(): GeneratedAsset[] {
  return readJsonFile<GeneratedAsset[]>(ASSETS_FILE, INITIAL_ASSETS);
}

export function saveAssetToDisk(asset: GeneratedAsset): GeneratedAsset[] {
  const current = getAssetsFromDisk();
  const updated = [asset, ...current];
  writeJsonFile(ASSETS_FILE, updated);
  return updated;
}

export function deleteAssetFromDisk(assetId: string): GeneratedAsset[] {
  const current = getAssetsFromDisk();
  const updated = current.filter((a) => a.id !== assetId);
  writeJsonFile(ASSETS_FILE, updated);
  return updated;
}

// --- USERS & LIMITS CRUD ---
export function getUsersFromDisk(): PersonnelUser[] {
  return readJsonFile<PersonnelUser[]>(USERS_FILE, INITIAL_USERS);
}

export function saveUserToDisk(user: PersonnelUser): PersonnelUser[] {
  const current = getUsersFromDisk();
  const existingIdx = current.findIndex((u) => u.id === user.id);
  let updated: PersonnelUser[];
  if (existingIdx >= 0) {
    updated = current.map((u) => (u.id === user.id ? user : u));
  } else {
    updated = [user, ...current];
  }
  writeJsonFile(USERS_FILE, updated);
  return updated;
}

export function updateUserLimitOnDisk(userId: string, limit: number, allowUnlimited?: boolean): PersonnelUser[] {
  const current = getUsersFromDisk();
  const updated = current.map((u) => 
    u.id === userId ? { ...u, generationLimit: limit, allowUnlimited: !!allowUnlimited } : u
  );
  writeJsonFile(USERS_FILE, updated);
  return updated;
}

export function incrementUserUsageOnDisk(userEmailOrId: string): PersonnelUser[] {
  const current = getUsersFromDisk();
  const updated = current.map((u) => {
    if (u.email === userEmailOrId || u.id === userEmailOrId) {
      return {
        ...u,
        completedGenerations: (u.completedGenerations || 0) + 1,
        lastActive: 'Just now',
      };
    }
    return u;
  });
  writeJsonFile(USERS_FILE, updated);
  return updated;
}

export function resetUserUsageOnDisk(userId: string): PersonnelUser[] {
  const current = getUsersFromDisk();
  const updated = current.map((u) => (u.id === userId ? { ...u, completedGenerations: 0 } : u));
  writeJsonFile(USERS_FILE, updated);
  return updated;
}

export function batchResetAllUsageOnDisk(): PersonnelUser[] {
  const current = getUsersFromDisk();
  const updated = current.map((u) => ({ ...u, completedGenerations: 0 }));
  writeJsonFile(USERS_FILE, updated);
  return updated;
}

// --- AUDIT LOGS ---
export function getLogsFromDisk(): AuditLogEntry[] {
  return readJsonFile<AuditLogEntry[]>(LOGS_FILE, INITIAL_AUDIT_LOGS);
}

export function appendLogToDisk(log: AuditLogEntry): AuditLogEntry[] {
  const current = getLogsFromDisk();
  const updated = [log, ...current.slice(0, 499)]; // retain last 500 logs
  writeJsonFile(LOGS_FILE, updated);
  return updated;
}

// --- SETTINGS ---
export function getSettingsFromDisk(): { defaultLimit: number; workspaceName: string } {
  return readJsonFile(SETTINGS_FILE, { defaultLimit: 50, workspaceName: 'RadmehrAI Appliance Studio' });
}

export function saveSettingsToDisk(settings: { defaultLimit: number; workspaceName: string }) {
  writeJsonFile(SETTINGS_FILE, settings);
  return settings;
}

// --- IMAGE SAVING TO DISK ---
export function saveImageBase64ToDisk(base64Data: string, mimeType = 'image/png'): string {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Clean base64 header if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`[DiskStorage] Saved image to disk: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[DiskStorage] Failed saving image to disk:', err);
    return base64Data; // fallback
  }
}

// --- DISK USAGE & STATS ---
export function getStorageStats() {
  try {
    let imagesCount = 0;
    let imagesTotalBytes = 0;
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      imagesCount = files.length;
      for (const file of files) {
        const stats = fs.statSync(path.join(UPLOADS_DIR, file));
        imagesTotalBytes += stats.size;
      }
    }

    let dbTotalBytes = 0;
    const dbFiles = [TEMPLATES_FILE, ASSETS_FILE, USERS_FILE, LOGS_FILE, SETTINGS_FILE];
    for (const f of dbFiles) {
      if (fs.existsSync(f)) {
        dbTotalBytes += fs.statSync(f).size;
      }
    }

    return {
      storageType: 'Node.js Local Disk & File-Store (Parspack PaaS Optimized)',
      status: 'ONLINE',
      dataDirectory: DATA_DIR,
      uploadsDirectory: UPLOADS_DIR,
      imagesStored: imagesCount,
      imagesDiskSizeKB: Math.round(imagesTotalBytes / 1024),
      databaseDiskSizeKB: Math.round(dbTotalBytes / 1024),
      templatesCount: getTemplatesFromDisk().length,
      assetsCount: getAssetsFromDisk().length,
      usersCount: getUsersFromDisk().length,
      logsCount: getLogsFromDisk().length,
      serverTime: new Date().toISOString(),
    };
  } catch (e) {
    return {
      storageType: 'Node.js Local Disk',
      status: 'PARTIAL',
      imagesStored: 0,
      imagesDiskSizeKB: 0,
      databaseDiskSizeKB: 0,
    };
  }
}

// --- FULL BACKUP EXPORT & IMPORT ---
export function exportFullBackup() {
  return {
    version: '2.4-parspack',
    exportedAt: new Date().toISOString(),
    templates: getTemplatesFromDisk(),
    assets: getAssetsFromDisk(),
    users: getUsersFromDisk(),
    auditLogs: getLogsFromDisk(),
    settings: getSettingsFromDisk(),
  };
}

export function importFullBackup(backupData: any): boolean {
  try {
    if (backupData.templates && Array.isArray(backupData.templates)) {
      writeJsonFile(TEMPLATES_FILE, backupData.templates);
    }
    if (backupData.assets && Array.isArray(backupData.assets)) {
      writeJsonFile(ASSETS_FILE, backupData.assets);
    }
    if (backupData.users && Array.isArray(backupData.users)) {
      writeJsonFile(USERS_FILE, backupData.users);
    }
    if (backupData.auditLogs && Array.isArray(backupData.auditLogs)) {
      writeJsonFile(LOGS_FILE, backupData.auditLogs);
    }
    if (backupData.settings) {
      writeJsonFile(SETTINGS_FILE, backupData.settings);
    }
    return true;
  } catch (e) {
    console.error('[DiskStorage] Failed importing backup:', e);
    return false;
  }
}
