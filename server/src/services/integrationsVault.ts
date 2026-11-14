import fs from 'fs';
import path from 'path';

export interface VaultEntry {
  integrations: any[];
  integrationLogs: any[];
  updatedAt: string;
}

class IntegrationsVault {
  private filePath: string;
  private vault: Map<string, VaultEntry> = new Map();

  constructor() {
    const dataDir = process.env.STROVR_DATA_DIR || path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.filePath = path.join(dataDir, 'integrations_vault.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [key, val] of Object.entries(parsed)) {
            if (val && typeof val === 'object') {
              this.vault.set(key.toLowerCase().trim(), val as VaultEntry);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[IntegrationsVault] Load note:', err.message);
    }
  }

  private persist() {
    try {
      const obj: Record<string, VaultEntry> = {};
      for (const [key, val] of this.vault.entries()) {
        obj[key] = val;
      }
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[IntegrationsVault] Persist note:', err.message);
    }
  }

  save(userId: string, email: string | undefined, integrations: any[], logs: any[] = []) {
    const entry: VaultEntry = {
      integrations: Array.isArray(integrations) ? integrations : [],
      integrationLogs: Array.isArray(logs) ? logs : [],
      updatedAt: new Date().toISOString()
    };

    if (userId) {
      this.vault.set(userId.toLowerCase().trim(), entry);
    }
    if (email) {
      this.vault.set(email.toLowerCase().trim(), entry);
    }
    this.persist();
  }

  get(userId: string, email?: string): VaultEntry | null {
    if (userId) {
      const direct = this.vault.get(userId.toLowerCase().trim());
      if (direct && Array.isArray(direct.integrations) && direct.integrations.length > 0) {
        return direct;
      }
    }
    if (email) {
      const byEmail = this.vault.get(email.toLowerCase().trim());
      if (byEmail && Array.isArray(byEmail.integrations) && byEmail.integrations.length > 0) {
        return byEmail;
      }
    }
    return null;
  }
}

export const integrationsVault = new IntegrationsVault();
