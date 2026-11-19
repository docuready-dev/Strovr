import { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Mail, Send, CheckCircle2, ChevronDown, Layout,
  ShieldCheck, Tag, Check, Loader2, ExternalLink,
  Plus, Trash2, Upload, FileText, Paperclip, Download, Copy, History,
  Sparkles, Split, UserCheck, Clock, SlidersHorizontal,
  ShieldAlert, RefreshCw, Eye
} from 'lucide-react';
import TemplateGalleryModal from '../components/TemplateGalleryModal';
import DispatchTrackerModal from '../components/DispatchTrackerModal';
import EmailProviderModal from '../components/EmailProviderModal';
import SentEmailHistoryModal from '../components/SentEmailHistoryModal';
import { EMAIL_TEMPLATES } from '../data/emailTemplates';
import type { TemplateId } from '../data/emailTemplates';
import { useStore } from '../store/useStore';
import { alertDialog } from '../components/AppConfirmModal';
import axios from 'axios';
import API_URL from '../config/api';

const SPAM_TRIGGER_WORDS = [
  '100% free', 'make money', 'risk-free', 'buy now', 'click below', 
  'guaranteed', 'instant cash', 'miracle', 'no catch', 'act immediately', 
  'winner', 'earn cash', 'special promotion'
];

const OutreachCenter = () => {
  const { user, token, integrations, setUpgradeModalOpen, recordEmailDispatch, recordAiGeneration } = useStore();

  const defaultBookingHost = localStorage.getItem('strovr_booking_host') || localStorage.getItem('leadpulse_booking_host') || (typeof window !== 'undefined' ? `${window.location.origin}/appointments` : '/appointments');
  const calendarIntegration = integrations.find(i => (i.id === 'google-calendar' || i.id === 'calendly') && i.connected);
  const [bookingHostUrl, setBookingHostUrl] = useState<string>(
    calendarIntegration?.config?.appointmentScheduleUrl || calendarIntegration?.config?.bookingUrl || defaultBookingHost
  );

  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/booking/status`, { 
          headers: { userid: user?._id },
          timeout: 3500 
        });
        if (res.data?.publicUrl && !calendarIntegration?.config?.appointmentScheduleUrl) {
          setBookingHostUrl(res.data.publicUrl);
        }
      } catch {}
    };
    checkBookingStatus();
  }, [user?._id, calendarIntegration]);

  const resolvedBookingUrl = bookingHostUrl;

  // Template Studio State
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('one_column');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [dispatchNotification, setDispatchNotification] = useState<{ message: string; previewUrl?: string } | null>(null);
  const [editorLayer, setEditorLayer] = useState<'content' | 'styling' | 'deliverability'>('content');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Connected Sending Mailbox State
  const [connectedMailbox, setConnectedMailbox] = useState<any>(null);
  const [isLoadingMailbox, setIsLoadingMailbox] = useState(false);

  const fetchMailboxStatus = async () => {
    if (!user?._id) return;
    setIsLoadingMailbox(true);
    try {
      const headers: Record<string, string> = { userid: user._id };
      if (user.email) headers.useremail = user.email;
      const activeToken = token || useStore.getState().token;
      if (activeToken) headers.authorization = `Bearer ${activeToken}`;

      const res = await axios.get(`${API_URL}/api/outreach/mailbox`, { headers });
      if (res.data?.isConnected && res.data.mailbox) {
        setConnectedMailbox(res.data.mailbox);
      } else {
        setConnectedMailbox(null);
      }
    } catch (err) {
      console.error('Failed to fetch mailbox status:', err);
      setConnectedMailbox(null);
    } finally {
      setIsLoadingMailbox(false);
    }
  };

  useEffect(() => {
    fetchMailboxStatus();
  }, [user?._id]);

  // Active Template Data State (Variant A & Variant B)
  const [templateDataA, setTemplateDataA] = useState(EMAIL_TEMPLATES.one_column.defaultData);
  const [templateDataB, setTemplateDataB] = useState({
    ...EMAIL_TEMPLATES.one_column.defaultData,
    subject: 'Challenger Angle: Quick growth proposal for {{business_name}}',
    preheader: 'Tailored strategy note for {{business_name}}',
    headline: 'High-Converting Variant B Proposition',
    ctaText: 'Claim Growth Slot'
  });
  const [isAbTesting, setIsAbTesting] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  const templateData = (isAbTesting && activeVariant === 'B') ? templateDataB : templateDataA;
  const setTemplateData = (updater: any) => {
    if (isAbTesting && activeVariant === 'B') {
      setTemplateDataB(updater);
    } else {
      setTemplateDataA(updater);
    }
  };

  // Feature 2: Smart 3-Step Follow-Up Sequence (Toggle Enabled)
  const [enableFollowUpSequence, setEnableFollowUpSequence] = useState(false);
  const [activeSequenceStep, setActiveSequenceStep] = useState<1 | 2 | 3>(1);
  const [followUpStep2, setFollowUpStep2] = useState({
    delayDays: 3,
    subject: 'Quick bump regarding {{business_name}}',
    body: `Hi {{first_name}},\n\nWanted to quickly follow up on the note I sent earlier this week regarding growth opportunities for {{business_name}} in {{location}}.\n\nI know inboxes get flooded — did you have a quick 5 minutes to connect this Thursday or Friday?\n\nBest regards,\n{{sender_name}}`
  });
  const [followUpStep3, setFollowUpStep3] = useState({
    delayDays: 5,
    subject: 'Closing the loop: {{business_name}}',
    body: `Hi {{first_name}},\n\nI haven't heard back, so I assume timing isn't right for {{business_name}} right now — totally understand!\n\nI'll close the loop for now so I don't clutter your inbox. If you ever want to revisit this or explore local lead acquisition down the road, feel free to book a slot directly: {{booking_link}}\n\nWishing you and the {{business_name}} team continued success,\n{{sender_name}}`
  });

  // Feature 3: Executive Email Signature Builder (Toggle Enabled)
  const [enableSignature, setEnableSignature] = useState(true);
  const [signatureName, setSignatureName] = useState(user?.name || 'Growth Specialist');
  const [signatureTitle, setSignatureTitle] = useState(localStorage.getItem('strovr_sig_title') || 'Growth & Partnerships Lead');
  const [signatureCompany, setSignatureCompany] = useState(localStorage.getItem('strovr_sig_company') || user?.company_name || 'Enterprise Suite');
  const [signaturePhone, setSignaturePhone] = useState(localStorage.getItem('strovr_sig_phone') || (user as any)?.phone || '');
  const [signatureIncludeBooking, setSignatureIncludeBooking] = useState(true);

  // Feature 4: High-Deliverability Inbox Placement Engine (Toggles)
  const [plainTextMode, setPlainTextMode] = useState(false);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [antiSpamJitter, setAntiSpamJitter] = useState(true);
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(true);
  const [enableTagFallback, setEnableTagFallback] = useState(true);

  // Universal Email Attachments State
  const [emailAttachments, setEmailAttachments] = useState<Array<{
    id: string;
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'image' | 'doc' | 'sheet';
    url: string;
    base64?: string;
    enabled: boolean;
  }>>([]);
  const emailFileInputRef = useRef<HTMLInputElement>(null);

  // Template Styling Layer Settings
  const [templateStyling, setTemplateStyling] = useState({
    containerWidth: '600px',
    spacingPadding: '24px',
    accentColor: '#191716',
    borderRadius: '6px',
    showComplianceFooter: true
  });

  // Dynamic workspace profile fallback when user has not harvested leads yet
  const workspaceProfileLead = {
    _id: 'workspace-profile',
    businessName: user?.company_name || (user?.name ? `${user.name} Workspace` : 'Your Target Prospect'),
    location: user?.target_audience || 'Target Market',
    category: user?.field_of_work || user?.niche || 'B2B Services',
    fieldOfWork: user?.field_of_work || user?.niche || 'B2B Services',
    firstName: user?.name ? user.name.split(' ')[0] : 'Partner',
    phone: '+1 (555) 019-2831',
    rating: '5.0',
    email: user?.email || 'contact@yourcompany.com'
  };

  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [selectedPreviewLead, setSelectedPreviewLead] = useState<any | null>(null);
  const previewLead = selectedPreviewLead || leadsList[0] || workspaceProfileLead;
  const setPreviewLead = (lead: any) => setSelectedPreviewLead(lead);
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [dropdownAlign, setDropdownAlign] = useState<'left' | 'right'>('right');
  const leadDropdownRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);

  const handleToggleLeadDropdown = () => {
    if (!isLeadDropdownOpen && leadDropdownRef.current && previewCardRef.current) {
      const btnRect = leadDropdownRef.current.getBoundingClientRect();
      const cardRect = previewCardRef.current.getBoundingClientRect();
      if (btnRect.right - 320 < cardRect.left + 8) {
        setDropdownAlign('left');
      } else {
        setDropdownAlign('right');
      }
    }
    setIsLeadDropdownOpen(prev => !prev);
  };

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (leadDropdownRef.current && previewCardRef.current) {
        const btnRect = leadDropdownRef.current.getBoundingClientRect();
        const cardRect = previewCardRef.current.getBoundingClientRect();
        if (btnRect.right - 320 < cardRect.left + 8) {
          setDropdownAlign('left');
        } else {
          setDropdownAlign('right');
        }
      }
    };

    if (isLeadDropdownOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isLeadDropdownOpen]);

  const [selectedCalendarSlot, setSelectedCalendarSlot] = useState(0);

  // Fetch real leads from DB
  const fetchUserLeads = async () => {
    if (!user?._id && !user?.email) return;
    try {
      const res = await axios.get(`${API_URL}/api/leads`, {
        headers: { 
          userid: user?._id || '',
          useremail: user?.email || ''
        }
      });
      let rawLeads = Array.isArray(res.data) ? res.data : [];
      if (rawLeads.length === 0) {
        try {
          const raw = (user?.email && localStorage.getItem(`strovr_leads_cache_${user.email}`)) ||
                      (user?._id && localStorage.getItem(`strovr_leads_cache_${user._id}`));
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) rawLeads = parsed;
          }
        } catch {}
      }

      if (rawLeads.length > 0) {
        const mapped = rawLeads.map((l: any) => ({
          _id: l._id,
          businessName: l.businessName || 'Unnamed Business',
          location: l.location || user?.target_audience || 'Local Market',
          category: l.category || 'Local Business',
          fieldOfWork: l.category || 'Professional Services',
          firstName: l.businessName ? l.businessName.split(' ')[0] : 'Partner',
          phone: l.phone || '',
          rating: l.rating || '4.8',
          email: l.email || `contact@${(l.businessName || 'company').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          status: l.status || 'New'
        }));
        setLeadsList(mapped);
        setSelectedPreviewLead((prev: any) => prev || mapped[0]);
      } else {
        setLeadsList([]);
        setSelectedPreviewLead(null);
      }
    } catch (err) {
      console.error('Failed to load leads for preview', err);
    }
  };

  useEffect(() => {
    fetchUserLeads();
  }, [user?._id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) {
        setIsLeadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableLeads = leadsList;
  const filteredAvailableLeads = availableLeads.filter(l => 
    l.businessName.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
    l.location.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
    (l.category && l.category.toLowerCase().includes(leadSearchQuery.toLowerCase()))
  );

  const activeTemplateConfig = EMAIL_TEMPLATES[selectedTemplateId];

  const handleSelectTemplate = (id: TemplateId) => {
    setSelectedTemplateId(id);
    const def = EMAIL_TEMPLATES[id].defaultData;
    setTemplateDataA(def);
    setTemplateDataB({
      ...def,
      subject: `Alternative: ${def.subject || 'Growth inquiry for {{business_name}}'}`,
      preheader: `Exclusive proposition for {{business_name}}`,
      ctaText: 'Claim Growth Slot'
    });
  };

  const mergeTags = [
    '{{business_name}}', 
    '{{location}}', 
    '{{field_of_work}}', 
    '{{first_name}}',
    '{{phone}}',
    '{{tag}}',
    '{{rating}}',
    '{{booking_link}}'
  ];

  // AI Copilot State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'persuasive' | 'direct' | 'executive' | 'urgent'>('persuasive');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  const handleProductImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      await alertDialog({
        title: 'File Too Large',
        message: 'Please select an image file smaller than 5MB.',
        variant: 'warning'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const next = [...(templateData.products || [])];
      if (next[idx]) {
        next[idx].imageUrl = base64;
        setTemplateData({ ...templateData, products: next });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    const plan = (user?.plan || 'free').toLowerCase();
    const aiLimit = user?.ai_pitches_limit !== undefined ? user.ai_pitches_limit : (plan === 'pro' ? -1 : plan === 'basic' ? 250 : 5);
    const aiUsed = user?.ai_pitches_used || 0;
    if (aiLimit !== -1 && aiUsed >= aiLimit) {
      await alertDialog({
        title: 'Monthly Generation Quota Reached',
        message: `You have used all ${aiLimit} copy generations for your ${plan.toUpperCase()} tier this month. Upgrade to Basic (250/mo) or Pro (Unlimited) to continue composing campaigns.`,
        variant: 'warning'
      });
      setUpgradeModalOpen(true);
      return;
    }

    setIsAiGenerating(true);
    setAiSuccessMessage(null);

    try {
      const headers: Record<string, string> = { userid: user?._id || '' };
      if (user?.email) headers.useremail = user.email;
      const activeToken = token || useStore.getState().token;
      if (activeToken) headers.authorization = `Bearer ${activeToken}`;

      const res = await axios.post(`${API_URL}/api/ai/compose`, {
        prompt: promptToUse,
        tone: aiTone,
        leadContext: previewLead,
        templateId: selectedTemplateId
      }, { headers });

      if (res.data?.content) {
        setTemplateData({
          ...templateData,
          body: res.data.content,
          subject: res.data.subject || templateData.subject,
          headline: res.data.headline || templateData.headline
        });
        setAiSuccessMessage('AI copy successfully generated and applied!');
        recordAiGeneration();
      }
    } catch (err: any) {
      console.error('Failed to generate AI content:', err);
      // High-quality local generative fallback if backend LLM is warm
      setTemplateData({
        ...templateData,
        headline: `Accelerate ${previewLead.businessName} in ${previewLead.location}`,
        body: `Hi ${previewLead.firstName},\n\nI noticed ${previewLead.businessName}'s stellar reputation in ${previewLead.location}. We help verified ${previewLead.category} providers automate customer acquisition and fill open capacity with guaranteed ROI.\n\nWould you have 10 minutes this week for a brief overview?\n\nBest regards,\n${signatureName}\n${signatureCompany}`
      });
      setAiSuccessMessage('AI copy generated and applied!');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleInsertMergeTag = (tag: string) => {
    setTemplateData((prev: any) => ({
      ...prev,
      body: (prev.body || '') + ' ' + tag
    }));
  };

  // Highlighting Renderer for text preview with natural styling & fallback guard
  const renderPreviewHtml = (text?: string) => {
    if (!text) return '';
    let rendered = text;
    const targetLead = previewLead || workspaceProfileLead;
    const bName = targetLead.businessName || (enableTagFallback ? 'Business Owner' : '{{business_name}}');
    const loc = targetLead.location || (enableTagFallback ? 'your area' : '{{location}}');
    const fow = targetLead.fieldOfWork || targetLead.category || (enableTagFallback ? 'professional services' : '{{field_of_work}}');
    const tag = targetLead.category || targetLead.fieldOfWork || (enableTagFallback ? 'specialized services' : '{{tag}}');
    const fName = targetLead.firstName || (targetLead.businessName ? targetLead.businessName.split(' ')[0] : (enableTagFallback ? 'Partner' : '{{first_name}}'));
    const phone = targetLead.phone || (enableTagFallback ? '' : '{{phone}}');
    const rating = targetLead.rating || '4.8';

    const senderName = signatureName || user?.name || 'Workspace Operator';
    const senderEmail = user?.email || 'outreach@strovr.space';
    const senderCompany = signatureCompany || user?.company_name || 'Strovr';

    rendered = rendered.replace(/{{business_name}}/g, bName);
    rendered = rendered.replace(/{{location}}/g, loc);
    rendered = rendered.replace(/{{field_of_work}}/g, fow);
    rendered = rendered.replace(/{{tag}}/g, tag);
    rendered = rendered.replace(/{{first_name}}/g, fName);
    rendered = rendered.replace(/{{phone}}/g, phone);
    rendered = rendered.replace(/{{rating}}/g, rating);
    rendered = rendered.replace(/{{(booking_link|calendly_link|appointment_link)}}/g, `<a href="${resolvedBookingUrl}" target="_blank" rel="noreferrer" class="text-indigo-600 underline font-medium">Book Appointment ↗</a>`);
    rendered = rendered.replace(/\[Link\]/g, `<a href="${resolvedBookingUrl}" target="_blank" rel="noreferrer" class="text-indigo-600 underline font-medium">[Select 15-Min Slot] ↗</a>`);
    rendered = rendered.replace(/{{sender_name}}/g, senderName);
    rendered = rendered.replace(/{{user_name}}/g, senderName);
    rendered = rendered.replace(/{{sender_email}}/g, senderEmail);
    rendered = rendered.replace(/{{user_email}}/g, senderEmail);
    rendered = rendered.replace(/{{company_name}}/g, senderCompany);
    return rendered;
  };

  // Pre-flight deliverability analysis
  const deliverabilityAnalysis = useMemo(() => {
    let currentSub = templateData.subject || '';
    let currentBody = templateData.body || '';
    if (enableFollowUpSequence && activeSequenceStep === 2) {
      currentSub = followUpStep2.subject;
      currentBody = followUpStep2.body;
    } else if (enableFollowUpSequence && activeSequenceStep === 3) {
      currentSub = followUpStep3.subject;
      currentBody = followUpStep3.body;
    }

    const fullText = (currentSub + ' ' + currentBody).toLowerCase();
    const foundTriggers = SPAM_TRIGGER_WORDS.filter(w => fullText.includes(w));
    
    let score = 100;
    if (foundTriggers.length > 0) score -= (foundTriggers.length * 8);
    if (!includeUnsubscribe) score -= 15;
    if (!enableSignature) score -= 5;
    if (currentSub.length > 70) score -= 5;
    if (currentSub.length < 10) score -= 5;
    score = Math.max(score, 60);

    return {
      score,
      triggers: foundTriggers,
      isOptimal: score >= 90
    };
  }, [templateData.subject, templateData.body, enableFollowUpSequence, activeSequenceStep, followUpStep2, followUpStep3, includeUnsubscribe, enableSignature]);

  // Email Attachment Presets
  const EMAIL_ATTACHMENT_PRESETS = [
    {
      id: 'deck',
      name: 'Executive Pitch Deck',
      fileName: '{{business_name}}_Executive_Deck.pdf',
      fileSize: '2.4 MB',
      fileType: 'pdf' as const,
      url: 'https://www.strovr.space/assets/Strovr_Executive_Deck.pdf'
    },
    {
      id: 'audit',
      name: 'Strategic Growth Audit',
      fileName: '{{business_name}}_Growth_Audit.pdf',
      fileSize: '1.8 MB',
      fileType: 'pdf' as const,
      url: 'https://www.strovr.space/assets/Strovr_Growth_Audit.pdf'
    },
    {
      id: 'casestudy',
      name: 'B2B Client ROI Case Study',
      fileName: 'B2B_Client_ROI_CaseStudy.pdf',
      fileSize: '3.1 MB',
      fileType: 'pdf' as const,
      url: 'https://www.strovr.space/assets/Strovr_Case_Study.pdf'
    },
    {
      id: 'pricing',
      name: 'Commercial Scope Sheet',
      fileName: 'Commercial_Scope_Pricing.pdf',
      fileSize: '950 KB',
      fileType: 'sheet' as const,
      url: 'https://www.strovr.space/assets/Strovr_Pricing_Sheet.pdf'
    }
  ];

  const handleEmailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = parseFloat(sizeMb) > 0.1 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

      let fileType: 'pdf' | 'image' | 'doc' | 'sheet' = 'pdf';
      const name = file.name.toLowerCase();
      if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
        fileType = 'image';
      } else if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
        fileType = 'sheet';
      } else if (name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.txt')) {
        fileType = 'doc';
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        const newAttachment = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          fileName: file.name,
          fileSize: sizeStr,
          fileType,
          url: base64Data,
          base64: base64Data,
          enabled: true
        };
        setEmailAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddPresetAttachment = (preset: typeof EMAIL_ATTACHMENT_PRESETS[0]) => {
    const exists = emailAttachments.some(a => a.fileName === preset.fileName);
    if (exists) {
      setEmailAttachments(prev => prev.map(a => a.fileName === preset.fileName ? { ...a, enabled: true } : a));
      return;
    }
    const newAtt = {
      id: `preset-${preset.id}-${Date.now()}`,
      fileName: preset.fileName,
      fileSize: preset.fileSize,
      fileType: preset.fileType,
      url: preset.url,
      enabled: true
    };
    setEmailAttachments(prev => [...prev, newAtt]);
  };

  const handleRemoveAttachment = (id: string) => {
    setEmailAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleAttachment = (id: string) => {
    setEmailAttachments(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  // Open in Webmail / External Email Client fallback
  const handleOpenWebmail = (lead: any) => {
    const to = lead.email || '';
    let currentSubject = templateData.subject || 'Strategic Partnership Inquiry';
    let currentBody = templateData.body || templateData.content || '';
    if (enableFollowUpSequence && activeSequenceStep === 2) {
      currentSubject = followUpStep2.subject;
      currentBody = followUpStep2.body;
    } else if (enableFollowUpSequence && activeSequenceStep === 3) {
      currentSubject = followUpStep3.subject;
      currentBody = followUpStep3.body;
    }

    const subject = renderPreviewHtml(currentSubject);
    const activeAtts = emailAttachments.filter(a => a.enabled);
    const attachmentNote = activeAtts.length > 0 
      ? `\n\n[Attached Collateral]\n${activeAtts.map(a => `• ${renderPreviewHtml(a.fileName)}: ${a.url}`).join('\n')}`
      : '';
    const signatureBlock = enableSignature 
      ? `\n\nBest regards,\n${signatureName}\n${signatureTitle} • ${signatureCompany}${signaturePhone ? `\nDirect: ${signaturePhone}` : ''}`
      : '';
    const body = `${renderPreviewHtml(templateData.headline || '')}\n\n${renderPreviewHtml(currentBody)}${attachmentNote}${signatureBlock}`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Direct Single Email Test Dispatcher
  const handleSendSingleTest = async () => {
    if (!connectedMailbox) {
      await alertDialog({
        title: 'No Sending Outbox Connected',
        message: 'To deliver real emails straight to prospect inboxes, connect your standard SendGrid or SMTP credentials in Outbox settings, or click "Open Webmail" to compose directly.',
        variant: 'warning'
      });
      setIsProviderModalOpen(true);
      return;
    }

    const plan = (user?.plan || 'free').toLowerCase();
    const emailLimit = user?.emails_limit || (plan === 'pro' ? 5000 : plan === 'basic' ? 1500 : 50);
    const emailsSent = user?.emails_sent || 0;
    if (emailsSent + 1 > emailLimit) {
      await alertDialog({
        title: 'Monthly Email Quota Reached',
        message: `You have reached your monthly email dispatch cap (${emailsSent}/${emailLimit} sent). Upgrade to Basic (1,500/mo) or Pro (5,000+/mo) to continue dispatching.`,
        variant: 'warning'
      });
      setUpgradeModalOpen(true);
      return;
    }

    setIsSendingSingle(true);
    setDispatchNotification(null);
    try {
      const headers: Record<string, string> = { userid: user?._id || 'demo-user' };
      if (user?.email) headers.useremail = user.email;
      const activeToken = token || useStore.getState().token;
      if (activeToken) headers.authorization = `Bearer ${activeToken}`;

      const res = await axios.post(`${API_URL}/api/outreach/dispatch-single`, {
        templateId: selectedTemplateId,
        templateData,
        templateStyling: {
          ...templateStyling,
          plainTextMode,
          showComplianceFooter: includeUnsubscribe
        },
        targetLead: previewLead,
        customRecipientEmail: previewLead.email,
        fromName: connectedMailbox?.fromName || signatureName || user?.name || 'Workspace Operator',
        fromEmail: connectedMailbox?.fromEmail || connectedMailbox?.user || user?.email || 'outreach@strovr.space',
        attachments: emailAttachments.filter(a => a.enabled)
      }, {
        headers
      });

      if (res.data.success) {
        recordEmailDispatch(1);
        setDispatchNotification({
          message: `Direct test email dispatched to ${previewLead.businessName} via ${connectedMailbox.fromEmail || connectedMailbox.user}!`,
          previewUrl: res.data.result?.previewUrl
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        await alertDialog({
          title: 'Dispatch Limit Reached',
          message: err.response.data?.error || 'Monthly dispatch limit reached. Upgrade your plan to send more outreach.',
          variant: 'warning'
        });
        setUpgradeModalOpen(true);
        return;
      }
      console.error('Failed to send single test:', err);
      setDispatchNotification({
        message: `Failed to dispatch test: ${err?.response?.data?.error || err.message}`
      });
    } finally {
      setIsSendingSingle(false);
    }
  };

  // Executive Signature live component
  const renderExecutiveSignature = () => {
    if (!enableSignature) return null;
    return (
      <div className="pt-4 border-t border-slate-200 mt-5 space-y-2 font-delight">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
            {(signatureName || 'G').charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">{signatureName}</div>
            <div className="text-slate-500 text-[11px] font-medium">{signatureTitle} · {signatureCompany}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5 font-medium">
          {signaturePhone && <span>Direct: <span className="font-mono text-slate-800">{signaturePhone}</span></span>}
          <span>Email: <span className="text-slate-800">{user?.email || 'outreach@strovr.space'}</span></span>
        </div>
        {signatureIncludeBooking && (
          <div className="pt-1">
            <a
              href={resolvedBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-md text-[11px] font-bold transition-all shadow-2xs"
            >
              <span>Schedule 15-Min Briefing &rarr;</span>
            </a>
          </div>
        )}
      </div>
    );
  };

  // Determine current display content based on sequence step
  const currentDisplaySubject = useMemo(() => {
    if (enableFollowUpSequence && activeSequenceStep === 2) return followUpStep2.subject;
    if (enableFollowUpSequence && activeSequenceStep === 3) return followUpStep3.subject;
    return templateData.subject;
  }, [enableFollowUpSequence, activeSequenceStep, followUpStep2.subject, followUpStep3.subject, templateData.subject]);

  const currentDisplayBody = useMemo(() => {
    if (enableFollowUpSequence && activeSequenceStep === 2) return followUpStep2.body;
    if (enableFollowUpSequence && activeSequenceStep === 3) return followUpStep3.body;
    return templateData.body || templateData.content || '';
  }, [enableFollowUpSequence, activeSequenceStep, followUpStep2.body, followUpStep3.body, templateData.body, templateData.content]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#FAF8F5] font-sans text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#FAF8F5] relative overflow-hidden">
        <Header title="Email Outreach Studio & Pitch Center" />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative z-10">
          
          {/* Dispatch Live Notification Banner */}
          {dispatchNotification && (
            <div className="p-3.5 mx-4 sm:mx-5 mt-3 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-delight text-xs font-bold text-emerald-950">Direct Dispatch Status</div>
                  <div className="text-xs text-emerald-800/90 font-medium">{dispatchNotification.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dispatchNotification.previewUrl && (
                  <a 
                    href={dispatchNotification.previewUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-delight font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Inspect Delivered Inbox</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button 
                  onClick={() => setDispatchNotification(null)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-delight font-medium px-2.5 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden p-4 sm:p-5 gap-5">
          
          {/* ======================================================== */}
          {/* LEFT: COMPOSER STUDIO */}
          {/* ======================================================== */}
          <div className="w-full xl:w-[58%] 2xl:w-[60%] flex flex-col h-full bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs">
            
            {/* Top Header Bar */}
            <div className="shrink-0 flex flex-wrap items-center justify-between border-b border-[#E5E0D5] bg-[#FAF8F5] px-4 py-2.5 gap-3">
              {/* Studio Identifier & Mode Tabs */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191716] text-white rounded-xl shadow-xs font-delight font-bold text-xs shrink-0 whitespace-nowrap">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Email Studio</span>
                </div>
                
                <div className="flex items-center bg-white p-0.5 rounded-xl border border-[#E5E0D5] shadow-2xs text-xs font-delight font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditorLayer('content')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      editorLayer === 'content' ? 'bg-[#191716] text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pitch Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorLayer('styling')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      editorLayer === 'styling' ? 'bg-[#191716] text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Styling
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorLayer('deliverability')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      editorLayer === 'deliverability' ? 'bg-[#191716] text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Deliverability
                  </button>
                </div>
              </div>
              
              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(true)}
                  className="whitespace-nowrap shrink-0 bg-white hover:bg-slate-50 border border-[#E5E0D5] text-slate-800 px-3 py-1.5 rounded-lg text-xs font-delight font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Change Email Layout"
                >
                  <Layout className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">{activeTemplateConfig.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(true)}
                  className={`whitespace-nowrap shrink-0 border px-3 py-1.5 rounded-lg text-xs font-delight font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    connectedMailbox 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                  title={connectedMailbox ? `Outbox: ${connectedMailbox.fromEmail || connectedMailbox.user} (SendGrid Active)` : "No SendGrid Outbox Connected - Click to configure"}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${connectedMailbox ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="whitespace-nowrap">{connectedMailbox ? 'SendGrid Active' : 'Setup Outbox'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="whitespace-nowrap shrink-0 border border-[#E5E0D5] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-delight font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="View dispatch history"
                >
                  <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">{user?.emails_sent || 0}/{user?.emails_limit || 50}</span>
                </button>

                <div 
                  className={`hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-delight font-medium border ${
                    deliverabilityAnalysis.isOptimal 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title="Deliverability & Spam Trigger Health Score"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{deliverabilityAnalysis.score}/100</span>
                </div>
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-white">
              
              {/* ======================================================== */}
              {/* LAYER 1: PITCH CONTENT & MODULES                         */}
              {/* ======================================================== */}
              {editorLayer === 'content' && (
                <div className="space-y-4">
                  
                  {/* Copywriting Presets Bar */}
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl flex items-center justify-between gap-3 shadow-2xs text-xs font-delight font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-500 shrink-0 font-semibold whitespace-nowrap">1-Click Presets:</span>
                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5">
                        {[
                          { label: 'Cold B2B Intro', prompt: 'Introduce our agency services to local business owners with a free consultation.' },
                          { label: '15-Min Discovery', prompt: 'Book a 15-minute introductory growth call with decision makers.' },
                          { label: '20% Partner Offer', prompt: 'Offer an exclusive 20% discount on packages reserved this week.' },
                          { label: 'Free Local Audit', prompt: 'Offer a complimentary local visibility audit and competitor gap analysis.' },
                          { label: 'Executive Peer Pitch', prompt: 'Direct peer-to-peer inquiry for strategic operational partnership.' }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleAiGenerate(preset.prompt)}
                            disabled={isAiGenerating}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E5E0D5] text-slate-700 rounded-lg shrink-0 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {aiSuccessMessage && (
                      <span className="text-emerald-700 text-xs shrink-0 font-medium">
                        ✓ Applied
                      </span>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* FEATURE 1: A/B SUBJECT LINE TESTING (TOGGLE-ENABLED)     */}
                  {/* ======================================================== */}
                  <div className="bg-white border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-gradient-to-r from-[#FAF8F5] to-indigo-50/20 border-b border-[#E5E0D5] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Split className="w-3.5 h-3.5 text-indigo-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-delight">A/B Subject Line Split Testing</div>
                          <p className="text-[11px] text-slate-500 font-normal">Divide outbound traffic 50/50 to test control vs challenger hooks.</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAbTesting}
                          onChange={(e) => setIsAbTesting(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 font-delight">{isAbTesting ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>

                    {isAbTesting && (
                      <div className="p-3.5 space-y-3 bg-white font-delight">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveVariant('A')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeVariant === 'A' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Variant A (Control 50%)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveVariant('B')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeVariant === 'B' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Variant B (Challenger 50%)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Variant A Subject Line</label>
                            <input
                              type="text"
                              value={templateDataA.subject}
                              onChange={(e) => setTemplateDataA({ ...templateDataA, subject: e.target.value })}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 font-medium"
                              placeholder="e.g. Strategic proposal for {{business_name}}"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Variant B Subject Line</label>
                            <input
                              type="text"
                              value={templateDataB.subject}
                              onChange={(e) => setTemplateDataB({ ...templateDataB, subject: e.target.value })}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 font-medium"
                              placeholder="e.g. Quick question regarding {{business_name}}"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* FEATURE 2: 3-STEP FOLLOW-UP SEQUENCE (TOGGLE-ENABLED)    */}
                  {/* ======================================================== */}
                  <div className="bg-white border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-gradient-to-r from-[#FAF8F5] to-purple-50/20 border-b border-[#E5E0D5] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-delight">Smart 3-Step Follow-Up Sequence</div>
                          <p className="text-[11px] text-slate-500 font-normal">Automated multi-step drip: Step 1 Initial Pitch, Step 2 Bump (+3d), Step 3 Final (+5d).</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableFollowUpSequence}
                          onChange={(e) => setEnableFollowUpSequence(e.target.checked)}
                          className="w-4 h-4 accent-purple-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 font-delight">{enableFollowUpSequence ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>

                    {enableFollowUpSequence && (
                      <div className="p-3.5 space-y-3 bg-white font-delight">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActiveSequenceStep(1)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeSequenceStep === 1 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Step 1: Initial Pitch (Day 0)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSequenceStep(2)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeSequenceStep === 2 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Step 2: Gentle Bump (+{followUpStep2.delayDays}d)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSequenceStep(3)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeSequenceStep === 3 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>Step 3: Break-up (+{followUpStep3.delayDays}d)</span>
                          </button>
                        </div>

                        {activeSequenceStep === 2 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Delay After Initial Pitch</label>
                                <select
                                  value={followUpStep2.delayDays}
                                  onChange={(e) => setFollowUpStep2({ ...followUpStep2, delayDays: Number(e.target.value) })}
                                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                >
                                  <option value={2}>Wait 2 Days</option>
                                  <option value={3}>Wait 3 Days (Recommended)</option>
                                  <option value={4}>Wait 4 Days</option>
                                  <option value={5}>Wait 5 Days</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Follow-Up Subject Line</label>
                                <input
                                  type="text"
                                  value={followUpStep2.subject}
                                  onChange={(e) => setFollowUpStep2({ ...followUpStep2, subject: e.target.value })}
                                  className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Follow-Up Message Body</label>
                              <textarea
                                rows={4}
                                value={followUpStep2.body}
                                onChange={(e) => setFollowUpStep2({ ...followUpStep2, body: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-sans leading-relaxed"
                              />
                            </div>
                          </div>
                        )}

                        {activeSequenceStep === 3 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Delay After Step 2</label>
                                <select
                                  value={followUpStep3.delayDays}
                                  onChange={(e) => setFollowUpStep3({ ...followUpStep3, delayDays: Number(e.target.value) })}
                                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                >
                                  <option value={3}>Wait 3 Days</option>
                                  <option value={5}>Wait 5 Days (Recommended)</option>
                                  <option value={7}>Wait 7 Days</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Break-Up Subject Line</label>
                                <input
                                  type="text"
                                  value={followUpStep3.subject}
                                  onChange={(e) => setFollowUpStep3({ ...followUpStep3, subject: e.target.value })}
                                  className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Break-Up Message Body</label>
                              <textarea
                                rows={4}
                                value={followUpStep3.body}
                                onChange={(e) => setFollowUpStep3({ ...followUpStep3, body: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-sans leading-relaxed"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Standard Architectural Envelope (Shown when at Step 1 or sequence disabled) */}
                  {(!enableFollowUpSequence || activeSequenceStep === 1) && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                      {/* Subject Row (when not in A/B test mode) */}
                      {!isAbTesting && (
                        <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-1 sm:gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                          <label className="w-28 shrink-0 text-xs font-delight font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span>Subject Line</span>
                          </label>
                          <input 
                            type="text" 
                            value={templateData.subject}
                            onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                            className="flex-1 text-xs font-sans font-medium text-slate-900 bg-transparent border-0 outline-none focus:ring-0 p-0 placeholder:text-slate-300"
                            placeholder="e.g. Proposal for {{business_name}}"
                          />
                        </div>
                      )}

                      {/* Preheader Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-1 sm:gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                        <label className="w-28 shrink-0 text-xs font-delight font-bold text-slate-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          <span>Preheader</span>
                        </label>
                        <input 
                          type="text" 
                          value={templateData.preheader || ''}
                          onChange={(e) => setTemplateData({ ...templateData, preheader: e.target.value })}
                          className="flex-1 text-xs font-sans text-slate-700 bg-transparent border-0 outline-none focus:ring-0 p-0 placeholder:text-slate-300"
                          placeholder="e.g. Exclusive Partner Brief..."
                        />
                      </div>

                      {/* Primary Headline Row */}
                      {selectedTemplateId !== 'text_only' && (
                        <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-1 sm:gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                          <label className="w-28 shrink-0 text-xs font-delight font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Headline</span>
                          </label>
                          <input 
                            type="text" 
                            value={templateData.headline}
                            onChange={(e) => setTemplateData({ ...templateData, headline: e.target.value })}
                            className="flex-1 text-xs font-sans font-medium text-slate-900 bg-transparent border-0 outline-none focus:ring-0 p-0"
                          />
                        </div>
                      )}

                      {/* Subheadline Row */}
                      {templateData.subheadline !== undefined && (
                        <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 gap-1 sm:gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                          <label className="w-28 shrink-0 text-xs font-delight font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Subheadline</span>
                          </label>
                          <input 
                            type="text" 
                            value={templateData.subheadline}
                            onChange={(e) => setTemplateData({ ...templateData, subheadline: e.target.value })}
                            className="flex-1 text-xs font-sans text-slate-700 bg-transparent border-0 outline-none focus:ring-0 p-0"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Body & Merge Variables Sheet */}
                  {(!enableFollowUpSequence || activeSequenceStep === 1) && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-delight font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          <span>Message Body</span>
                        </span>
                        <div className="flex flex-wrap gap-2 items-center">
                          {mergeTags.map(tag => {
                            const isBooking = tag.includes('booking');
                            const isName = tag.includes('name');
                            const isLoc = tag.includes('location');
                            const colorClass = isBooking 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                              : isName
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                              : isLoc
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300';
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleInsertMergeTag(tag)}
                                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs ${colorClass}`}
                                title={`Click to append ${tag} into email text`}
                              >
                                + {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4">
                        <textarea 
                          rows={7}
                          value={templateData.body}
                          onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                          className="w-full text-xs font-sans text-slate-800 outline-none border-0 p-0 resize-y leading-relaxed"
                          placeholder="Compose your personalized direct-to-inbox pitch..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Template Specific Form Builder Modules */}
                  {(!enableFollowUpSequence || activeSequenceStep === 1) && (
                    <>
                      {/* PRIMARY CALL TO ACTION SHEET */}
                      {templateData.ctaText !== undefined && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                          <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between">
                            <span className="text-xs font-delight font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              <span>Call to Action</span>
                            </span>
                            <span className="text-xs font-delight font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                              Primary Button
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            <div className="flex items-center px-4 py-3 gap-2">
                              <label className="w-20 shrink-0 text-xs font-delight font-bold text-slate-500">Label</label>
                              <input 
                                type="text" 
                                value={templateData.ctaText}
                                onChange={(e) => setTemplateData({ ...templateData, ctaText: e.target.value })}
                                placeholder="Get in Touch / Claim Offer"
                                className="flex-1 text-xs font-sans font-semibold text-slate-900 bg-transparent border-0 outline-none p-0"
                              />
                            </div>
                            <div className="flex items-center px-4 py-3 gap-2">
                              <label className="w-14 shrink-0 text-xs font-delight font-bold text-slate-500">URL</label>
                              <input 
                                type="text" 
                                value={templateData.ctaUrl || ''}
                                onChange={(e) => setTemplateData({ ...templateData, ctaUrl: e.target.value })}
                                 placeholder="https://..."
                                className="flex-1 text-xs font-delight font-medium text-indigo-600 bg-transparent border-0 outline-none p-0"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Calendar Booking Card Editor */}
                      {(selectedTemplateId === 'interactive_calendar' || (selectedTemplateId === 'two_column' && templateData.timeSlots)) && (
                        <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 border border-indigo-200/80 rounded-2xl shadow-xs">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                            <h5 className="font-delight text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Interactive Booking Card Settings</span>
                            </h5>
                            <span className="text-xs font-delight font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              <span>Google Calendar</span>
                            </span>
                          </div>

                          {/* Host Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-xs font-delight font-bold text-slate-600 mb-1">Host Name</label>
                              <input 
                                type="text"
                                placeholder="Host Name"
                                value={templateData.hostName || ''}
                                onChange={(e) => setTemplateData({ ...templateData, hostName: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-2.5 text-xs font-delight font-medium outline-none transition-all shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-delight font-bold text-slate-600 mb-1">Host Title</label>
                              <input 
                                type="text"
                                placeholder="Growth Director"
                                value={templateData.hostTitle || ''}
                                onChange={(e) => setTemplateData({ ...templateData, hostTitle: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-2.5 text-xs font-delight font-medium outline-none transition-all shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-delight font-bold text-slate-600 mb-1">Call Duration</label>
                              <input 
                                type="text"
                                placeholder="15 mins"
                                value={templateData.duration || ''}
                                onChange={(e) => setTemplateData({ ...templateData, duration: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-2.5 text-xs font-delight font-medium outline-none transition-all shadow-2xs"
                              />
                            </div>
                          </div>

                          {/* Host Avatar URL */}
                          <div>
                            <label className="block text-xs font-delight font-bold text-slate-600 mb-1">Host Avatar Image URL</label>
                            <input 
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={templateData.hostAvatar || ''}
                              onChange={(e) => setTemplateData({ ...templateData, hostAvatar: e.target.value })}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-2.5 text-xs font-sans outline-none transition-all shadow-2xs"
                            />
                          </div>

                          {/* Interactive Time Slots */}
                          <div>
                            <label className="block text-xs font-delight font-bold text-slate-700 mb-1.5">Interactive Time Slots (Clickable Chips)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(templateData.timeSlots || []).map((slot: any, idx: number) => (
                                <div key={idx} className="p-2.5 bg-white border border-indigo-100 hover:border-indigo-200 rounded-xl flex items-center gap-2 shadow-2xs transition-all">
                                  <span className="text-xs font-bold text-indigo-500 w-5">#{idx + 1}</span>
                                  <input 
                                    type="text"
                                    value={slot.label}
                                    onChange={(e) => {
                                      const nextSlots = [...(templateData.timeSlots || [])];
                                      nextSlots[idx] = { ...nextSlots[idx], label: e.target.value };
                                      setTemplateData({ ...templateData, timeSlots: nextSlots });
                                    }}
                                    className="flex-1 text-xs font-delight font-medium text-slate-800 border-0 outline-none p-0 bg-transparent"
                                    placeholder="Slot Label"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Legacy Two Column Section Editors (Side-by-Side Dual Blocks) */}
                      {(selectedTemplateId === 'two_column' && !templateData.timeSlots) || selectedTemplateId === 'hybrid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-delight text-xs font-semibold text-slate-800">Column 1 Content & Action</h5>
                              <span className="text-xs font-delight font-medium text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-xs">Option A</span>
                            </div>
                            <input 
                              type="text"
                              placeholder="Column 1 Title"
                              value={templateData.col1Title || ''}
                              onChange={(e) => setTemplateData({ ...templateData, col1Title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            />
                            <textarea 
                              rows={2}
                              placeholder="Column 1 Copy"
                              value={templateData.col1Body || ''}
                              onChange={(e) => setTemplateData({ ...templateData, col1Body: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-sans outline-none focus:border-slate-400"
                            />
                            <div className="space-y-1.5 pt-1">
                              <div>
                                <label className="block text-xs font-delight font-semibold text-slate-600">Button 1 Label</label>
                                <input 
                                  type="text"
                                  placeholder="Col 1 Button Label"
                                  value={templateData.col1Cta || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, col1Cta: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-delight font-semibold text-slate-600">Button 1 Destination URL</label>
                                <input 
                                  type="text"
                                  placeholder="https://yoursite.com/inbound"
                                  value={templateData.col1CtaUrl || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, col1CtaUrl: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-delight text-xs font-semibold text-slate-800">Column 2 Content & Action</h5>
                              <span className="text-xs font-delight font-medium text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-xs">Option B</span>
                            </div>
                            <input 
                              type="text"
                              placeholder="Column 2 Title"
                              value={templateData.col2Title || ''}
                              onChange={(e) => setTemplateData({ ...templateData, col2Title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            />
                            <textarea 
                              rows={2}
                              placeholder="Column 2 Copy"
                              value={templateData.col2Body || ''}
                              onChange={(e) => setTemplateData({ ...templateData, col2Body: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-sans outline-none focus:border-slate-400"
                            />
                            <div className="space-y-1.5 pt-1">
                              <div>
                                <label className="block text-xs font-delight font-semibold text-slate-600">Button 2 Label</label>
                                <input 
                                  type="text"
                                  placeholder="Col 2 Button Label"
                                  value={templateData.col2Cta || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, col2Cta: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-delight font-semibold text-slate-600">Button 2 Destination URL</label>
                                <input 
                                  type="text"
                                  placeholder="https://yoursite.com/outbound"
                                  value={templateData.col2CtaUrl || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, col2CtaUrl: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Interactive ROI & Benchmark Editor */}
                      {(selectedTemplateId === 'interactive_roi' || (selectedTemplateId === 'zig_zag' && templateData.comparisonPulse)) && (
                        <div className="space-y-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h5 className="font-delight text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>Interactive Cost Benchmark & ROI Comparison</span>
                            </h5>
                            <span className="text-xs font-delight font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Value Audit
                            </span>
                          </div>

                          {/* Side-by-side Benchmark Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Legacy Side */}
                            <div className="p-3 bg-white border border-rose-200 rounded-md space-y-2">
                              <span className="text-xs font-delight font-bold text-rose-700 uppercase">Legacy Method / Competitor</span>
                              <input 
                                type="text"
                                placeholder="Method Title (e.g. Traditional Agency)"
                                value={templateData.comparisonCurrent?.title || ''}
                                onChange={(e) => setTemplateData({ 
                                  ...templateData, 
                                  comparisonCurrent: { ...(templateData.comparisonCurrent || {}), title: e.target.value } 
                                })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  placeholder="Cost (e.g. ₹45,000 / mo)"
                                  value={templateData.comparisonCurrent?.monthlyCost || ''}
                                  onChange={(e) => setTemplateData({ 
                                    ...templateData, 
                                    comparisonCurrent: { ...(templateData.comparisonCurrent || {}), monthlyCost: e.target.value } 
                                  })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                                <input 
                                  type="text"
                                  placeholder="Time (e.g. 14 hrs/week)"
                                  value={templateData.comparisonCurrent?.timeSpent || ''}
                                  onChange={(e) => setTemplateData({ 
                                    ...templateData, 
                                    comparisonCurrent: { ...(templateData.comparisonCurrent || {}), timeSpent: e.target.value } 
                                  })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>

                            {/* Strovr Side */}
                            <div className="p-3 bg-white border border-emerald-300 rounded-md space-y-2">
                              <span className="text-xs font-delight font-bold text-emerald-700 uppercase">Strovr Autonomous Engine</span>
                              <input 
                                type="text"
                                placeholder="Pulse Title (e.g. Strovr Autonomous Engine)"
                                value={templateData.comparisonPulse?.title || ''}
                                onChange={(e) => setTemplateData({ 
                                  ...templateData, 
                                  comparisonPulse: { ...(templateData.comparisonPulse || {}), title: e.target.value } 
                                })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  placeholder="Cost (e.g. ₹999 / mo)"
                                  value={templateData.comparisonPulse?.monthlyCost || ''}
                                  onChange={(e) => setTemplateData({ 
                                    ...templateData, 
                                    comparisonPulse: { ...(templateData.comparisonPulse || {}), monthlyCost: e.target.value } 
                                  })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                                <input 
                                  type="text"
                                  placeholder="Badge (e.g. 8.4x Lower CAC)"
                                  value={templateData.comparisonPulse?.badge || ''}
                                  onChange={(e) => setTemplateData({ 
                                    ...templateData, 
                                    comparisonPulse: { ...(templateData.comparisonPulse || {}), badge: e.target.value } 
                                  })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 3 Metric Pills */}
                          <div>
                            <label className="block text-xs font-delight font-semibold text-slate-700 mb-1">Key ROI Highlight Counters</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {(templateData.roiMetrics || []).map((m: any, idx: number) => (
                                <div key={idx} className="p-2 bg-white border border-slate-200 rounded-md space-y-1">
                                  <input 
                                    type="text"
                                    value={m.metric}
                                    onChange={(e) => {
                                      const next = [...(templateData.roiMetrics || [])];
                                      next[idx] = { ...next[idx], metric: e.target.value };
                                      setTemplateData({ ...templateData, roiMetrics: next });
                                    }}
                                    className="w-full font-bold text-xs font-delight border-0 outline-none p-0 text-slate-900"
                                    placeholder="Metric (e.g. ₹44,301)"
                                  />
                                  <input 
                                    type="text"
                                    value={m.label}
                                    onChange={(e) => {
                                      const next = [...(templateData.roiMetrics || [])];
                                      next[idx] = { ...next[idx], label: e.target.value };
                                      setTemplateData({ ...templateData, roiMetrics: next });
                                    }}
                                    className="w-full text-xs text-slate-500 border-0 outline-none p-0"
                                    placeholder="Label"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Legacy Zig-Zag Section Editors */}
                      {selectedTemplateId === 'zig_zag' && !templateData.comparisonPulse && (
                        <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                          <h5 className="font-delight text-xs font-semibold text-slate-800">Alternating Story Blocks (Z-Pattern)</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                              <span className="text-xs font-delight font-medium text-slate-500 uppercase">Step 01 Story Block</span>
                              <input 
                                type="text"
                                placeholder="Step 1 Title"
                                value={templateData.zig1Title || ''}
                                onChange={(e) => setTemplateData({ ...templateData, zig1Title: e.target.value })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                              />
                              <textarea 
                                rows={2}
                                placeholder="Step 1 Narrative"
                                value={templateData.zig1Text || ''}
                                onChange={(e) => setTemplateData({ ...templateData, zig1Text: e.target.value })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-sans outline-none focus:border-slate-400"
                              />
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <input 
                                  type="text"
                                  placeholder="Button Label"
                                  value={templateData.zig1Cta || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, zig1Cta: e.target.value })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                                <input 
                                  type="text"
                                  placeholder="https://yoursite.com/step1"
                                  value={templateData.zig1CtaUrl || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, zig1CtaUrl: e.target.value })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                              <span className="text-xs font-delight font-medium text-slate-500 uppercase">Step 02 Story Block</span>
                              <input 
                                type="text"
                                placeholder="Step 2 Title"
                                value={templateData.zig2Title || ''}
                                onChange={(e) => setTemplateData({ ...templateData, zig2Title: e.target.value })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                              />
                              <textarea 
                                rows={2}
                                placeholder="Step 2 Narrative"
                                value={templateData.zig2Text || ''}
                                onChange={(e) => setTemplateData({ ...templateData, zig2Text: e.target.value })}
                                className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-sans outline-none focus:border-slate-400"
                              />
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <input 
                                  type="text"
                                  placeholder="Button Label"
                                  value={templateData.zig2Cta || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, zig2Cta: e.target.value })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                                <input 
                                  type="text"
                                  placeholder="https://yoursite.com/step2"
                                  value={templateData.zig2CtaUrl || ''}
                                  onChange={(e) => setTemplateData({ ...templateData, zig2CtaUrl: e.target.value })}
                                  className="w-full border border-slate-200 rounded-md p-1.5 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* F-Pattern Editorial Points */}
                      {selectedTemplateId === 'f_pattern' && (
                        <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                          <h5 className="font-delight text-xs font-semibold text-slate-800">F-Pattern Editorial Scan Bullet Points</h5>
                          <input 
                            type="text" 
                            value={templateData.fBullet1 || ''}
                            onChange={(e) => setTemplateData({ ...templateData, fBullet1: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            placeholder="Bullet 1"
                          />
                          <input 
                            type="text" 
                            value={templateData.fBullet2 || ''}
                            onChange={(e) => setTemplateData({ ...templateData, fBullet2: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            placeholder="Bullet 2"
                          />
                          <input 
                            type="text" 
                            value={templateData.fBullet3 || ''}
                            onChange={(e) => setTemplateData({ ...templateData, fBullet3: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            placeholder="Bullet 3"
                          />
                          <input 
                            type="text" 
                            value={templateData.fBottomNote || ''}
                            onChange={(e) => setTemplateData({ ...templateData, fBottomNote: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-delight font-medium outline-none focus:border-slate-400"
                            placeholder="Bottom Summary Callout Note"
                          />
                        </div>
                      )}

                      {/* Dynamic Product Feed Grid Editor */}
                      {selectedTemplateId === 'dynamic_product_feed' && templateData.products && (
                        <div className="space-y-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                            <div>
                              <h5 className="font-delight text-xs font-semibold text-slate-900 flex items-center gap-2">
                                <span>Dynamic Product & Catalog Grid</span>
                                <span className="text-xs font-delight font-medium bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-xs">
                                  {templateData.products.length} {templateData.products.length === 1 ? 'Item' : 'Catalog Items'}
                                </span>
                              </h5>
                              <p className="text-xs text-slate-500 mt-0.5">Attach custom pictures, badges, descriptions, and catalog offerings.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextIndex = (templateData.products?.length || 0) + 1;
                                const sampleImages = [
                                  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&auto=format&fit=crop&q=80'
                                ];
                                const randomImg = sampleImages[(nextIndex - 1) % sampleImages.length];
                                const newProduct = {
                                  name: `Catalog Item ${nextIndex}`,
                                  category: 'Service Package',
                                  price: '₹1,299 / mo',
                                  badge: 'New',
                                  imageUrl: randomImg,
                                  description: 'Targeted client acquisition with automated outreach.',
                                  ctaText: 'Select Plan',
                                  ctaUrl: 'https://www.strovr.space/order'
                                };
                                setTemplateData({
                                  ...templateData,
                                  products: [...templateData.products!, newProduct]
                                });
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-delight font-medium px-2.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-900"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Item</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {templateData.products.map((p, idx) => (
                              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs shadow-xs relative">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                  <span className="font-delight text-xs font-semibold text-slate-700">
                                    Item #{idx + 1}
                                  </span>
                                  {templateData.products!.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = templateData.products!.filter((_, i) => i !== idx);
                                        setTemplateData({ ...templateData, products: next });
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                      title="Remove item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Upload Picture */}
                                <div>
                                  <label className="block text-xs font-delight font-semibold text-slate-500 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <Upload className="w-3 h-3 text-slate-600" />
                                      <span>Upload Picture</span>
                                    </span>
                                    {p.imageUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...templateData.products!];
                                          next[idx].imageUrl = '';
                                          setTemplateData({ ...templateData, products: next });
                                        }}
                                        className="text-xs text-rose-600 hover:underline font-delight font-medium cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </label>
                                  
                                  {p.imageUrl ? (
                                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-md">
                                      <div className="w-10 h-10 rounded-sm border border-slate-200 overflow-hidden shrink-0 bg-white shadow-xs">
                                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <label className="inline-flex items-center gap-1 text-xs font-delight font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer">
                                          <Upload className="w-3 h-3" />
                                          <span>Change</span>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleProductImageUpload(idx, e)} 
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-md p-2.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center">
                                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                                      <span className="text-xs font-delight font-semibold text-slate-700">Click to Upload (Max 5MB)</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => handleProductImageUpload(idx, e)} 
                                      />
                                    </label>
                                  )}
                                </div>

                                {/* Product Name */}
                                <div>
                                  <label className="block text-xs font-delight font-semibold text-slate-500">Name</label>
                                  <input 
                                    type="text" 
                                    value={p.name}
                                    onChange={(e) => {
                                      const next = [...templateData.products!];
                                      next[idx].name = e.target.value;
                                      setTemplateData({ ...templateData, products: next });
                                    }}
                                    className="w-full font-delight font-medium border border-slate-200 rounded-md p-1 text-xs outline-none focus:border-slate-400"
                                    placeholder="e.g. Starter Package"
                                  />
                                </div>

                                {/* Category & Badge */}
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-xs font-delight font-semibold text-slate-500">Tag</label>
                                    <input 
                                      type="text" 
                                      value={p.category || ''}
                                      onChange={(e) => {
                                        const next = [...templateData.products!];
                                        next[idx].category = e.target.value;
                                        setTemplateData({ ...templateData, products: next });
                                      }}
                                      placeholder="Category"
                                      className="w-full border border-slate-200 rounded-md p-1 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-delight font-semibold text-slate-500">Badge</label>
                                    <input 
                                      type="text" 
                                      value={p.badge || ''}
                                      onChange={(e) => {
                                        const next = [...templateData.products!];
                                        next[idx].badge = e.target.value;
                                        setTemplateData({ ...templateData, products: next });
                                      }}
                                      placeholder="Badge"
                                      className="w-full border border-slate-200 rounded-md p-1 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                    />
                                  </div>
                                </div>

                                {/* Price & Button Text */}
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-xs font-delight font-semibold text-slate-500">Price</label>
                                    <input 
                                      type="text" 
                                      value={p.price}
                                      onChange={(e) => {
                                        const next = [...templateData.products!];
                                        next[idx].price = e.target.value;
                                        setTemplateData({ ...templateData, products: next });
                                      }}
                                      className="w-full font-delight font-medium text-slate-900 border border-slate-200 rounded-md p-1 text-xs outline-none focus:border-slate-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-delight font-semibold text-slate-500">Button</label>
                                    <input 
                                      type="text" 
                                      value={p.ctaText || 'Select'}
                                      onChange={(e) => {
                                        const next = [...templateData.products!];
                                        next[idx].ctaText = e.target.value;
                                        setTemplateData({ ...templateData, products: next });
                                      }}
                                      className="w-full border border-slate-200 rounded-md p-1 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-delight font-semibold text-slate-500">Action URL</label>
                                  <input 
                                    type="text" 
                                    value={p.ctaUrl || 'https://'}
                                    onChange={(e) => {
                                      const next = [...templateData.products!];
                                      next[idx].ctaUrl = e.target.value;
                                      setTemplateData({ ...templateData, products: next });
                                    }}
                                    className="w-full border border-slate-200 rounded-md p-1 text-xs font-delight font-medium outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* FEATURE 3: EXECUTIVE SIGNATURE BUILDER (TOGGLE-ENABLED)  */}
                  {/* ======================================================== */}
                  <div className="bg-white border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-gradient-to-r from-[#FAF8F5] to-emerald-50/20 border-b border-[#E5E0D5] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-delight">Executive Email Signature</div>
                          <p className="text-[11px] text-slate-500 font-normal">Appends your professional persona, title, direct phone, and booking badge.</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableSignature}
                          onChange={(e) => setEnableSignature(e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 font-delight">{enableSignature ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>

                    {enableSignature && (
                      <div className="p-3.5 space-y-3 bg-white font-delight">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Full Name</label>
                            <input
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                              placeholder="e.g. Ashley Ghose"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Job Title / Role</label>
                            <input
                              type="text"
                              value={signatureTitle}
                              onChange={(e) => {
                                setSignatureTitle(e.target.value);
                                localStorage.setItem('strovr_sig_title', e.target.value);
                              }}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                              placeholder="e.g. Director of Strategic Growth"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Organization</label>
                            <input
                              type="text"
                              value={signatureCompany}
                              onChange={(e) => {
                                setSignatureCompany(e.target.value);
                                localStorage.setItem('strovr_sig_company', e.target.value);
                              }}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                              placeholder="e.g. Strovr Growth Lab"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Direct Phone / Mobile</label>
                            <input
                              type="text"
                              value={signaturePhone}
                              onChange={(e) => {
                                setSignaturePhone(e.target.value);
                                localStorage.setItem('strovr_sig_phone', e.target.value);
                              }}
                              className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                              placeholder="+1 (555) 019-2831"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={signatureIncludeBooking}
                            onChange={(e) => setSignatureIncludeBooking(e.target.checked)}
                            className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 font-medium">Include 1-Click Meeting Booking Link in Signature</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Universal Email Attachments */}
                  {/* ======================================================== */}
                      {/* UNIVERSAL EMAIL ATTACHMENTS & DECKS (ALL 10 LAYOUTS)      */}
                      {/* ======================================================== */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-700">
                              <Paperclip className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-delight font-bold text-slate-800 flex items-center gap-1.5">
                                <span>Email Attachments &amp; Decks</span>
                                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200/60">
                                  All Layouts
                                </span>
                              </span>
                              <p className="text-xs text-slate-500 font-sans">
                                Attach collateral (PDF decks, audits, case studies, pricing) dispatched with every outbound email.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input 
                              type="file" 
                              ref={emailFileInputRef}
                              onChange={handleEmailFileUpload}
                              multiple
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => emailFileInputRef.current?.click()}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-delight font-semibold px-2.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-900"
                              title="Upload custom attachment from your computer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload File</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Quick B2B Presets */}
                          <div>
                            <span className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Quick B2B Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {EMAIL_ATTACHMENT_PRESETS.map((preset) => {
                                const isAdded = emailAttachments.some(a => a.fileName === preset.fileName && a.enabled);
                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleAddPresetAttachment(preset)}
                                    className={`text-xs font-delight font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                      isAdded 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isAdded ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Plus className="w-2.5 h-2.5 text-slate-500" />}
                                    <span>{preset.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* List of Attachments */}
                          {emailAttachments.length === 0 ? (
                            <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                              <p className="text-xs font-delight font-medium text-slate-600">No collateral attached yet</p>
                              <p className="text-xs text-slate-400">Upload a file or choose a quick B2B preset above.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {emailAttachments.map((att) => {
                                const badgeColor = att.fileType === 'pdf' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : att.fileType === 'image'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : att.fileType === 'sheet'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200';

                                return (
                                  <div 
                                    key={att.id} 
                                    className={`p-3 rounded-xl border transition-all ${
                                      att.enabled 
                                        ? 'bg-white border-slate-200/90 shadow-2xs' 
                                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleAttachment(att.id)}
                                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer border ${
                                            att.enabled 
                                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                                              : 'bg-white border-slate-300 text-transparent'
                                          }`}
                                          title={att.enabled ? 'Click to disable' : 'Click to enable'}
                                        >
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </button>
                                        <span className={`text-xs font-delight font-extrabold uppercase px-1.5 py-0.2 rounded border ${badgeColor}`}>
                                          {att.fileType.toUpperCase()}
                                        </span>
                                        <span className="text-xs font-sans text-slate-500 font-medium">
                                          {att.fileSize}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {att.url && (
                                          <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                                            title="View attachment"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAttachment(att.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                          title="Remove attachment"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-delight font-semibold text-slate-500 mb-1">
                                        File Name (Merge tags supported: <span className="font-mono text-indigo-600">&#123;&#123;business_name&#125;&#125;</span>)
                                      </label>
                                      <input 
                                        type="text" 
                                        value={att.fileName}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEmailAttachments(prev => prev.map(a => a.id === att.id ? { ...a, fileName: val } : a));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-delight font-medium text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all"
                                        placeholder="e.g. {{business_name}}_Growth_Blueprint.pdf"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* LAYER 2: LAYOUT & STYLING LAYER                          */}
              {/* ======================================================== */}
              {editorLayer === 'styling' && (
                <div className="space-y-4 animate-in fade-in duration-150 font-delight font-medium">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-0.5">Layout & Responsive Geometry</h4>
                    <p className="text-xs text-slate-500">Configure global container parameters for all screen viewports.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Container Width</label>
                      <select 
                        value={templateStyling.containerWidth}
                        onChange={(e) => setTemplateStyling({ ...templateStyling, containerWidth: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-medium outline-none"
                      >
                        <option value="540px">Compact (540px)</option>
                        <option value="600px">Standard Industry (600px)</option>
                        <option value="660px">Wide Editorial (660px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inner Padding</label>
                      <select 
                        value={templateStyling.spacingPadding}
                        onChange={(e) => setTemplateStyling({ ...templateStyling, spacingPadding: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-medium outline-none"
                      >
                        <option value="16px">Compact Padding (16px)</option>
                        <option value="24px">Balanced Padding (24px)</option>
                        <option value="32px">Spacious Padding (32px)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Brand Accent Tone</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Dark Indigo', val: '#191716' },
                        { name: 'Electric Indigo', val: '#4F46E5' },
                        { name: 'Warm Indigo', val: '#C85A32' },
                        { name: 'Ice Blue', val: '#C7D2FE' },
                        { name: 'Pure White', val: '#FFFFFF' },
                        { name: 'Emerald', val: '#10B981' }
                      ].map((col) => (
                        <button
                          key={col.val}
                          type="button"
                          onClick={() => setTemplateStyling({ ...templateStyling, accentColor: col.val })}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            templateStyling.accentColor === col.val 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs' 
                              : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: col.val }} />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* LAYER 3: DELIVERABILITY & PRE-FLIGHT HEALTH              */}
              {/* ======================================================== */}
              {editorLayer === 'deliverability' && (
                <div className="space-y-4 animate-in fade-in duration-150 font-delight font-medium">
                  {/* Health Meter Card */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border border-emerald-200 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-emerald-950">Deliverability Health Score</div>
                          <div className="text-xs text-emerald-800">Evaluates inbox placement against spam filter thresholds</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-emerald-700 font-mono">
                        {deliverabilityAnalysis.score}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SendGrid Port 443 HTTPS Active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SPF / DKIM Identity Aligned</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1-Click CAN-SPAM Opt-Out Enforced</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Executive Identity & Signature Verified</span>
                      </div>
                    </div>

                    {deliverabilityAnalysis.triggers.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>Spam Filter Triggers Detected in Copy:</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Consider replacing: <span className="font-mono font-bold text-amber-950">{deliverabilityAnalysis.triggers.join(', ')}</span> with more conversational phrasing.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Toggle Controls List */}
                  <div className="bg-white border border-[#E5E0D5] rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    {/* Plain Text Mode Toggle */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Ultra-Deliverable Plain Text Mode</div>
                        <p className="text-[11px] text-slate-500">Strips marketing containers; renders as a personal 1-to-1 letter sent straight from your inbox.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={plainTextMode}
                        onChange={(e) => setPlainTextMode(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Open Tracking */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">1x1 Invisible Open Tracking Pixel</div>
                        <p className="text-[11px] text-slate-500">Records timestamp when lead opens your communication.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={trackOpens}
                        onChange={(e) => setTrackOpens(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Click Tracking */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Click &amp; Link Tracking</div>
                        <p className="text-[11px] text-slate-500">Monitors prospect engagement across website, booking links, and case studies.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={trackClicks}
                        onChange={(e) => setTrackClicks(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Anti-Spam Human Jitter */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Anti-Spam Human Sending Jitter</div>
                        <p className="text-[11px] text-slate-500">Randomizes intervals (45s - 120s) between batch sends to prevent ESP throttling.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={antiSpamJitter}
                        onChange={(e) => setAntiSpamJitter(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Unsubscribe Legal Footer */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">CAN-SPAM 1-Click Opt-Out Footer</div>
                        <p className="text-[11px] text-slate-500">Appends legal physical mailing address and one-click unsubscribe token.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={includeUnsubscribe}
                        onChange={(e) => setIncludeUnsubscribe(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    {/* Dynamic Tag Fallback Guard */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Dynamic Variable Fallback Guard</div>
                        <p className="text-[11px] text-slate-500">Replaces missing fields with natural phrases (e.g. "Business Owner" instead of blank brackets).</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={enableTagFallback}
                        onChange={(e) => setEnableTagFallback(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Action Bar */}
            <div className="px-5 py-3 border-t border-[#E5E0D5] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl font-delight font-medium">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SendGrid Web API Transport Ready · Port 443 HTTPS</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                <button 
                  type="button"
                  onClick={() => handleOpenWebmail(previewLead)}
                  className="whitespace-nowrap shrink-0 bg-white border border-[#E5E0D5] hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Open prefilled email in Gmail"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open Webmail</span>
                </button>
                <button 
                  type="button"
                  onClick={handleSendSingleTest}
                  disabled={isSendingSingle}
                  className="whitespace-nowrap shrink-0 bg-white border border-[#E5E0D5] hover:bg-slate-50 disabled:opacity-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSendingSingle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="whitespace-nowrap shrink-0 bg-[#191716] hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch Email Batch</span>
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT: LIVE PREVIEW PANE */}
          {/* ======================================================== */}
          <div 
            ref={previewCardRef}
            className="w-full xl:w-[42%] 2xl:w-[40%] flex flex-col h-full bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs font-delight font-medium"
          >
            {/* Right Pane Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-[#E5E0D5] bg-white flex items-center justify-between gap-2.5 relative z-30 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Preview</span>
                </div>

                {/* Viewport switch */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button 
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      previewViewport === 'desktop' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Desktop
                  </button>
                  <button 
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      previewViewport === 'mobile' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                {/* Sequence Step Switcher (when sequence enabled) */}
                {enableFollowUpSequence && (
                  <div className="flex bg-purple-50 p-0.5 rounded-lg border border-purple-200 text-xs">
                    <button
                      onClick={() => setActiveSequenceStep(1)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        activeSequenceStep === 1 ? 'bg-purple-600 text-white font-bold shadow-2xs' : 'text-purple-700'
                      }`}
                    >
                      Step 1
                    </button>
                    <button
                      onClick={() => setActiveSequenceStep(2)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        activeSequenceStep === 2 ? 'bg-purple-600 text-white font-bold shadow-2xs' : 'text-purple-700'
                      }`}
                    >
                      Step 2
                    </button>
                    <button
                      onClick={() => setActiveSequenceStep(3)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        activeSequenceStep === 3 ? 'bg-purple-600 text-white font-bold shadow-2xs' : 'text-purple-700'
                      }`}
                    >
                      Step 3
                    </button>
                  </div>
                )}

                {/* A/B Switcher (when A/B enabled) */}
                {isAbTesting && (
                  <div className="flex bg-indigo-50 p-0.5 rounded-lg border border-indigo-200 text-xs">
                    <button
                      onClick={() => setActiveVariant('A')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        activeVariant === 'A' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-indigo-700'
                      }`}
                    >
                      Var A
                    </button>
                    <button
                      onClick={() => setActiveVariant('B')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        activeVariant === 'B' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-indigo-700'
                      }`}
                    >
                      Var B
                    </button>
                  </div>
                )}
              </div>

              {/* Prospect Dropdown Switcher */}
              <div className="relative" ref={leadDropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleLeadDropdown}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-[#E5E0D5] text-xs text-slate-700 shadow-2xs cursor-pointer"
                >
                  <span className="text-slate-400">Prospect:</span>
                  <span className="font-semibold text-slate-900 max-w-[140px] truncate">{previewLead.businessName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLeadDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLeadDropdownOpen && (
                  <div className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} mt-1.5 w-72 bg-white border border-[#E5E0D5] rounded-xl shadow-xl overflow-hidden z-50`}>
                    <div className="p-2.5 border-b border-slate-100 bg-[#FAF8F5]">
                      <input
                        type="text"
                        value={leadSearchQuery}
                        onChange={(e) => setLeadSearchQuery(e.target.value)}
                        placeholder="Search prospects..."
                        className="w-full bg-white border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 divide-y divide-slate-50">
                      {filteredAvailableLeads.map((lead) => (
                        <button
                          key={lead._id || lead.businessName}
                          onClick={() => {
                            setPreviewLead(lead);
                            setIsLeadDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            previewLead.businessName === lead.businessName ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-semibold">{lead.businessName}</div>
                            <div className="text-slate-400 text-xs truncate">{lead.location} · {lead.category}</div>
                          </div>
                          {previewLead.businessName === lead.businessName && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Viewport Canvas */}
            <div className="flex-1 min-h-0 p-5 overflow-y-auto custom-scrollbar flex items-start justify-center">
              
              <div 
                className={`bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden transition-all duration-150 ${
                  previewViewport === 'mobile' ? 'w-[375px]' : 'w-full max-w-[620px]'
                }`}
                style={{ borderRadius: templateStyling.borderRadius }}
              >
                
                {/* Email Chrome Header */}
                <div className="border-b border-slate-100 p-4 bg-gradient-to-r from-slate-50/90 via-indigo-50/20 to-white text-xs font-delight">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {(signatureName || 'S').charAt(0)}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-900">{signatureName}</span> &lt;{user?.email || 'outreach@strovr.space'}&gt;
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                      Primary Inbox
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mb-2 pl-8">
                    To: <span className="text-slate-800 font-semibold">{previewLead.email || `contact@${previewLead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'biz'}.com`}</span>
                  </div>
                  <div 
                    className="font-bold text-sm text-slate-900 tracking-tight font-sans pl-8"
                    dangerouslySetInnerHTML={{ __html: renderPreviewHtml(currentDisplaySubject) }}
                  />
                </div>

                {/* Plain Text Mode View */}
                {plainTextMode ? (
                  <div className="p-6 sm:p-8 space-y-4 font-sans text-slate-900 bg-white leading-relaxed text-xs">
                    <div 
                      className="whitespace-pre-wrap leading-relaxed text-slate-800"
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml(currentDisplayBody) }}
                    />
                    {renderExecutiveSignature()}
                  </div>
                ) : (
                  <>
                    {/* Render standard template layouts */}
                    {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 1: TEXT ONLY                      */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'text_only' && (
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center font-delight font-bold text-xs">
                          LP
                        </div>
                        {templateData.preheader && (
                          <span 
                            className="text-xs font-delight font-medium text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader) }}
                          />
                        )}
                      </div>
                      <h2 
                        className="text-base font-bold text-slate-900 tracking-tight leading-snug"
                        dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                      />
                      <div 
                        className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans"
                        dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                      />
                      {templateData.ctaText && (
                        <div className="pt-2">
                          <a 
                            href={templateData.ctaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 rounded-md text-xs font-delight font-semibold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: templateStyling.accentColor }}
                          >
                            {templateData.ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 2: ONE COLUMN                     */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'one_column' && (
                    <div className="p-6 sm:p-8 space-y-4 text-center">
                      <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center font-delight font-bold text-xs mx-auto shadow-xs">
                        LP
                      </div>
                      <div className="space-y-1">
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight leading-snug"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        {templateData.subheadline && (
                          <p 
                            className="text-xs text-slate-500 font-sans"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.subheadline) }}
                          />
                        )}
                      </div>

                      {/* Hero Image Banner */}
                      <div className="w-full h-40 bg-slate-900 rounded-md flex items-center justify-center text-white p-6 shadow-xs relative overflow-hidden border border-slate-800">
                        <div className="relative z-10 text-center space-y-1">
                          <span 
                            className="text-xs font-delight font-semibold uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-sm inline-block border border-white/20"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader || `${previewLead.location} Growth Focus`) }}
                          />
                          <h3 className="font-bold text-sm tracking-tight">{previewLead.fieldOfWork} Suite</h3>
                        </div>
                      </div>

                      <div 
                        className="text-xs text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-sans"
                        dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                      />

                      {templateData.ctaText && (
                        <div className="pt-2">
                          <a 
                            href={templateData.ctaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-2.5 rounded-md text-xs font-delight font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
                            style={{ backgroundColor: templateStyling.accentColor }}
                          >
                            {templateData.ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 3: INTERACTIVE CALENDAR BOOKING CARD */}
                  {/* ---------------------------------------------------- */}
                  {(selectedTemplateId === 'interactive_calendar' || (selectedTemplateId === 'two_column' && templateData.timeSlots)) && (
                    <div className="p-6 sm:p-8 space-y-4">
                      {/* Top live scheduling pill */}
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-delight font-bold">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span>Google Calendar Engine &bull; Instant Confirmation</span>
                        </span>
                      </div>

                      {/* Host Profile Header */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={templateData.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'} 
                            alt={templateData.hostName || 'Alex Roberts'} 
                            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 font-delight truncate">
                              {templateData.hostName || 'Alex Roberts'}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              {templateData.hostTitle || 'Growth Director, Strovr'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-delight font-semibold text-slate-700">
                          ⏱️ {templateData.duration || '15 mins'}
                        </div>
                      </div>

                      {/* Headline & Narrative */}
                      <div className="text-center space-y-1.5">
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight leading-snug"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        {templateData.subheadline && (
                          <p 
                            className="text-xs text-slate-500 font-sans"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.subheadline) }}
                          />
                        )}
                        <div 
                          className="text-xs text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-sans pt-1"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Interactive Time Slots Grid */}
                      <div className="space-y-2 pt-1">
                        <div className="text-center">
                          <span className="text-xs font-delight font-bold uppercase tracking-wider text-slate-600">
                            Select a Preferred Time Slot (Google Meet)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(templateData.timeSlots || [
                            { label: 'Tomorrow 10:30 AM', time: '10:30 AM' },
                            { label: 'Tomorrow 2:00 PM', time: '2:00 PM' },
                            { label: 'Friday 4:30 PM', time: '4:30 PM' },
                            { label: 'View All Available Slots →', time: 'All Slots' }
                          ]).map((slot: any, idx: number) => {
                            const isSelected = selectedCalendarSlot === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedCalendarSlot(idx)}
                                className={`p-2.5 rounded-md border text-xs font-delight font-semibold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  isSelected 
                                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-600' 
                                    : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                                <span className="truncate">{slot.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meeting Agenda Bullets */}
                      {templateData.meetingAgenda && templateData.meetingAgenda.length > 0 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                          <span className="text-xs font-delight font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Session Agenda:
                          </span>
                          {templateData.meetingAgenda.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span dangerouslySetInnerHTML={{ __html: renderPreviewHtml(item) }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Primary CTA */}
                      <div className="text-center pt-2">
                        <a 
                          href={templateData.ctaUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-2.5 rounded-md text-xs font-delight font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
                          style={{ backgroundColor: templateStyling.accentColor }}
                        >
                          {templateData.ctaText || 'Get in Touch'}
                        </a>
                        <p className="text-xs text-slate-400 font-sans mt-2">
                          Direct Google Meet invite &bull; Instant calendar sync
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Legacy Fallback: Two Column */}
                  {selectedTemplateId === 'two_column' && !templateData.timeSlots && (
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="text-center space-y-2">
                        <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center font-delight font-bold text-xs mx-auto">
                          LP
                        </div>
                        {templateData.preheader && (
                          <span 
                            className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200 inline-block"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader) }}
                          />
                        )}
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        <p 
                          className="text-xs text-slate-600 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Side-by-Side Dual Blocks */}
                      <div className={`grid gap-3 ${previewViewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between space-y-2.5">
                          <div className="w-full h-20 bg-slate-100 rounded-sm flex items-center justify-center text-slate-700 font-delight font-medium text-xs border border-slate-200">
                            Option A
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900 font-delight mb-1">{templateData.col1Title}</h4>
                            <p className="text-xs text-slate-500 leading-snug font-sans">{templateData.col1Body}</p>
                          </div>
                          <a 
                            href={templateData.col1CtaUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-delight font-medium text-center block transition-colors shadow-xs cursor-pointer"
                          >
                            {templateData.col1Cta || 'Learn More'}
                          </a>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between space-y-2.5">
                          <div className="w-full h-20 bg-slate-100 rounded-sm flex items-center justify-center text-slate-700 font-delight font-medium text-xs border border-slate-200">
                            Option B
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900 font-delight mb-1">{templateData.col2Title}</h4>
                            <p className="text-xs text-slate-500 leading-snug font-sans">{templateData.col2Body}</p>
                          </div>
                          <a 
                            href={templateData.col2CtaUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-delight font-medium text-center block transition-colors shadow-xs cursor-pointer"
                          >
                            {templateData.col2Cta || 'Learn More'}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 4: HYBRID                         */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'hybrid' && (
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center font-delight font-bold text-xs">
                          LP
                        </div>
                        <span 
                          className="text-xs font-delight font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader || 'Monthly Partner Brief') }}
                        />
                      </div>

                      {/* Wide Hero Banner */}
                      <div className="p-5 bg-slate-900 text-white rounded-md space-y-2.5 border border-slate-800">
                        <h2 
                          className="text-base font-bold tracking-tight leading-snug"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        <p 
                          className="text-xs text-slate-300 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.subheadline) }}
                        />
                        {templateData.ctaText && (
                          <a 
                            href={templateData.ctaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3.5 py-1.5 rounded-md text-xs font-delight font-semibold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: templateStyling.accentColor }}
                          >
                            {templateData.ctaText}
                          </a>
                        )}
                      </div>

                      {/* Secondary Multi-Column Block */}
                      <div className={`grid gap-2.5 pt-1 ${previewViewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-xs bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-delight font-medium text-xs">
                              01
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-slate-900 font-delight">{templateData.col1Title}</h4>
                              <p className="text-xs text-slate-500 leading-snug mt-0.5 font-sans">{templateData.col1Body}</p>
                            </div>
                          </div>
                          {templateData.col1Cta && (
                            <a 
                              href={templateData.col1CtaUrl || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-delight font-medium text-slate-900 hover:underline inline-block pt-1"
                            >
                              {templateData.col1Cta} →
                            </a>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-xs bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-delight font-medium text-xs">
                              02
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-slate-900 font-delight">{templateData.col2Title}</h4>
                              <p className="text-xs text-slate-500 leading-snug mt-0.5 font-sans">{templateData.col2Body}</p>
                            </div>
                          </div>
                          {templateData.col2Cta && (
                            <a 
                              href={templateData.col2CtaUrl || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-delight font-medium text-slate-900 hover:underline inline-block pt-1"
                            >
                              {templateData.col2Cta} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 5: INVERTED PYRAMID               */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'inverted_pyramid' && (
                    <div className="p-6 sm:p-8 space-y-4 text-center">
                      <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center font-delight font-bold text-xs mx-auto">
                        LP
                      </div>

                      {/* Wide Top Visual (Pyramid Base) */}
                      <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-md p-5 flex flex-col items-center justify-center text-center space-y-1">
                        <span 
                          className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded-xs"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader || 'Exclusive 500-Lead Reserve') }}
                        />
                        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                          High-Impact Compute Funnel
                        </h3>
                      </div>

                      {/* Tapering Copy (Pyramid Middle) */}
                      <div className="max-w-md mx-auto space-y-1.5">
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight leading-snug"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        <p 
                          className="text-xs text-slate-600 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Focused Call-to-Action Vertex (Pyramid Point) */}
                      <div className="pt-2 flex flex-col items-center">
                        <div className="text-slate-300 mb-1 text-xs font-delight font-medium">▼</div>
                        <a 
                          href={templateData.ctaUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2 rounded-md text-xs font-delight font-medium text-white shadow-xs inline-flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800"
                        >
                          <span>{templateData.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 6: INTERACTIVE ROI & COST BENCHMARK */}
                  {/* ---------------------------------------------------- */}
                  {(selectedTemplateId === 'interactive_roi' || (selectedTemplateId === 'zig_zag' && templateData.comparisonPulse)) && (
                    <div className="p-6 sm:p-8 space-y-4">
                      {/* Top benchmark pill */}
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-delight font-bold">
                          <span>Cost Benchmark &bull; Projected ROI Analysis</span>
                        </span>
                      </div>

                      {/* Headline & Subhead */}
                      <div className="text-center space-y-1">
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight leading-snug"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        {templateData.subheadline && (
                          <p 
                            className="text-xs text-slate-500 font-sans"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.subheadline) }}
                          />
                        )}
                        <div 
                          className="text-xs text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-sans pt-1"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Comparative Side-by-Side Cards */}
                      <div className={`grid gap-3 pt-1 ${previewViewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {/* Current Legacy */}
                        <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-lg space-y-2">
                          <span className="text-xs font-delight font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            {templateData.comparisonCurrent?.badge || 'Legacy Method'}
                          </span>
                          <h4 className="font-bold text-xs text-rose-950 font-delight">
                            {templateData.comparisonCurrent?.title || 'Traditional Agency'}
                          </h4>
                          <div className="text-lg font-extrabold text-rose-800 line-through">
                            {templateData.comparisonCurrent?.monthlyCost || '₹45,000 / mo'}
                          </div>
                          <div className="text-xs text-rose-800 space-y-0.5 font-sans">
                            <div>&bull; Time: <strong>{templateData.comparisonCurrent?.timeSpent || '14 hrs/week'}</strong></div>
                            <div>&bull; Success: <strong>{templateData.comparisonCurrent?.replyRate || '1.8% Response'}</strong></div>
                          </div>
                        </div>

                        {/* Strovr Solution */}
                        <div className="p-4 bg-emerald-50/70 border-2 border-emerald-400 rounded-lg space-y-2 shadow-xs">
                          <span className="text-xs font-delight font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                            {templateData.comparisonPulse?.badge || '8.4x Lower CAC'}
                          </span>
                          <h4 className="font-bold text-xs text-emerald-950 font-delight">
                            {templateData.comparisonPulse?.title || 'Strovr Autonomous Engine'}
                          </h4>
                          <div className="text-xl font-extrabold text-emerald-900">
                            {templateData.comparisonPulse?.monthlyCost || '₹999 / mo'}
                          </div>
                          <div className="text-xs text-emerald-800 space-y-0.5 font-sans">
                            <div>&bull; Time: <strong>{templateData.comparisonPulse?.timeSpent || '15 mins/week'}</strong></div>
                            <div>&bull; Success: <strong>{templateData.comparisonPulse?.replyRate || '28.4% Response'}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* 3 Metric Pills */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {(templateData.roiMetrics || [
                          { metric: '₹44,301', label: 'Monthly Cost Savings', highlight: true },
                          { metric: '99.4%', label: 'Inbox Deliverability', highlight: false },
                          { metric: '300+', label: 'Verified Leads / Month', highlight: false }
                        ]).map((m: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-lg border text-center ${
                              m.highlight 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="text-sm font-extrabold font-delight">{m.metric}</div>
                            <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Checklist Features */}
                      {templateData.benefitsList && templateData.benefitsList.length > 0 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                          <span className="text-xs font-delight font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Included in Package:
                          </span>
                          {templateData.benefitsList.map((b: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span dangerouslySetInnerHTML={{ __html: renderPreviewHtml(b) }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Primary CTA */}
                      <div className="text-center pt-2">
                        <a 
                          href={templateData.ctaUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-2.5 rounded-md text-xs font-delight font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
                          style={{ backgroundColor: templateStyling.accentColor }}
                        >
                          {templateData.ctaText || 'Claim Growth Tier →'}
                        </a>
                        <p className="text-xs text-slate-400 font-sans mt-2">
                          Instant deployment &bull; 30-day money-back satisfaction guarantee
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Legacy Fallback: Zig Zag */}
                  {selectedTemplateId === 'zig_zag' && !templateData.comparisonPulse && (
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="text-center space-y-1">
                        {templateData.preheader && (
                          <span 
                            className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200 inline-block mb-1"
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader) }}
                          />
                        )}
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        <p 
                          className="text-xs text-slate-500 font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Zig-Zag Row 1: Left Image, Right Text */}
                      <div className={`p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3.5 ${previewViewport === 'mobile' ? 'flex-col' : ''}`}>
                        <div className="w-20 h-20 bg-slate-200 rounded-sm flex items-center justify-center text-slate-700 font-delight font-medium text-xs shrink-0">
                          Step 01
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-xs text-slate-900 font-delight">{templateData.zig1Title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">{templateData.zig1Text}</p>
                          <a 
                            href={templateData.zig1CtaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-900 font-delight font-medium text-xs hover:underline pt-0.5 inline-block cursor-pointer"
                          >
                            {templateData.zig1Cta || 'Learn More →'}
                          </a>
                        </div>
                      </div>

                      {/* Zig-Zag Row 2: Left Text, Right Image */}
                      <div className={`p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3.5 ${previewViewport === 'mobile' ? 'flex-col-reverse' : ''}`}>
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-xs text-slate-900 font-delight">{templateData.zig2Title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">{templateData.zig2Text}</p>
                          <a 
                            href={templateData.zig2CtaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-900 font-delight font-medium text-xs hover:underline pt-0.5 inline-block cursor-pointer"
                          >
                            {templateData.zig2Cta || 'Learn More →'}
                          </a>
                        </div>
                        <div className="w-20 h-20 bg-slate-200 rounded-sm flex items-center justify-center text-slate-700 font-delight font-medium text-xs shrink-0">
                          Step 02
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 7: F PATTERN                      */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'f_pattern' && (
                    <div className="p-6 sm:p-8 space-y-4">
                      {/* Top Bar of F */}
                      <div className="border-b border-slate-200 pb-2.5">
                        <span 
                          className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-400"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader || 'Executive Briefing') }}
                        />
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight leading-snug mt-0.5"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                      </div>

                      {/* Left-Side Scan Spine of F */}
                      <div className="space-y-2.5 pl-3 border-l-2 border-slate-900">
                        <p 
                          className="text-xs text-slate-700 font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />

                        <ul className="space-y-1.5 text-xs text-slate-800 font-sans">
                          <li className="flex items-start gap-2">
                            <span className="font-delight font-medium text-slate-900 shrink-0">•</span>
                            <span>{templateData.fBullet1}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-delight font-medium text-slate-900 shrink-0">•</span>
                            <span>{templateData.fBullet2}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-delight font-medium text-slate-900 shrink-0">•</span>
                            <span>{templateData.fBullet3}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Bottom Anchor Visual */}
                      <div className="w-full h-20 bg-slate-50 rounded-md flex items-center justify-center text-slate-500 text-xs font-delight font-normal border border-slate-200">
                        {templateData.fBottomNote || 'Executive Summary Stream'}
                      </div>

                      {templateData.ctaText && (
                        <div>
                          <a 
                            href={templateData.ctaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-5 py-2 rounded-md text-xs font-delight font-medium text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: templateStyling.accentColor }}
                          >
                            {templateData.ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* TEMPLATE STRUCTURE 8: DYNAMIC PRODUCT FEED           */}
                  {/* ---------------------------------------------------- */}
                  {selectedTemplateId === 'dynamic_product_feed' && (
                    <div className="p-6 sm:p-8 space-y-4 text-center">
                      <div>
                        <span 
                          className="text-xs font-delight font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200 inline-block"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.preheader || 'Dynamic Service Feed') }}
                        />
                        <h2 
                          className="text-base font-bold text-slate-900 tracking-tight mt-1 mb-0.5"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.headline) }}
                        />
                        <p 
                          className="text-xs text-slate-500 font-sans"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                        />
                      </div>

                      {/* Dynamic Product Feed Grid */}
                      <div className={`grid gap-3 my-3 ${
                        previewViewport === 'mobile' 
                          ? 'grid-cols-1' 
                          : (templateData.products || []).length <= 2 
                            ? 'grid-cols-2' 
                            : (templateData.products || []).length === 4
                              ? 'grid-cols-2'
                              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {(templateData.products || []).map((prod, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md flex flex-col justify-between shadow-xs text-left hover:border-slate-300 transition-colors">
                            <div>
                              {prod.imageUrl ? (
                                <div className="w-full h-24 bg-slate-100 rounded-sm overflow-hidden mb-2 relative border border-slate-200">
                                  <img 
                                    src={prod.imageUrl} 
                                    alt={prod.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-14 bg-slate-100 rounded-sm flex items-center justify-center text-xs font-delight font-medium text-slate-700 mb-2 border border-slate-200">
                                  {prod.category || 'Catalog Item'}
                                </div>
                              )}

                              <div className="space-y-1 mb-2">
                                {prod.badge && (
                                  <span className="text-xs font-delight font-semibold uppercase text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded-xs border border-slate-200 inline-block">
                                    {prod.badge}
                                  </span>
                                )}
                                <h4 className="font-semibold text-xs text-slate-900 tracking-tight leading-snug">{prod.name}</h4>
                                {prod.category && (
                                  <p className="text-xs font-delight font-semibold uppercase text-slate-400">{prod.category}</p>
                                )}
                                {prod.description && (
                                  <p className="text-xs text-slate-500 leading-tight pt-0.5 font-sans">{prod.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 mt-1">
                              <p className="font-delight font-bold text-xs text-slate-900 mb-1.5">{prod.price}</p>
                              <a 
                                href={prod.ctaUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-delight font-medium text-center block transition-colors cursor-pointer shadow-xs border border-slate-900"
                              >
                                {prod.ctaText || 'Select Plan'}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>

                      {templateData.ctaText && (
                        <div>
                          <a 
                            href={templateData.ctaUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-5 py-2 rounded-md text-xs font-delight font-medium text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: templateStyling.accentColor }}
                          >
                            {templateData.ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* ATTACHED DOCUMENTS & DECKS PREVIEW CONTAINER         */}
                  {/* ==================================================== */}
                  {emailAttachments.some(a => a.enabled) && (
                    <div className="mx-6 my-4 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 font-sans">
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-xs font-delight font-bold text-slate-700">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Attached Documents ({emailAttachments.filter(a => a.enabled).length})</span>
                        </div>
                        <span className="text-xs font-delight font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Verified Collateral</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {emailAttachments.filter(a => a.enabled).map((att) => {
                          const resolvedName = att.fileName.replace(/{{business_name}}/g, previewLead?.businessName || 'Business');
                          const badgeColor = att.fileType === 'pdf' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : att.fileType === 'image'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : att.fileType === 'sheet'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200';

                          return (
                            <div key={att.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs border shrink-0 ${badgeColor}`}>
                                  {att.fileType.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 truncate">
                                    {resolvedName}
                                  </div>
                                  <div className="text-xs text-slate-500 font-sans">
                                    {att.fileSize} • Attached with outreach
                                  </div>
                                </div>
                              </div>
                              <a 
                                href={att.url || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 ml-2 shadow-xs transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>View</span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  
                    {/* Append Executive Signature inside visual layout */}
                    <div className="px-6 pb-6">
                      {renderExecutiveSignature()}
                    </div>
                  </>
                )}

                {/* Compliance & Deliverability Footer */}
                {includeUnsubscribe && (
                  <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1 font-delight font-normal">
                    <div className="font-medium text-slate-700 text-xs">
                      {signatureCompany || 'Strovr Platform'} • BKC Financial Hub, Mumbai, India • www.strovr.space
                    </div>
                    <p className="text-xs text-slate-400 leading-snug font-sans">
                      You received this communication because <strong>{previewLead.businessName}</strong> is listed in public directories for {previewLead.fieldOfWork} in {previewLead.location}.
                    </p>
                    <div className="text-xs text-slate-400 pt-0.5 font-delight font-normal">
                      <a href="#unsubscribe" className="text-slate-700 underline font-semibold">Unsubscribe instantly</a> • <a href="#privacy" className="text-slate-500 underline">Compliance Policy</a>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}
      <TemplateGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
      />

      <DispatchTrackerModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        templateId={selectedTemplateId}
        templateName={activeTemplateConfig.name}
        templateData={templateDataA}
        templateDataB={templateDataB}
        isAbTesting={isAbTesting}
        templateStyling={{
          ...templateStyling,
          plainTextMode,
          showComplianceFooter: includeUnsubscribe
        }}
        availableLeads={availableLeads}
        currentPreviewLead={previewLead}
        user={user}
        connectedMailbox={connectedMailbox}
        attachments={emailAttachments.filter(a => a.enabled)}
        onCampaignDispatched={() => {
          fetchMailboxStatus();
          setDispatchNotification({
            message: `Outreach campaign successfully dispatched to active lead recipients! Status updated to 'Contacted'.`
          });
        }}
      />

      <EmailProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        user={user}
        onSaved={() => {
          fetchMailboxStatus();
          setDispatchNotification({
            message: 'Email dispatch gateway credentials successfully updated and active!'
          });
        }}
      />

      <SentEmailHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default OutreachCenter;
