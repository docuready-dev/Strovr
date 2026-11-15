import fs from 'fs';
import path from 'path';

export interface LeadRecord {
  _id: string;
  userId: string;
  userEmail?: string;
  businessName: string;
  category?: string;
  fieldOfWork?: string;
  firstName?: string;
  phone?: string;
  email?: string;
  emailStatus?: string;
  website?: string;
  rating?: number;
  location?: string;
  city?: string;
  scope?: string;
  status?: string;
  tags?: string[];
  saved?: boolean;
  source?: string;
  harvestedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Contact Channels Tracking Flags
  whatsapp_contacted?: boolean;
  email_contacted?: boolean;
  phone_contacted?: boolean;
  // Aliases for polymorphic client compatibility
  whatsappContacted?: boolean;
  emailContacted?: boolean;
  phoneContacted?: boolean;
  telephonic_contacted?: boolean;
  harvestJobId?: string;
}

// Strictly ban the 21 legacy dummy mock leads so they can NEVER resurface
export const PERMANENT_BANNED_LEAD_NAMES = new Set<string>([
  'royale realtors india',
  'royal siyaram properties & estate',
  'yadav properties - property dealers in south delhi',
  'gulshan estate agents – real estate consultants',
  'deepak chawla',
  'munjaal realtors',
  'perfect homes',
  'dazzle dental clinic',
  'techasoft private limited',
  'cloud software solution - website & mobile app development company in bangalore',
  'erplax bangalore',
  'apex cloud solutions',
  'nextgen ai labs',
  'zenith logistics hub',
  'quantum fintech global',
  'starlight media studios',
  'bluepeak real estate advisors',
  'pulsehealth telemedicine',
  'innova agritech ventures',
  'cyberguard defense systems',
  'greenmatrix solar energy'
]);

class LeadStore {
  private dataDir: string;
  private filePath: string;
  private deletedFilePath: string;
  private leads: Map<string, LeadRecord> = new Map();
  private deletedLeadIds: Set<string> = new Set();
  private isLoaded = false;

