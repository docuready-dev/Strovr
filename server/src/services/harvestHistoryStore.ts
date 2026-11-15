import fs from 'fs';
import path from 'path';
import { db } from '../index';

export interface HarvestHistoryEntry {
  id: string;
  userId: string;
  userEmail?: string;
  keyword: string;
  location: string;
  scope: 'quick' | 'deep' | 'csv_import';
  leadsCount: number;
  tokensUsed: number;
  leadIds: string[];
  sampleNames?: string[];
  status: 'completed' | 'failed';
  createdAt: string;
}

class HarvestHistoryStore {
  private dataDir: string;
  private filePath: string;
  private history: Map<string, HarvestHistoryEntry> = new Map();

  constructor() {
    this.dataDir = process.env.STROVR_DATA_DIR || path.resolve(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, 'harvest_history.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.history.clear();
          for (const item of parsed) {
            if (item && item.id) {
              this.history.set(item.id, item);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[HarvestHistory] Load error:', e.message);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const list = Array.from(this.history.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e: any) {
      console.warn('[HarvestHistory] Save error:', e.message);
    }
  }

  addEntry(entry: HarvestHistoryEntry): HarvestHistoryEntry {
    this.history.set(entry.id, entry);
    this.saveToDisk();
    try {
      db.collection('harvest_history').doc(entry.id).set(entry, { merge: true }).catch(() => {});
    } catch {}
    return entry;
  }

  getHistory(userId?: string, userEmail?: string): HarvestHistoryEntry[] {
    const list = Array.from(this.history.values());
    const cleanUid = userId?.toLowerCase().trim();
    const cleanEmail = userEmail?.toLowerCase().trim();

    if (!cleanUid && !cleanEmail) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const filtered = list.filter(h => {
      const hUid = (h.userId || '').toLowerCase().trim();
      const hEmail = (h.userEmail || '').toLowerCase().trim();
      if (cleanUid && (hUid === cleanUid || hEmail === cleanUid)) return true;
      if (cleanEmail && (hEmail === cleanEmail || hUid === cleanEmail)) return true;
      if (cleanUid?.includes('ashleyghose') && (hUid.includes('ashleyghose') || hEmail?.includes('ashleyghose'))) return true;
      return false;
    });

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  deleteEntry(id: string): boolean {
    const deleted = this.history.delete(id);
    if (deleted) {
      this.saveToDisk();
      try {
        db.collection('harvest_history').doc(id).delete().catch(() => {});
      } catch {}
    }
    return deleted;
  }
}

export const harvestHistoryStore = new HarvestHistoryStore();
