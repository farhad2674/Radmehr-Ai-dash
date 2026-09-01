import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_ASSETS, INITIAL_AUDIT_LOGS, INITIAL_TEMPLATES, INITIAL_USERS } from '../data/initialData';
import { storageService } from './storageService';

function jsonResponse(data: unknown, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(data) } as unknown as Response;
}

describe('storageService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('loads server data and caches the shared collections', async () => {
    const payload = {
      templates: [{ id: 'template-1' }],
      assets: [{ id: 'asset-1' }],
      users: [{ id: 'user-1' }],
      auditLogs: [{ id: 'log-1' }],
      settings: { defaultLimit: 50, workspaceName: 'Test' },
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse(payload));

    await expect(storageService.initStorage()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith('/api/storage/init');
    expect(JSON.parse(localStorage.getItem('radmehrai_disk_templates')!)).toEqual(payload.templates);
    expect(JSON.parse(localStorage.getItem('radmehrai_disk_assets')!)).toEqual(payload.assets);
    expect(JSON.parse(localStorage.getItem('radmehrai_disk_users')!)).toEqual(payload.users);
    expect(JSON.parse(localStorage.getItem('radmehrai_disk_logs')!)).toEqual(payload.auditLogs);
  });

  it('loads local caches when the server is unavailable', async () => {
    const cached = {
      templates: [{ id: 'cached-template' }],
      assets: [{ id: 'cached-asset' }],
      users: [{ id: 'cached-user' }],
      auditLogs: [{ id: 'cached-log' }],
    };
    localStorage.setItem('radmehrai_disk_templates', JSON.stringify(cached.templates));
    localStorage.setItem('radmehrai_disk_assets', JSON.stringify(cached.assets));
    localStorage.setItem('radmehrai_disk_users', JSON.stringify(cached.users));
    localStorage.setItem('radmehrai_disk_logs', JSON.stringify(cached.auditLogs));
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    await expect(storageService.initStorage()).resolves.toEqual(cached);
  });

  it('uses initial data when both server and cache are unavailable', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    await expect(storageService.initStorage()).resolves.toEqual({
      templates: INITIAL_TEMPLATES,
      assets: INITIAL_ASSETS,
      users: INITIAL_USERS,
      auditLogs: INITIAL_AUDIT_LOGS,
    });
  });

  it('saves a template with the existing request contract and caches the response', async () => {
    const template = { id: 'template-1', name: 'Template' } as never;
    const templates = [template];
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ templates }));

    await expect(storageService.saveTemplate(template)).resolves.toEqual(templates);
    expect(fetch).toHaveBeenCalledWith('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    expect(JSON.parse(localStorage.getItem('radmehrai_disk_templates')!)).toEqual(templates);
  });

  it('deletes a template through its current endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ templates: [] }));

    await expect(storageService.deleteTemplate('template/with space')).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/templates/template/with space', { method: 'DELETE' });
  });

  it('preserves the current empty-array mutation fallback', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    await expect(storageService.saveTemplate({ id: 'template-1', name: 'Template' } as never)).resolves.toEqual([]);
  });

  it('exports and imports backups using the current API contracts', async () => {
    const backup = { version: 'test', templates: [] };
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(backup))
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    await expect(storageService.exportBackup()).resolves.toEqual(backup);
    await expect(storageService.importBackup(backup)).resolves.toBe(true);
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/storage/backup/export');
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/storage/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backup),
    });
  });
});
