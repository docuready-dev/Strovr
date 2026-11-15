import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { alertDialog, confirmDialog } from '../components/AppConfirmModal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import LeadFinderWizard from '../components/LeadFinderWizard';
import SerpApiConnectModal from '../components/SerpApiConnectModal';
import { filterOutBannedLeads } from '../utils/bannedLeads';
import { 
  Building2, Phone, MapPin, Star, Globe, 
  ExternalLink, ArrowRight, Search, Users2, Check,
  Edit3, X, Mail, Sparkles, Compass, Upload,
  History, Download, Trash2, Calendar, Clock, Layers, Filter
} from 'lucide-react';

interface HarvestHistoryEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  query: string;
  location: string;
  scope?: string;
  mode?: string;
  leadCount: number;
  leadIds?: string[];
  tokensUsed?: number;
  costPerContact?: number;
  status: string;
  timestamp: string;
}

const LeadFinder = () => {
  const { user, integrations, syncLeadsToIntegration, enrichLeadViaIntegration } = useStore();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Harvest History state
  const [activeFinderTab, setActiveFinderTab] = useState<'listings' | 'history'>('listings');
  const [harvestHistory, setHarvestHistory] = useState<HarvestHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inspectedBatchId, setInspectedBatchId] = useState<string | null>(null);

  // SerpApi Engine State
  const [isSerpModalOpen, setIsSerpModalOpen] = useState(false);
  const [serpApiStatus, setSerpApiStatus] = useState<{ isConnected: boolean; account?: any } | null>(null);

  const isFree = (user?.plan || 'free').toLowerCase() === 'free';

  const fetchSerpStatus = async () => {
    if (!user?._id && !user?.email) return;
    const vaultKey = user?.email || user?._id || 'global';
    const storedVault = localStorage.getItem(`strovr_serpapi_vault_${vaultKey}`) || 
                        localStorage.getItem('strovr_serpapi_vault_global');
    try {
      const res = await axios.get(`${API_URL}/api/leads/serpapi/status`, {
        headers: { 
          userid: user._id || '',
          useremail: user.email || ''
        }
      });
      if (res.data?.isConnected) {
        setSerpApiStatus(res.data);
      } else if (storedVault) {
        try {
          const reRes = await axios.post(
            `${API_URL}/api/leads/serpapi/connect`,
            { apiKey: storedVault },
            { headers: { userid: user._id || '', useremail: user.email || '' } }
          );
          if (reRes.data?.success) {
            setSerpApiStatus({ isConnected: true, account: reRes.data.account });
          } else {
            setSerpApiStatus(res.data);
          }
        } catch {
          setSerpApiStatus(res.data);
        }
      } else {
        setSerpApiStatus(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSerpStatus();
  }, [user?._id, user?.email]);

  // Integration Sync & Enrich state
  const [isSyncDropdownOpen, setIsSyncDropdownOpen] = useState(false);
  const [syncingAppId, setSyncingAppId] = useState<string | null>(null);
  const [enrichingLeadId, setEnrichingLeadId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const connectedSyncApps = integrations.filter(
    a => a.connected && ['CRM', 'Productivity', 'Marketing & Forms', 'Data & Warehouses'].includes(a.category)
  );
  const activeEnrichApp = integrations.find(
    a => a.connected && ['apollo', 'firecrawl', 'linkedin'].includes(a.id)
  ) || { id: 'apollo', name: 'Apollo' };

  // Edit contact modal state
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Helper deduplication merge - strictly 1 entry per lead
  const mergeLeads = (localList: any[], serverList: any[]) => {
    const byId = new Map<string, any>();
    const byKey = new Map<string, string>(); // maps composite key -> canonical _id

    const getKey = (item: any): string => {
      const name = (item.businessName || '').toLowerCase().trim();
      const email = (item.email || '').toLowerCase().trim();
      const phone = (item.phone || '').replace(/[^0-9]/g, '');
      if (name && email) return `${name}__email_${email}`;
      if (name && phone) return `${name}__phone_${phone}`;
      return '';
    };

    const processItem = (item: any) => {
      if (!item || !item.businessName) return;
      const id = item._id ? String(item._id) : '';
      const key = getKey(item);

      let existingId: string | null = null;
      if (id && byId.has(id)) {
        existingId = id;
      } else if (key && byKey.has(key)) {
        existingId = byKey.get(key) || null;
      }

      if (existingId && byId.has(existingId)) {
        const existing = byId.get(existingId);
        const merged = { ...existing, ...item, _id: existingId };
        byId.set(existingId, merged);
      } else {
        const canonicalId = id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record = { ...item, _id: canonicalId };
        byId.set(canonicalId, record);
        if (key) byKey.set(key, canonicalId);
      }
    };

    if (Array.isArray(serverList)) serverList.forEach(processItem);
    if (Array.isArray(localList)) localList.forEach(processItem);

    return Array.from(byId.values()).sort((a, b) => {
      const timeB = new Date(b.harvestedAt || b.createdAt || 0).getTime();
      const timeA = new Date(a.harvestedAt || a.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  const updateCache = (list: any[]) => {
    setLeads(list);
    try {
      if (user?.email) localStorage.setItem(`strovr_leads_cache_${user.email}`, JSON.stringify(list));
      if (user?._id) localStorage.setItem(`strovr_leads_cache_${user._id}`, JSON.stringify(list));
    } catch {}
  };

  // Permanent Deleted Tombstones Store
  const getDeletedTombstones = (): Set<string> => {
    try {
      const raw = localStorage.getItem('strovr_deleted_tombstones');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set<string>();
  };

  const fetchLeads = async () => {
    if (!user?._id && !user?.email) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leads`, {
        headers: { 
          userid: user._id || '',
          useremail: user.email || ''
        }
      });
      const serverLeads = Array.isArray(res.data) ? res.data : [];
      const cleanServerLeads = filterOutBannedLeads(serverLeads);
      const tombstones = getDeletedTombstones();
      const validLeads = cleanServerLeads.filter(l => {
        if (!l) return false;
        if (tombstones.has(l._id)) return false;
        const bName = `name:${(l.businessName || '').toLowerCase().trim()}`;
        if (tombstones.has(bName)) return false;
        return true;
      });

      // Update leads list and sync cache
      setLeads(validLeads);
      updateCache(validLeads);
    } catch (err) {
      console.error('Failed to fetch harvested leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHarvestHistory = async () => {
    if (!user?._id && !user?.email) return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/api/leads/harvest-history`, {
        headers: {
          userid: user._id || '',
          useremail: user.email || ''
        }
      });
      if (Array.isArray(res.data)) {
        setHarvestHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load harvest history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistoryEntry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete History Log?',
      message: 'Are you sure you want to delete this harvest history log entry? (Harvested leads already in your audience will not be deleted.)',
      confirmText: 'Delete Log',
      cancelText: 'Cancel',
      danger: true
    });
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/leads/harvest-history/${id}`, {
        headers: {
          userid: user?._id || '',
          useremail: user?.email || ''
        }
      });
      setHarvestHistory(prev => prev.filter(item => item.id !== id));
      if (inspectedBatchId === id) setInspectedBatchId(null);
      showToast('Harvest history log deleted.');
    } catch (err) {
      console.error('Failed to delete history log:', err);
      showToast('Failed to delete history log.');
    }
  };

  const handleInspectBatch = (entry: HarvestHistoryEntry) => {
    setInspectedBatchId(entry.id);
    setActiveFinderTab('listings');
    showToast(`Filtering to batch: "${entry.query} in ${entry.location}" (${entry.leadCount} leads)`);
  };

  const handleExportBatchCsv = (entry: HarvestHistoryEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const batchLeadIdSet = Array.isArray(entry.leadIds) ? new Set(entry.leadIds) : null;
    const batchLeads = batchLeadIdSet 
      ? leads.filter(l => batchLeadIdSet.has(l._id))
      : leads.filter(l => {
          const q = entry.query.toLowerCase();
          const loc = entry.location.toLowerCase();
          return ((l.category || '').toLowerCase().includes(q) || (l.businessName || '').toLowerCase().includes(q)) &&
                 (l.location || '').toLowerCase().includes(loc);
        });

    if (batchLeads.length === 0) {
      showToast('No leads found for this batch to export.');
      return;
    }

    const headers = ['Business Name', 'Phone', 'Email', 'Website', 'Location', 'Category', 'Rating', 'Reviews', 'Harvested At'];
    const rows = batchLeads.map(l => [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${l.rating || ''}"`,
      `"${l.reviews || ''}"`,
      `"${l.harvestedAt || l.createdAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (entry.query || 'harvest_batch').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `harvest_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${batchLeads.length} leads from this batch to CSV.`);
  };

  useEffect(() => {
    // Immediate hydration from cache
    try {
      const raw = (user?.email && localStorage.getItem(`strovr_leads_cache_${user.email}`)) ||
                  (user?._id && localStorage.getItem(`strovr_leads_cache_${user._id}`));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = filterOutBannedLeads(parsed);
          const tombstones = getDeletedTombstones();
          const valid = clean.filter((l: any) => {
            if (!l) return false;
            if (tombstones.has(l._id)) return false;
            const bName = `name:${(l.businessName || '').toLowerCase().trim()}`;
            if (tombstones.has(bName)) return false;
            return true;
          });
          setLeads(valid);
        }
      }
    } catch {}
    fetchLeads();
    fetchHarvestHistory();
  }, [user?._id, user?.email]);

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead?._id || !user?._id) return;
    setIsSavingEdit(true);
    try {
      await axios.patch(`${API_URL}/api/leads/${editingLead._id}`, {
        businessName: editingLead.businessName,
        email: editingLead.email || '',
        phone: editingLead.phone || '',
        category: editingLead.category || 'General',
        location: editingLead.location || '',
        website: editingLead.website || '',
        status: editingLead.status || 'New'
      }, {
        headers: { 
          userid: user._id || '',
          useremail: user.email || ''
        }
      });

      const nextLeads = leads.map(l => l._id === editingLead._id ? { ...l, ...editingLead } : l);
      updateCache(nextLeads);
      setEditingLead(null);
    } catch (err) {
      console.error('Failed to update lead:', err);
      await alertDialog({
        title: 'Update Error',
        message: 'Failed to update contact details. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const inspectedBatch = harvestHistory.find(h => h.id === inspectedBatchId);
  const batchLeadIds = inspectedBatch && Array.isArray(inspectedBatch.leadIds) ? new Set(inspectedBatch.leadIds) : null;

  const filteredLeads = leads.filter(l => {
    if (batchLeadIds && !batchLeadIds.has(l._id)) return false;
    const q = filterQuery.toLowerCase();
    return (
      (l.businessName || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q) ||
      (l.location || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(filterQuery) ||
      (l.email || '').toLowerCase().includes(q)
    );
  });

  const handlePushHarvestToIntegration = async (appId: string, appName: string) => {
    const targetIds = filteredLeads.map(l => l._id);
    if (targetIds.length === 0) {
      showToast('No harvested leads available to sync.');
      setIsSyncDropdownOpen(false);
      return;
    }

    setSyncingAppId(appId);
    const result = await syncLeadsToIntegration(appId, targetIds);
    setSyncingAppId(null);
    setIsSyncDropdownOpen(false);

    if (result) {
      const idSet = new Set(targetIds);
      setLeads(prev => prev.map(l => {
        if (!idSet.has(l._id)) return l;
        const existing = Array.isArray(l.syncedTo) ? l.syncedTo : [];
        return { ...l, syncedTo: Array.from(new Set([...existing, result.appName])) };
      }));
      showToast(result.deliveryNote || `Pushed ${result.syncedCount} harvested lead(s) to ${result.appName} [200 OK]`);
    } else {
      showToast(`Failed to sync leads to ${appName}.`);
    }
  };

  const handleEnrichHarvestedLead = async (lead: any) => {
    setEnrichingLeadId(lead._id);
    const updatedLead = await enrichLeadViaIntegration(lead._id, activeEnrichApp.id);
    setEnrichingLeadId(null);
    if (updatedLead) {
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, ...updatedLead } : l));
      showToast(`Enriched ${lead.businessName} (${updatedLead.email}) via ${activeEnrichApp.name} [200 OK]`);
    }
  };

  // CSV Import & Stacking
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const parseCsvText = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            cur += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const findCol = (keywords: string[]) => rawHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const nameIdx = findCol(['business', 'company', 'name', 'title', 'brand', 'org', 'listing']);
    const phoneIdx = findCol(['phone', 'mobile', 'cell', 'tel', 'whatsapp', 'number', 'contact']);
    const emailIdx = findCol(['email', 'mail']);
    const locIdx = findCol(['location', 'address', 'city', 'state', 'place', 'area']);
    const catIdx = findCol(['category', 'field', 'industry', 'type', 'niche', 'work']);
    const webIdx = findCol(['website', 'url', 'web', 'link', 'domain', 'site']);
    const ratingIdx = findCol(['rating', 'star', 'score']);

    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || cols.every(c => !c)) continue;

      let bName = nameIdx >= 0 ? cols[nameIdx] : '';
      let phone = phoneIdx >= 0 ? cols[phoneIdx] : '';
      let email = emailIdx >= 0 ? cols[emailIdx] : '';
      let location = locIdx >= 0 ? cols[locIdx] : '';
      let category = catIdx >= 0 ? cols[catIdx] : '';
      let website = webIdx >= 0 ? cols[webIdx] : '';
      let rating = ratingIdx >= 0 ? parseFloat(cols[ratingIdx]) || 0 : 0;

      // Fallbacks if columns were not matched by standard headers
      if (!bName && !email && !phone) {
        for (const col of cols) {
          if (!email && col.includes('@') && col.includes('.')) email = col;
          else if (!phone && col.replace(/[^0-9]/g, '').length >= 8) phone = col;
          else if (!website && (col.startsWith('http') || col.includes('.com') || col.includes('.in'))) website = col;
          else if (!bName && col.length > 2) bName = col;
        }
      }

      if (bName || email || phone) {
        parsed.push({
          businessName: bName || (email ? email.split('@')[0] : `Imported Contact ${i}`),
          phone: phone || '',
          email: email || '',
          location: location || '',
          city: location ? location.split(',')[0].trim() : '',
          category: category || 'General B2B',
          fieldOfWork: category || 'General B2B',
          website: website || '',
          rating: rating || 0,
          status: 'New',
          source: 'CSV Upload'
        });
      }
    }
    return parsed;
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        await alertDialog({
          title: 'Empty File',
          message: 'The selected CSV file contains no data.',
          variant: 'warning'
        });
        return;
      }

      const parsed = parseCsvText(text);
      if (parsed.length === 0) {
        await alertDialog({
          title: 'No Valid Leads Found',
          message: 'Could not extract valid leads from this CSV. Please check that it contains headers like Business Name, Phone, or Email.',
          variant: 'warning'
        });
        return;
      }

      setIsUploadingCsv(true);
      try {
        const res = await axios.post(
          `${API_URL}/api/leads/upload-csv`,
          { leads: parsed },
          {
            headers: {
              userid: user?._id || '',
              useremail: user?.email || ''
            }
          }
        );

        const savedBatch = Array.isArray(res.data?.leads) ? res.data.leads : parsed;
        // Strict stacking: never replace or reset existing leads
        setLeads((prev) => {
          const combined = mergeLeads(prev || [], savedBatch);
          updateCache(combined);
          return combined;
        });

        showToast(`Stacked ${savedBatch.length} lead(s) from CSV into your pipeline!`);
      } catch (err: any) {
        console.error('Failed to upload CSV leads to server:', err);
        // Fallback: stack to client cache so data is never lost
        setLeads((prev) => {
          const combined = mergeLeads(prev || [], parsed);
          updateCache(combined);
          return combined;
        });
        showToast(`Locally stacked ${parsed.length} lead(s) from CSV!`);
      } finally {
        setIsUploadingCsv(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 flex justify-center custom-scrollbar">
          <div className="max-w-[1240px] w-full space-y-8 pb-16">
            
            {toastMessage && (
              <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-3.5 py-2 rounded-md shadow-xl border border-slate-800 text-xs font-delight font-medium flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-charcoal tracking-tight">Lead Finder & Geo-Search</h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Harvest verified public listings, enrich missing decision-maker emails, and push directly to connected CRMs/Sheets.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsSerpModalOpen(true)}
                  className={`px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 shadow-2xs transition-colors cursor-pointer ${
                    serpApiStatus?.isConnected
                      ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  title="SerpApi Google Maps extraction engine settings"
                >
                  <Compass className={`w-4 h-4 ${serpApiStatus?.isConnected ? 'text-emerald-600' : 'text-slate-600'}`} />
                  <span>
                    {serpApiStatus?.isConnected ? 'SerpApi Engine: Active' : 'Connect SerpApi'}
                  </span>
                  {serpApiStatus?.isConnected && !isFree && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded">
                      {serpApiStatus.account?.plan_name || 'Free'} Tier
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => navigate('/audience')}
                  className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Users2 className="w-4 h-4 text-blue-600" />
                  <span>Audience &amp; Contacts Hub &rarr;</span>
                </button>
              </div>
            </div>

            {/* Extraction Wizard */}
            <LeadFinderWizard onHarvestStarted={() => { fetchLeads(); fetchHarvestHistory(); }} />

            {/* HARVESTED SEARCH RESULTS & HARVEST HISTORY */}
            <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
              {/* Top View Selector Tabs */}
              <div className="px-4 pt-3 pb-0 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFinderTab('listings')}
                    className={`px-3.5 py-2 text-xs font-delight font-medium border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                      activeFinderTab === 'listings'
                        ? 'border-slate-900 text-slate-900 font-bold bg-white rounded-t-md shadow-2xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Harvested Listings</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono font-bold">
                      {filteredLeads.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveFinderTab('history');
                      fetchHarvestHistory();
                    }}
                    className={`px-3.5 py-2 text-xs font-delight font-medium border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                      activeFinderTab === 'history'
                        ? 'border-slate-900 text-slate-900 font-bold bg-white rounded-t-md shadow-2xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    <span>Harvest History &amp; Logs</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-mono font-bold">
                      {harvestHistory.length}
                    </span>
                  </button>
                </div>

                {activeFinderTab === 'listings' && inspectedBatch && (
                  <div className="flex items-center gap-2 text-xs font-delight text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md mb-1.5">
                    <span className="font-semibold">Batch: {inspectedBatch.query} ({inspectedBatch.location})</span>
                    <button
                      type="button"
                      onClick={() => setInspectedBatchId(null)}
                      className="text-[11px] underline hover:text-blue-900 cursor-pointer ml-1 font-bold"
                    >
                      Show All ({leads.length})
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: HARVESTED LISTINGS */}
              {activeFinderTab === 'listings' && (
                <div>
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider font-delight text-slate-500">Harvested Listings</h2>
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-sm text-[10px] font-delight font-bold">
                      {filteredLeads.length} Total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Multi-line name wrapping enabled. Push harvested batches to connected apps or enrich emails in 1 click.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Push Harvest to Connected App */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSyncDropdownOpen(prev => !prev)}
                      className="h-8 px-3 bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200 rounded-md font-delight text-xs text-blue-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Push to Connected App</span>
                    </button>

                    {isSyncDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-40 p-1.5 space-y-1 animate-in fade-in">
                        <div className="px-2 py-1 text-[10px] font-delight font-semibold uppercase text-slate-400 border-b border-slate-100">
                          Connected Sync Targets ({connectedSyncApps.length})
                        </div>
                        {connectedSyncApps.length > 0 ? (
                          connectedSyncApps.map(app => (
                            <button
                              key={app.id}
                              type="button"
                              disabled={syncingAppId === app.id}
                              onClick={() => handlePushHarvestToIntegration(app.id, app.name)}
                              className="w-full px-2.5 py-2 text-left rounded-md hover:bg-blue-50/60 text-xs font-delight font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="font-semibold">{app.name}</span>
                              <span className="text-[10px] text-blue-600 font-bold">
                                {syncingAppId === app.id ? 'Syncing...' : 'Push →'}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-[11px] text-slate-500">
                            No CRM or Spreadsheet connected yet.
                          </div>
                        )}
                        <div className="pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => navigate('/integrations')}
                            className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-slate-50 text-[11px] font-delight font-medium text-slate-500 hover:text-blue-600 flex items-center justify-between cursor-pointer"
                          >
                            <span>+ Connect Sheets / CRM</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Import Leads via CSV */}
                  <button
                    type="button"
                    disabled={isUploadingCsv}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-delight text-xs text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                    title="Upload and stack leads from CSV file"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isUploadingCsv ? 'Stacking CSV...' : 'Import CSV'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCsvFileChange}
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                  />

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Filter harvested listings..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium outline-none focus:border-slate-400 w-56 font-sans text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-gray-400 font-bold">
                  Loading harvested search listings...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-xs font-bold text-gray-500">No leads found for this search yet.</p>
                  <p className="text-[11px] text-gray-400">Launch the Harvest Wizard above to scrape verified business listings.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500 uppercase tracking-wider font-delight">
                      <tr>
                        <th className="py-4 px-6 min-w-[320px] max-w-[460px] font-medium">Business Name, Website &amp; Email</th>
                        <th className="py-4 px-5 font-medium">Direct Phone / WhatsApp</th>
                        <th className="py-4 px-5 font-medium">Category</th>
                        <th className="py-4 px-5 font-medium">Location</th>
                        <th className="py-4 px-5 font-medium">Rating</th>
                        <th className="py-4 px-5 font-medium">Status &amp; Sync</th>
                        <th className="py-4 px-6 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((lead) => (
                        <tr key={lead._id} className="hover:bg-indigo-50/30 transition-colors">
                          {/* Business Name with natural wrapping and generous padding */}
                          <td className="py-5 px-6 min-w-[320px] max-w-[460px] align-middle">
                            <div className="font-delight font-medium text-[13px] text-slate-900 leading-normal tracking-normal break-words whitespace-normal">
                              {lead.businessName}
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 mt-2">
                              {lead.website ? (
                                <a 
                                  href={lead.website} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1.5 truncate max-w-[220px] font-delight font-medium"
                                >
                                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic font-delight">No website</span>
                              )}

                              {lead.email ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-delight font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>{lead.email}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={enrichingLeadId === lead._id}
                                  onClick={() => handleEnrichHarvestedLead(lead)}
                                  className="inline-flex items-center gap-1 text-[10px] font-delight font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded border border-violet-200/80 cursor-pointer transition-colors"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-violet-600" />
                                  <span>{enrichingLeadId === lead._id ? 'Enriching...' : `Enrich (${activeEnrichApp.name})`}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-5 px-5 font-delight font-medium text-charcoal align-middle">
                            {lead.phone ? (
                              <a 
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline flex items-center gap-1.5 font-medium"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{lead.phone}</span>
                              </a>
                            ) : (
                              <span className="text-gray-300 italic text-[11px]">No phone listed</span>
                            )}
                          </td>

                          <td className="py-5 px-5 align-middle">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-delight font-medium">
                              {lead.category || 'Local B2B'}
                            </span>
                          </td>

                          <td className="py-5 px-5 text-gray-600 text-[11px] font-delight font-medium align-middle">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{lead.location}</span>
                            </div>
                          </td>

                          <td className="py-5 px-5 align-middle">
                            <div className="flex items-center gap-1 text-amber-500 font-delight font-medium text-xs">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{lead.rating || '4.8'}</span>
                            </div>
                          </td>

                          <td className="py-5 px-5 align-middle">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="px-2 py-0.5 rounded-sm text-[10px] font-delight font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                {lead.status || 'New'}
                              </span>
                              {Array.isArray(lead.syncedTo) && lead.syncedTo.map((appBadge: string) => (
                                <span
                                  key={appBadge}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-delight font-medium"
                                >
                                  <Check className="w-2.5 h-2.5" />
                                  <span>{appBadge}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-5 px-6 text-right align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingLead({ ...lead })}
                                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-delight font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Edit contact name & coordinates"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              
                              <button
                                onClick={() => navigate('/audience')}
                                className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-delight font-medium transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-900"
                                title="Manage in Contacts Hub"
                              >
                                <span>Contacts</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </div>
              )}

              {/* TAB 2: HARVEST HISTORY & LOGS */}
              {activeFinderTab === 'history' && (
                <div>
                  <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider font-delight text-slate-600">Harvest Execution History</h2>
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded-sm text-[10px] font-delight font-bold">
                          {harvestHistory.length} Batches
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Audit trail of all scraping and CSV import batches with token expenditure and 1-click batch CSV exports.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={fetchHarvestHistory}
                      className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-delight text-xs text-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Refresh harvest history"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Refresh History</span>
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="py-16 text-center text-xs text-gray-400 font-bold">
                      Loading harvest history logs...
                    </div>
                  ) : harvestHistory.length === 0 ? (
                    <div className="py-16 text-center space-y-2 font-delight">
                      <p className="text-xs font-bold text-gray-500">No harvest batches logged yet.</p>
                      <p className="text-[11px] text-gray-400">Launch a search above or import a CSV to generate a harvest history entry.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500 uppercase tracking-wider font-delight">
                          <tr>
                            <th className="py-3.5 px-4 w-12 text-center text-slate-400 font-mono">#</th>
                            <th className="py-3.5 px-6 min-w-[220px] font-medium">Search Query &amp; Market</th>
                            <th className="py-3.5 px-5 font-medium">Scope / Mode</th>
                            <th className="py-3.5 px-5 font-medium text-center">Leads Harvested</th>
                            <th className="py-3.5 px-5 font-medium text-center">Tokens Used</th>
                            <th className="py-3.5 px-5 font-medium">Execution Time</th>
                            <th className="py-3.5 px-5 font-medium text-center">Status</th>
                            <th className="py-3.5 px-6 text-right font-medium">Batch Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {harvestHistory.map((entry, index) => (
                            <tr key={entry.id || index} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>
                              <td className="py-4 px-6 min-w-[220px]">
                                <div className="font-delight font-bold text-slate-900 text-[13px]">
                                  {entry.query}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-delight">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{entry.location || 'Local Target'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                                  entry.mode === 'csv' 
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                    : entry.scope === 'deep' 
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}>
                                  {entry.scope ? `${entry.scope} Extraction` : entry.mode === 'csv' ? 'CSV Import' : 'Quick Scan'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-center">
                                <span className="font-mono font-bold text-xs text-slate-900 px-2 py-0.5 bg-slate-100 rounded-sm border border-slate-200">
                                  {entry.leadCount} leads
                                </span>
                              </td>
                              <td className="py-4 px-5 text-center">
                                <span className="font-mono text-xs text-slate-600">
                                  {entry.tokensUsed ?? entry.leadCount ?? 0} tokens
                                </span>
                              </td>
                              <td className="py-4 px-5 text-slate-500 text-[11px]">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Recently'}
                              </td>
                              <td className="py-4 px-5 text-center">
                                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Completed ✓
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleInspectBatch(entry)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-delight font-medium text-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Inspect only the leads in this batch"
                                  >
                                    <Filter className="w-3 h-3 text-slate-500" />
                                    <span>Inspect</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleExportBatchCsv(entry, e)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-delight font-medium text-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Export leads in this batch to CSV"
                                  >
                                    <Download className="w-3 h-3 text-slate-500" />
                                    <span>Export</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteHistoryEntry(entry.id, e)}
                                    className="p-1 rounded bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                                    title="Delete this history log"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ================= MODAL: EDIT HARVESTED LEAD ================= */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-md shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Edit Contact Details</h3>
                  <p className="text-[11px] font-delight font-normal text-slate-400">Shorten long titles or add direct contact info</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingLead(null)} 
                className="w-7 h-7 rounded-md bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">
                  Business / Listing Title *
                </label>
                <textarea 
                  rows={2}
                  required
                  value={editingLead.businessName || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, businessName: e.target.value })}
                  placeholder="e.g. Digital Keddy"
                  className="w-full p-2 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400 leading-snug"
                />
                <span className="text-[10px] text-slate-400 font-delight font-normal">
                  Tip: Shorten long Google Places keyword titles to the core brand name.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Phone / WhatsApp</label>
                  <input 
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Direct Email</label>
                  <input 
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    placeholder="contact@business.com"
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Category</label>
                  <input 
                    type="text"
                    value={editingLead.category || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, category: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Location</label>
                  <input 
                    type="text"
                    value={editingLead.location || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, location: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Website URL</label>
                <input 
                  type="url"
                  value={editingLead.website || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-delight font-semibold text-slate-600 mb-1">Pipeline Stage</label>
                <select
                  value={editingLead.status || 'New'}
                  onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-md text-xs font-delight font-medium outline-none focus:border-slate-400 bg-white cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="WhatsApp Contacted">WhatsApp Contacted</option>
                  <option value="Replied / Awaiting Email">Replied / Awaiting Email</option>
                  <option value="Email Verified & Captured">Email Verified & Captured</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Closed Won">Closed Won</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setEditingLead(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 font-delight font-medium text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md font-delight font-medium text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-900 cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SerpApi Engine Connection Modal */}
      <SerpApiConnectModal
        isOpen={isSerpModalOpen}
        onClose={() => setIsSerpModalOpen(false)}
        user={user}
        onConnected={() => fetchSerpStatus()}
      />
    </div>
  );
};

export default LeadFinder;
