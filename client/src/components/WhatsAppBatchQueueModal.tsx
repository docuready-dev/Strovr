import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  X, Send, CheckCircle2, ChevronRight, ChevronLeft, 
  ExternalLink, Phone, Copy, Check, ShieldCheck, 
  Paperclip, FileText, Image, RefreshCw, AlertCircle, Play, CheckCheck
} from 'lucide-react';
import API_URL from '../config/api';

export interface WhatsAppLeadItem {
  _id?: string;
  businessName: string;
  location?: string;
  category?: string;
  fieldOfWork?: string;
  firstName?: string;
  phone?: string;
  rating?: string;
  email?: string;
  status?: string;
}

interface WhatsAppBatchQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: WhatsAppLeadItem[];
  whatsAppMessage: string;
  whatsAppImage?: {
    enabled: boolean;
    url?: string;
    caption?: string;
    fileName?: string;
  };
  whatsAppPdf?: {
    enabled: boolean;
    url?: string;
    fileName?: string;
    fileSize?: string;
    pageCount?: string;
  };
  resolvedBookingUrl?: string;
  user: any;
  onLeadsUpdated?: () => void;
}

const WhatsAppBatchQueueModal = ({
  isOpen,
  onClose,
  leads,
  whatsAppMessage,
  whatsAppImage,
  whatsAppPdf,
  resolvedBookingUrl = 'https://www.strovr.space/appointments',
  user,
  onLeadsUpdated
}: WhatsAppBatchQueueModalProps) => {
  // Filter leads with valid phone numbers (at least 7 digits)
  const validLeads = useMemo(() => {
    return leads.filter(l => {
      const clean = (l.phone || '').replace(/[^0-9]/g, '');
      return clean.length >= 7;
    });
  }, [leads]);

  // Queue state
  const [batchLimit, setBatchLimit] = useState<number>(30);
  const [selectedLeads, setSelectedLeads] = useState<WhatsAppLeadItem[]>([]);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Initialize selected leads when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = validLeads.slice(0, batchLimit);
      setSelectedLeads(initial);
      setIsStarted(false);
      setCurrentIndex(0);
      setContactedIds(new Set());
      setSkippedIds(new Set());
      setCopiedText(false);
    }
  }, [isOpen, validLeads, batchLimit]);

  if (!isOpen) return null;

  const activeLead = selectedLeads[currentIndex];
  const isFinished = isStarted && currentIndex >= selectedLeads.length;

  // Compile hydrated message for a specific prospect
  const compileMessage = (lead: WhatsAppLeadItem) => {
    let msg = whatsAppMessage || '';
    const bName = lead.businessName || 'Business';
    const loc = lead.location || 'Local Area';
    const fow = lead.fieldOfWork || lead.category || 'Services';
    const tag = lead.category || lead.fieldOfWork || 'Services';
    const fName = lead.firstName || (lead.businessName ? lead.businessName.split(' ')[0] : 'Partner');
    const phone = lead.phone || '';
    const rating = lead.rating || '4.8';

    msg = msg.replace(/{{business_name}}/g, bName);
    msg = msg.replace(/{{location}}/g, loc);
    msg = msg.replace(/{{field_of_work}}/g, fow);
    msg = msg.replace(/{{tag}}/g, tag);
    msg = msg.replace(/{{first_name}}/g, fName);
    msg = msg.replace(/{{phone}}/g, phone);
    msg = msg.replace(/{{rating}}/g, rating);
    msg = msg.replace(/{{(booking_link|calendly_link|appointment_link)}}/g, `Book an Appointment : ${resolvedBookingUrl}`);

    // Append Media Attachments cleanly
    const mediaItems: string[] = [];
    if (whatsAppPdf?.enabled) {
      const cleanPdfName = String(whatsAppPdf.fileName || 'Overview.pdf').replace(/{{business_name}}/g, bName);
      if (whatsAppPdf.url && (whatsAppPdf.url.startsWith('http://') || whatsAppPdf.url.startsWith('https://'))) {
        mediaItems.push(`📄 *Document Attached:* ${cleanPdfName} (${whatsAppPdf.fileSize || 'PDF'})\n🔗 Link: ${whatsAppPdf.url}`);
      } else {
        mediaItems.push(`📄 *Document Attached:* ${cleanPdfName} (${whatsAppPdf.fileSize || 'PDF'})`);
      }
    }
    if (whatsAppImage?.enabled) {
      const captionStr = whatsAppImage.caption ? ` (${whatsAppImage.caption})` : '';
      const cleanImgName = whatsAppImage.fileName || 'Visual Preview';
      if (whatsAppImage.url && (whatsAppImage.url.startsWith('http://') || whatsAppImage.url.startsWith('https://'))) {
        mediaItems.push(`🖼️ *Visual Preview:* ${cleanImgName}${captionStr}\n🔗 Link: ${whatsAppImage.url}`);
      } else {
        mediaItems.push(`🖼️ *Visual Preview:* ${cleanImgName}${captionStr}`);
      }
    }

    if (mediaItems.length > 0) {
      msg += `\n\n────────────────\n📎 *Deliverables & Media Attached:*\n\n` + mediaItems.join('\n\n');
    }

    return msg;
  };

  // Clean phone number for WhatsApp wa.me
  const getCleanPhone = (phoneStr?: string) => {
    let clean = (phoneStr || '').replace(/[^0-9]/g, '');
    // If standard 10 digits without country code, default to India (91)
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return clean;
  };

  // Mark lead as Contacted in CRM backend
  const markAsContacted = async (lead: WhatsAppLeadItem) => {
    if (!lead._id || !user?._id) return;
    setIsUpdatingStatus(true);
    try {
      await axios.patch(
        `${API_URL}/api/leads/${lead._id}`,
        {
          status: 'Contacted',
          lastContactedAt: new Date().toISOString(),
          lastChannel: 'whatsapp'
        },
        {
          headers: { userid: user._id }
        }
      );
    } catch (err) {
      console.warn('Failed to patch lead status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open in WhatsApp Web & advance to next lead
  const handleSendAndAdvance = async () => {
    if (!activeLead) return;

    const cleanPhone = getCleanPhone(activeLead.phone);
    const message = compileMessage(activeLead);
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    // Open WhatsApp Web in new tab
    window.open(url, '_blank');

    // Update state
    if (activeLead._id) {
      setContactedIds(prev => new Set(prev).add(activeLead._id!));
      markAsContacted(activeLead);
    }

    // Advance
    setCurrentIndex(prev => prev + 1);
  };

  // Skip current contact
  const handleSkip = () => {
    if (activeLead?._id) {
      setSkippedIds(prev => new Set(prev).add(activeLead._id!));
    }
    setCurrentIndex(prev => prev + 1);
  };

  // Go back to previous contact
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Copy current message text
  const handleCopyCurrent = () => {
    if (!activeLead) return;
    const message = compileMessage(activeLead);
    navigator.clipboard.writeText(message);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Close and notify parent
  const handleClose = () => {
    if (contactedIds.size > 0 && onLeadsUpdated) {
      onLeadsUpdated();
    }
    onClose();
  };

  const currentMessage = activeLead ? compileMessage(activeLead) : '';
  const progressPercent = selectedLeads.length > 0 
    ? Math.round((currentIndex / selectedLeads.length) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-[#191716]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E0D5] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#191716] animate-in fade-in duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D5] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E6B52] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#191716] font-delight tracking-tight">
                  WhatsApp Batch Outreach Queue
                </h3>
                <span className="text-xs font-delight font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Click-to-Send Relay
                </span>
              </div>
              <p className="text-xs font-delight text-[#78716A] mt-0.5">
                Reach up to 30 contacts natively via WhatsApp Web · 100% free · Account safe
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleClose} 
            className="text-[#78716A] hover:text-[#191716] p-1.5 rounded-lg hover:bg-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* SCREEN 1: PRE-FLIGHT AUDIENCE SETUP                            */}
        {/* ============================================================== */}
        {!isStarted && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#191716] font-delight">
                01. Configure Outreach Batch
              </h4>
              <p className="text-xs text-[#57524B]">
                Strovr has audited your harvested audience. Valid phone numbers are automatically formatted for the WhatsApp Web bridge.
              </p>
            </div>

            {/* Batch Size Selector */}
            <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-delight font-bold text-[#191716]">
                  Select Target Batch Size
                </label>
                <span className="text-xs font-delight text-emerald-800 font-semibold">
                  {validLeads.length} phone-verified leads in workspace
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, Math.min(50, validLeads.length)].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setBatchLimit(count);
                      setSelectedLeads(validLeads.slice(0, count));
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-delight font-semibold transition-all cursor-pointer ${
                      batchLimit === count
                        ? 'bg-[#1E6B52] text-white border-[#1E6B52] shadow-xs'
                        : 'bg-white border-[#E5E0D5] hover:border-slate-400 text-[#57524B]'
                    }`}
                  >
                    <span>{count} Contacts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Contacts Preview List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-delight font-semibold text-[#57524B]">
                <span>Queue Preview ({selectedLeads.length} Recipients)</span>
                <span>Sorted by Harvest Date</span>
              </div>

              <div className="border border-[#E5E0D5] rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto custom-scrollbar divide-y divide-[#F5F2EB]">
                {selectedLeads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#78716A]">
                    No leads with valid phone numbers found. Harvest prospects in Lead Finder first.
                  </div>
                ) : (
                  selectedLeads.map((lead, idx) => (
                    <div key={lead._id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAF8F5] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 text-[11px] font-mono text-[#78716A] text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#191716] truncate">{lead.businessName}</div>
                          <div className="text-[11px] text-[#78716A] truncate">
                            {lead.category || 'Business'} · {lead.location || 'Location'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-[#1E6B52] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {lead.phone}
                        </span>
                        <span className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-delight">
                          {lead.status || 'New'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Operational Note */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#1E6B52] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">How the Queue Runner Works</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Clicking <strong>&ldquo;Start Queue Runner&rdquo;</strong> will load each contact one-by-one. For each contact, Strovr prepares the personalized message with attached deliverables and provides an <strong>&ldquo;Open &amp; Send on WhatsApp&rdquo;</strong> button that immediately opens WhatsApp Web and advances to the next contact.
                </p>
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              disabled={selectedLeads.length === 0}
              onClick={() => setIsStarted(true)}
              className="w-full py-3 bg-[#1E6B52] hover:bg-[#165440] disabled:opacity-50 text-white rounded-xl font-delight font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Queue Runner ({selectedLeads.length} Contacts)</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: ACTIVE QUEUE RUNNER                                  */}
        {/* ============================================================== */}
        {isStarted && !isFinished && activeLead && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Progress Bar & Counters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-delight">
                <span className="font-bold text-[#191716]">
                  Contact {currentIndex + 1} of {selectedLeads.length}
                </span>
                <div className="flex items-center gap-3 text-[#57524B]">
                  <span>Contacted: <strong className="text-emerald-700">{contactedIds.size}</strong></span>
                  <span>Skipped: <strong className="text-slate-600">{skippedIds.size}</strong></span>
                  <span>Remaining: <strong>{selectedLeads.length - currentIndex}</strong></span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-[#E5E0D5]">
                <div 
                  className="h-full bg-[#1E6B52] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Current Recipient Card */}
            <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#191716] font-delight">
                      {activeLead.businessName}
                    </h4>
                    {activeLead.status === 'Contacted' && (
                      <span className="text-[10px] font-delight font-bold px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Previously Contacted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#57524B] mt-0.5">
                    {activeLead.category || 'Industry'} · {activeLead.location || 'Location'} {activeLead.firstName ? `· Attn: ${activeLead.firstName}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E0D5] rounded-lg text-xs font-mono font-bold text-[#1E6B52] shadow-2xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeLead.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Preview for this lead */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-delight font-semibold text-[#57524B]">
                <span>Live Hydrated Message for {activeLead.businessName}</span>
                <button
                  type="button"
                  onClick={handleCopyCurrent}
                  className="text-[#1E6B52] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-white border border-[#E5E0D5] rounded-xl max-h-48 overflow-y-auto custom-scrollbar font-mono text-xs text-[#191716] whitespace-pre-wrap leading-relaxed shadow-2xs">
                {currentMessage}
              </div>
            </div>

            {/* Media Attached Indicators */}
            {(whatsAppPdf?.enabled || whatsAppImage?.enabled) && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-[#57524B] font-delight">
                <span className="text-[#78716A]">Deliverables included in link:</span>
                {whatsAppPdf?.enabled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md font-medium text-[11px]">
                    <FileText className="w-3 h-3" />
                    <span>PDF Deck</span>
                  </span>
                )}
                {whatsAppImage?.enabled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md font-medium text-[11px]">
                    <Image className="w-3 h-3" />
                    <span>Visual Asset</span>
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-3 py-2 bg-white hover:bg-[#FAF8F5] disabled:opacity-40 border border-[#E5E0D5] text-[#57524B] rounded-xl text-xs font-delight font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-[#E5E0D5] text-[#57524B] rounded-xl text-xs font-delight font-semibold transition-colors cursor-pointer"
                >
                  Skip Contact &rarr;
                </button>

                <button
                  type="button"
                  onClick={handleSendAndAdvance}
                  className="px-5 py-2.5 bg-[#1E6B52] hover:bg-[#165440] text-white rounded-xl text-xs font-delight font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp Web &amp; Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: BATCH COMPLETE SUMMARY                               */}
        {/* ============================================================== */}
        {isFinished && (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1E6B52] flex items-center justify-center shadow-xs">
              <CheckCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#191716] font-delight">
                WhatsApp Batch Completed!
              </h4>
              <p className="text-xs text-[#57524B] max-w-sm mx-auto leading-relaxed">
                You have reached <strong>{contactedIds.size} of {selectedLeads.length}</strong> selected contacts. Lead statuses in your CRM Pipeline have been updated to <strong>&ldquo;Contacted&rdquo;</strong>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2 text-xs font-delight">
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl text-center">
                <div className="text-lg font-bold text-[#1E6B52]">{contactedIds.size}</div>
                <div className="text-[#78716A] text-[11px]">Messages Sent</div>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl text-center">
                <div className="text-lg font-bold text-slate-700">{skippedIds.size}</div>
                <div className="text-[#78716A] text-[11px]">Skipped</div>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl text-center">
                <div className="text-lg font-bold text-[#191716]">{selectedLeads.length}</div>
                <div className="text-[#78716A] text-[11px]">Total In Queue</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 bg-[#191716] hover:bg-[#C85A32] text-white rounded-xl text-xs font-delight font-bold transition-colors cursor-pointer"
            >
              Done &amp; Return to Studio
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default WhatsAppBatchQueueModal;