  constructor() {
    this.dataDir = process.env.STROVR_DATA_DIR || path.resolve(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, 'leads.json');
    this.deletedFilePath = path.join(this.dataDir, 'deleted_leads.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load persistent deleted tombstones
      if (fs.existsSync(this.deletedFilePath)) {
        try {
          const deletedRaw = fs.readFileSync(this.deletedFilePath, 'utf8');
          const deletedParsed = JSON.parse(deletedRaw);
          if (Array.isArray(deletedParsed)) {
            this.deletedLeadIds = new Set(deletedParsed);
          }
        } catch (_) {}
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.leads.clear();
          for (const item of parsed) {
            if (item && item._id && !this.deletedLeadIds.has(item._id)) {
              const normName = (item.businessName || '').toLowerCase().trim();
              if (!PERMANENT_BANNED_LEAD_NAMES.has(normName)) {
                this.leads.set(item._id, {
                  ...item,
                  whatsapp_contacted: Boolean(item.whatsapp_contacted || item.whatsappContacted),
                  email_contacted: Boolean(item.email_contacted || item.emailContacted),
                  phone_contacted: Boolean(item.phone_contacted || item.telephonic_contacted || item.phoneContacted)
                });
              }
            }
          }
          console.log(`[LeadStore] Loaded ${this.leads.size} leads from persistent local storage.`);
        }
      }
    } catch (err: any) {
      console.warn('[LeadStore] Failed to load leads from disk (starting fresh):', err.message);
    } finally {
      this.isLoaded = true;
    }
  }

  private saveDeletedToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.deletedFilePath, JSON.stringify(Array.from(this.deletedLeadIds)), 'utf8');
    } catch (err: any) {
      console.warn('[LeadStore] Failed to save deleted leads list:', err.message);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const allLeads = Array.from(this.leads.values());
      fs.writeFileSync(this.filePath, JSON.stringify(allLeads, null, 2), 'utf8');

      // Also generate categorized views and Excel-compatible CSVs for user visibility
      this.exportCategoryViews(allLeads);
    } catch (err: any) {
      console.warn('[LeadStore] Failed to write leads to disk:', err.message);
    }
  }

  private exportCategoryViews(allLeads: LeadRecord[]) {
    try {
      // 1. Saved Leads (saved !== false)
      const savedLeads = allLeads.filter(l => l.saved !== false);
      fs.writeFileSync(path.join(this.dataDir, 'saved_leads.json'), JSON.stringify(savedLeads, null, 2), 'utf8');

      // 2. Harvested Leads (from Scraper / Harvest Pipeline)
      const harvestedLeads = allLeads.filter(l => l.source && (l.source.includes('Harvest') || l.source.includes('Scraper') || l.source.includes('Google Places')));
      fs.writeFileSync(path.join(this.dataDir, 'harvested_leads.json'), JSON.stringify(harvestedLeads, null, 2), 'utf8');

      // 3. User-friendly CSV files (can be opened in Excel directly)
      this.writeCsvFile(path.join(this.dataDir, 'all_leads.csv'), allLeads);
      this.writeCsvFile(path.join(this.dataDir, 'saved_leads.csv'), savedLeads);
      this.writeCsvFile(path.join(this.dataDir, 'harvested_leads.csv'), harvestedLeads);
    } catch (err: any) {
      console.warn('[LeadStore] Category views export note:', err.message);
    }
  }

  private writeCsvFile(targetPath: string, leads: LeadRecord[]) {
    const headers = ['Business Name', 'Category', 'Phone', 'Email', 'Email Status', 'Website', 'Rating', 'Location', 'City', 'Status', 'WhatsApp Contacted', 'Email Contacted', 'Phone Contacted', 'Tags', 'Source', 'Harvested At'];
    const rows = leads.map(l => [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.emailStatus || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${l.rating || ''}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.status || 'New').replace(/"/g, '""')}"`,
      `"${l.whatsapp_contacted ? 'Yes' : 'No'}"`,
      `"${l.email_contacted ? 'Yes' : 'No'}"`,
      `"${l.phone_contacted ? 'Yes' : 'No'}"`,
      `"${(Array.isArray(l.tags) ? l.tags.join('; ') : '').replace(/"/g, '""')}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`,
      `"${(l.harvestedAt || l.createdAt || '').replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    fs.writeFileSync(targetPath, csvContent, 'utf8');
  }

  getLeads(userId?: string, userEmail?: string): LeadRecord[] {
    const all = Array.from(this.leads.values());
    const cleanUserId = userId?.toLowerCase().trim();
    const cleanEmail = userEmail?.toLowerCase().trim();

    if (!cleanUserId && !cleanEmail) {
      return all
        .filter(l => !PERMANENT_BANNED_LEAD_NAMES.has((l.businessName || '').toLowerCase().trim()))
        .sort((a, b) => {
          const timeB = new Date(b.harvestedAt || b.createdAt || 0).getTime();
          const timeA = new Date(a.harvestedAt || a.createdAt || 0).getTime();
          return timeB - timeA;
        });
    }

    const filtered = all.filter(l => {
      const normName = (l.businessName || '').toLowerCase().trim();
      if (PERMANENT_BANNED_LEAD_NAMES.has(normName)) return false;

      const lUid = (l.userId || '').toLowerCase().trim();
      const lEmail = (l.userEmail || '').toLowerCase().trim();

      // Direct match on userId or userEmail
      if (cleanUserId && (lUid === cleanUserId || lEmail === cleanUserId)) return true;
      if (cleanEmail && (lEmail === cleanEmail || lUid === cleanEmail)) return true;

      // Ashley Super Admin and Bicon Ghose workspace access - include all workspace leads
      if (cleanUserId?.includes('ashleyghose64') || cleanEmail?.includes('ashleyghose64') ||
          cleanUserId?.includes('ashleyghose28') || cleanEmail?.includes('ashleyghose28')) {
        if (lUid.includes('ashleyghose64') || lEmail.includes('ashleyghose64') ||
            lUid.includes('ashleyghose28') || lEmail.includes('ashleyghose28') ||
            lUid.startsWith('user_') || !lUid) {
          return true;
        }
      }

      return false;
    });

    return filtered.sort((a, b) => {
      const timeB = new Date(b.harvestedAt || b.createdAt || 0).getTime();
      const timeA = new Date(a.harvestedAt || a.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  getLeadById(id: string): LeadRecord | null {
    return this.leads.get(id) || null;
  }

  isDeleted(id: string): boolean {
    return this.deletedLeadIds.has(id);
  }

  addLead(lead: Partial<LeadRecord> & { userId: string; businessName: string }): LeadRecord {
    const normName = (lead.businessName || '').toLowerCase().trim();
    if (PERMANENT_BANNED_LEAD_NAMES.has(normName)) {
      return (lead as LeadRecord);
    }

    const id = lead._id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (this.deletedLeadIds.has(id)) {
      return (lead as LeadRecord);
    }

    // Semantic deduplication: Check if this user already has this lead (by business name + phone/email)
    const normPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const normEmail = (lead.email || '').toLowerCase().trim();
    const lUid = (lead.userId || '').toLowerCase().trim();
    const lEmail = (lead.userEmail || '').toLowerCase().trim();

    if (normName) {
      for (const [existingId, existing] of this.leads.entries()) {
        const eUid = (existing.userId || '').toLowerCase().trim();
        const eEmail = (existing.userEmail || '').toLowerCase().trim();
        const userMatches = !lUid || eUid === lUid || (lEmail && eEmail === lEmail) || (lUid.includes('ashleyghose') && eUid.includes('ashleyghose'));
        
        if (userMatches) {
          const eNormName = (existing.businessName || '').toLowerCase().trim();
          const eNormPhone = (existing.phone || '').replace(/[^0-9]/g, '');
          const eNormEmail = (existing.email || '').toLowerCase().trim();

          const matchesByName = eNormName === normName;
          const matchesByContact = (normPhone && eNormPhone && normPhone === eNormPhone) || (normEmail && eNormEmail && normEmail === eNormEmail);

          if (matchesByName && (matchesByContact || (!normPhone && !normEmail && !eNormPhone && !eNormEmail))) {
            // Merge into existing lead instead of duplicating
            const merged: LeadRecord = {
              ...existing,
              ...lead,
              _id: existingId,
              userId: existing.userId,
              whatsapp_contacted: lead.whatsapp_contacted !== undefined ? Boolean(lead.whatsapp_contacted) : existing.whatsapp_contacted,
              email_contacted: lead.email_contacted !== undefined ? Boolean(lead.email_contacted) : existing.email_contacted,
              phone_contacted: lead.phone_contacted !== undefined ? Boolean(lead.phone_contacted) : (lead.telephonic_contacted !== undefined ? Boolean(lead.telephonic_contacted) : existing.phone_contacted),
              updatedAt: new Date().toISOString()
            };
            this.leads.set(existingId, merged);
            this.saveToDisk();
            return merged;
          }
        }
      }
    }

    const nowIso = new Date().toISOString();
    const city = lead.city || (lead.location ? lead.location.split(',')[0].trim() : '');
    const harvestedAt = lead.harvestedAt || lead.createdAt || nowIso;

    const record: LeadRecord = {
      _id: id,
      userId: lead.userId,
      userEmail: lead.userEmail,
      businessName: lead.businessName,
      category: lead.category || 'General B2B',
      fieldOfWork: lead.fieldOfWork || lead.category || 'General B2B',
      firstName: lead.firstName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      emailStatus: lead.emailStatus || (lead.email ? 'Verified Email' : 'Phone Only / No Email Found'),
      website: lead.website || '',
      rating: lead.rating || 0,
      location: lead.location || city || '',
      city: city,
      scope: lead.scope || 'quick',
      status: lead.status || 'New',
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      saved: lead.saved ?? true,
      source: lead.source || 'Scraper Engine',
      harvestedAt: harvestedAt,
      createdAt: lead.createdAt || harvestedAt,
      updatedAt: lead.updatedAt || nowIso,
      whatsapp_contacted: Boolean(lead.whatsapp_contacted ?? lead.whatsappContacted ?? false),
      email_contacted: Boolean(lead.email_contacted ?? lead.emailContacted ?? false),
      phone_contacted: Boolean(lead.phone_contacted ?? lead.telephonic_contacted ?? lead.phoneContacted ?? false),
      harvestJobId: lead.harvestJobId || ''
    };

    this.leads.set(id, record);
    this.saveToDisk();
    return record;
  }

  saveBatch(newLeads: Array<Partial<LeadRecord> & { userId: string; businessName: string }>): LeadRecord[] {
    const saved: LeadRecord[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < newLeads.length; i++) {
      const l = newLeads[i];
      if (!l || !l.businessName) continue;
      const normName = l.businessName.toLowerCase().trim();
      if (PERMANENT_BANNED_LEAD_NAMES.has(normName)) continue;

      const id = l._id || `lead_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
      if (this.deletedLeadIds.has(id)) continue;

      const city = l.city || (l.location ? l.location.split(',')[0].trim() : '');
      const harvestedAt = l.harvestedAt || l.createdAt || new Date(Date.now() - i * 1000).toISOString();

      const record: LeadRecord = {
        _id: id,
        userId: l.userId,
        userEmail: l.userEmail,
        businessName: l.businessName,
        category: l.category || 'General B2B',
        fieldOfWork: l.fieldOfWork || l.category || 'General B2B',
        firstName: l.firstName || '',
        phone: l.phone || '',
        email: l.email || '',
        emailStatus: l.emailStatus || (l.email ? 'Verified Email' : 'Phone Only / No Email Found'),
        website: l.website || '',
        rating: l.rating || 0,
        location: l.location || city || '',
        city: city,
        scope: l.scope || 'quick',
        status: l.status || 'New',
        tags: Array.isArray(l.tags) ? l.tags : [],
        saved: l.saved ?? true,
        source: l.source || 'Harvest Pipeline',
        harvestedAt: harvestedAt,
        createdAt: l.createdAt || harvestedAt,
        updatedAt: nowIso,
        whatsapp_contacted: Boolean(l.whatsapp_contacted ?? l.whatsappContacted ?? false),
        email_contacted: Boolean(l.email_contacted ?? l.emailContacted ?? false),
        phone_contacted: Boolean(l.phone_contacted ?? l.telephonic_contacted ?? l.phoneContacted ?? false),
        harvestJobId: l.harvestJobId || ''
      };

      this.leads.set(id, record);
      saved.push(record);
    }

    this.saveToDisk();
    return saved;
  }

  upsertSyncVault(
    vaultLeads: Array<Partial<LeadRecord> & { businessName: string }>,
    defaultUserId?: string,
    defaultUserEmail?: string
  ): LeadRecord[] {
    const nowIso = new Date().toISOString();
    const cleanUserEmail = defaultUserEmail?.toLowerCase().trim();
    const cleanUserId = defaultUserId?.trim();

    // Map existing records for smart deduplication
    const existingById = new Map<string, LeadRecord>();
    const existingByKey = new Map<string, LeadRecord>();

    for (const item of this.leads.values()) {
      if (item._id) existingById.set(item._id, item);
      const nameKey = (item.businessName || '').toLowerCase().trim();
      if (nameKey && item.email) existingByKey.set(`${nameKey}__${item.email.toLowerCase().trim()}`, item);
      if (nameKey && item.phone) existingByKey.set(`${nameKey}__${item.phone.replace(/[^0-9]/g, '')}`, item);
    }

    for (const l of vaultLeads) {
      if (!l || !l.businessName) continue;
      const nameNorm = l.businessName.toLowerCase().trim();
      if (PERMANENT_BANNED_LEAD_NAMES.has(nameNorm)) continue;

      const emailNorm = (l.email || '').toLowerCase().trim();
      const phoneNorm = (l.phone || '').replace(/[^0-9]/g, '');

      let existing: LeadRecord | undefined;
      if (l._id && existingById.has(l._id)) {
        existing = existingById.get(l._id);
      } else if (emailNorm && existingByKey.has(`${nameNorm}__${emailNorm}`)) {
        existing = existingByKey.get(`${nameNorm}__${emailNorm}`);
      } else if (phoneNorm && existingByKey.has(`${nameNorm}__${phoneNorm}`)) {
        existing = existingByKey.get(`${nameNorm}__${phoneNorm}`);
      }

      const assignedUserId = l.userId || existing?.userId || cleanUserId || 'anonymous';
      const assignedUserEmail = l.userEmail || existing?.userEmail || cleanUserEmail || undefined;
      const assignedCity = l.city || existing?.city || (l.location ? l.location.split(',')[0].trim() : '');
      const assignedHarvestedAt = l.harvestedAt || existing?.harvestedAt || l.createdAt || existing?.createdAt || nowIso;

      if (existing) {
        existing.businessName = l.businessName || existing.businessName;
        if (l.email && !existing.email) existing.email = l.email;
        if (l.phone && !existing.phone) existing.phone = l.phone;
        if (l.website && !existing.website) existing.website = l.website;
        if (l.rating && !existing.rating) existing.rating = l.rating;
        if (l.category && (!existing.category || existing.category === 'General B2B')) existing.category = l.category;
        if (assignedCity && !existing.city) existing.city = assignedCity;
        if (l.location && !existing.location) existing.location = l.location;
        if (l.status) existing.status = l.status;
        if (l.whatsapp_contacted !== undefined) existing.whatsapp_contacted = Boolean(l.whatsapp_contacted);
        if (l.email_contacted !== undefined) existing.email_contacted = Boolean(l.email_contacted);
        if (l.phone_contacted !== undefined) existing.phone_contacted = Boolean(l.phone_contacted);
        if (Array.isArray(l.tags) && l.tags.length > 0) {
          existing.tags = Array.from(new Set([...(existing.tags || []), ...l.tags]));
        }
        if (assignedUserEmail && !existing.userEmail) existing.userEmail = assignedUserEmail;
        existing.updatedAt = nowIso;
        this.leads.set(existing._id, existing);
      } else {
        const id = l._id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        if (this.deletedLeadIds.has(id)) continue;

        const record: LeadRecord = {
          _id: id,
          userId: assignedUserId,
          userEmail: assignedUserEmail,
          businessName: l.businessName,
          category: l.category || 'General B2B',
          fieldOfWork: l.fieldOfWork || l.category || 'General B2B',
          firstName: l.firstName || '',
          phone: l.phone || '',
          email: l.email || '',
          emailStatus: l.emailStatus || (l.email ? 'Verified Email' : 'Phone Only / No Email Found'),
          website: l.website || '',
          rating: l.rating || 0,
          location: l.location || assignedCity || '',
          city: assignedCity,
          scope: l.scope || 'quick',
          status: l.status || 'New',
          tags: Array.isArray(l.tags) ? l.tags : [],
          saved: l.saved ?? true,
          source: l.source || 'Vault Rehydration',
          harvestedAt: assignedHarvestedAt,
          createdAt: l.createdAt || assignedHarvestedAt,
          updatedAt: nowIso,
          whatsapp_contacted: Boolean(l.whatsapp_contacted ?? l.whatsappContacted ?? false),
          email_contacted: Boolean(l.email_contacted ?? l.emailContacted ?? false),
          phone_contacted: Boolean(l.phone_contacted ?? l.telephonic_contacted ?? l.phoneContacted ?? false),
          harvestJobId: l.harvestJobId || ''
        };
        this.leads.set(id, record);
        existingById.set(id, record);
        if (emailNorm) existingByKey.set(`${nameNorm}__${emailNorm}`, record);
        if (phoneNorm) existingByKey.set(`${nameNorm}__${phoneNorm}`, record);
      }
    }

    this.saveToDisk();
    return this.getLeads(cleanUserId, cleanUserEmail);
  }

  updateLead(id: string, updates: Partial<LeadRecord>): LeadRecord | null {
    const existing = this.leads.get(id);
    if (!existing) return null;

    const resolvedWa = updates.whatsapp_contacted !== undefined 
      ? Boolean(updates.whatsapp_contacted) 
      : (updates.whatsappContacted !== undefined ? Boolean(updates.whatsappContacted) : existing.whatsapp_contacted);

    const resolvedEmail = updates.email_contacted !== undefined 
      ? Boolean(updates.email_contacted) 
      : (updates.emailContacted !== undefined ? Boolean(updates.emailContacted) : existing.email_contacted);

    const resolvedPhone = updates.phone_contacted !== undefined 
      ? Boolean(updates.phone_contacted) 
      : (updates.telephonic_contacted !== undefined 
          ? Boolean(updates.telephonic_contacted) 
          : (updates.phoneContacted !== undefined ? Boolean(updates.phoneContacted) : existing.phone_contacted));

    const updated: LeadRecord = {
      ...existing,
      ...updates,
      _id: id, // Immutable ID
      userId: existing.userId, // Immutable owner
      whatsapp_contacted: resolvedWa,
      email_contacted: resolvedEmail,
      phone_contacted: resolvedPhone,
      updatedAt: new Date().toISOString()
    };

    this.leads.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  deleteLead(id: string): boolean {
    this.deletedLeadIds.add(id);
    let target = this.leads.get(id);

    // If not found by direct map key, look for match by _id
    if (!target) {
      for (const [k, v] of this.leads.entries()) {
        if (k === id || v._id === id) {
          target = v;
          id = k;
          break;
        }
      }
    }

    if (target) {
      const bName = (target.businessName || '').toLowerCase().trim();
      const phone = (target.phone || '').replace(/[^0-9]/g, '');
      const email = (target.email || '').toLowerCase().trim();

      // Clean up all duplicates or legacy occurrences of this lead
      for (const [otherId, otherLead] of this.leads.entries()) {
        const oName = (otherLead.businessName || '').toLowerCase().trim();
        const oPhone = (otherLead.phone || '').replace(/[^0-9]/g, '');
        const oEmail = (otherLead.email || '').toLowerCase().trim();

        if (bName && oName === bName) {
          const phoneMatch = !phone || !oPhone || phone === oPhone;
          const emailMatch = !email || !oEmail || email === oEmail;
          if (phoneMatch && emailMatch) {
            this.deletedLeadIds.add(otherId);
            this.leads.delete(otherId);
          }
        }
      }
    }

    this.leads.delete(id);
    this.saveDeletedToDisk();
    this.saveToDisk();
    return true;
  }

  batchDelete(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.deleteLead(id)) {
        count++;
      }
    }
    return count;
  }

  deleteAll(userId: string, userEmail?: string): number {
    let count = 0;
    const cleanUserId = userId?.toLowerCase().trim();
    const cleanEmail = userEmail?.toLowerCase().trim();
    for (const [id, lead] of this.leads.entries()) {
      const lUid = (lead.userId || '').toLowerCase().trim();
      const lEmail = (lead.userEmail || '').toLowerCase().trim();
      if ((cleanUserId && (lUid === cleanUserId || lEmail === cleanUserId)) ||
          (cleanEmail && (lEmail === cleanEmail || lUid === cleanEmail)) ||
          (cleanUserId?.includes('ashleyghose') && (lUid.includes('ashleyghose') || lEmail.includes('ashleyghose')))) {
        this.deletedLeadIds.add(id);
        this.leads.delete(id);
        count++;
      }
    }
    this.saveDeletedToDisk();
    if (count > 0) {
      this.saveToDisk();
    }
    return count;
  }

  purgeAll(): void {
    for (const id of this.leads.keys()) {
      this.deletedLeadIds.add(id);
    }
    this.leads.clear();
    this.saveDeletedToDisk();
    this.saveToDisk();
  }

  batchSaveStatus(ids: string[], saved: boolean, userId: string, userEmail?: string): number {
    let count = 0;
    const nowIso = new Date().toISOString();
    const cleanUserId = userId?.toLowerCase().trim();
    const cleanEmail = userEmail?.toLowerCase().trim();
    for (const id of ids) {
      const existing = this.leads.get(id);
      if (existing) {
        const lUid = (existing.userId || '').toLowerCase().trim();
        const lEmail = (existing.userEmail || '').toLowerCase().trim();
        if (!cleanUserId || lUid === cleanUserId || lEmail === cleanUserId ||
            (cleanEmail && (lEmail === cleanEmail || lUid === cleanEmail))) {
          existing.saved = saved;
          existing.updatedAt = nowIso;
          count++;
        }
      }
    }
    if (count > 0) {
      this.saveToDisk();
    }
    return count;
  }
}

export const leadStore = new LeadStore();
