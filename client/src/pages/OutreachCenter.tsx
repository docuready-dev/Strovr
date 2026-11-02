import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Mail, MessageCircle, MessageSquare, Send, CheckCircle2, CheckCheck,
  ChevronDown, Phone, Layout, Monitor, 
  Smartphone, Sliders, Edit3, ArrowRight,
  ShieldCheck, Tag, Search, Check, Loader2, ExternalLink, Key,
  Plus, Trash2, Upload, Calendar, Layers,
  Image, FileText, Paperclip, Download, X, File, Eye, Copy, Lock, History
} from 'lucide-react';
import TemplateGalleryModal from '../components/TemplateGalleryModal';
import DispatchTrackerModal from '../components/DispatchTrackerModal';
import EmailProviderModal from '../components/EmailProviderModal';
import SentEmailHistoryModal from '../components/SentEmailHistoryModal';
import WhatsAppBatchQueueModal from '../components/WhatsAppBatchQueueModal';
import { EMAIL_TEMPLATES } from '../data/emailTemplates';
import type { TemplateId } from '../data/emailTemplates';
import { WHATSAPP_TEMPLATES, EMAIL_CAPTURE_BRIDGE_SCRIPT, WHATSAPP_MEDIA_PRESETS } from '../data/whatsappTemplates';
import type { WhatsAppTemplate, WhatsAppImageAttachment, WhatsAppPdfAttachment, WhatsAppMediaPreset } from '../data/whatsappTemplates';
import { useStore } from '../store/useStore';
import { alertDialog } from '../components/AppConfirmModal';
import axios from 'axios';
import API_URL from '../config/api';

const OutreachCenter = () => {
  const { user, token, integrations, setUpgradeModalOpen, setUpgradeTab, recordEmailDispatch, recordAiGeneration } = useStore();
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');

  const defaultBookingHost = localStorage.getItem('strovr_booking_host') || localStorage.getItem('leadpulse_booking_host') || (typeof window !== 'undefined' ? `${window.location.origin}/appointments` : '/appointments');
  const calendarIntegration = integrations.find(i => (i.id === 'google-calendar' || i.id === 'calendly') && i.connected);
  const [bookingHostUrl, setBookingHostUrl] = useState<string>(
    calendarIntegration?.config?.appointmentScheduleUrl || calendarIntegration?.config?.bookingUrl || defaultBookingHost
  );
  const [bookingOnline, setBookingOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/booking/status`, { 
          headers: { userid: user?._id },
          timeout: 3500 
        });
        if (res.data) {
          setBookingOnline(Boolean(res.data.isConnected !== false));
          if (res.data.publicUrl && !calendarIntegration?.config?.appointmentScheduleUrl) {
            setBookingHostUrl(res.data.publicUrl);
          }
        }
      } catch {
        setBookingOnline(true);
      }
    };
    checkBookingStatus();
  }, [user?._id, calendarIntegration]);

  const resolvedBookingUrl = bookingHostUrl;
  const resolvedCalendlyUrl = resolvedBookingUrl;
  const activeMailTransport = integrations.find(i => (i.id === 'gmail-workspace' || i.id === 'google_workspace' || i.id === 'resend' || i.id === 'resend_mailgun') && i.connected);
  const activeSmsTransport = integrations.find(i => i.id === 'twilio' && i.connected);
  
  // Template Studio State
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('one_column');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [dispatchNotification, setDispatchNotification] = useState<{ message: string; previewUrl?: string } | null>(null);
  const [editorLayer, setEditorLayer] = useState<'content' | 'template'>('content');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Connected Sending Mailbox State (Mail-App Architecture)
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

      const res = await axios.get(`${API_URL}/api/outreach/mailbox`, {
        headers
      });
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
    subject: 'Challenger Pitch: Quick growth proposal for {{business_name}}',
    preheader: 'Tailored strategy note for {{business_name}}',
    headline: 'High-Converting Variant B Proposition',
    ctaText: 'Claim Growth Slot'
  });
  const [isAbTesting, setIsAbTesting] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  // Dynamic templateData and setTemplateData accessor/mutators
  const templateData = (isAbTesting && activeVariant === 'B') ? templateDataB : templateDataA;
  const setTemplateData = (updater: any) => {
    if (isAbTesting && activeVariant === 'B') {
      setTemplateDataB(updater);
    } else {
      setTemplateDataA(updater);
    }
  };

  // WhatsApp Studio State (Variant A & Variant B)
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState<string>('local_compliment');
  const [whatsAppMessageA, setWhatsAppMessageA] = useState<string>(WHATSAPP_TEMPLATES[0].defaultMessage);
  const [whatsAppMessageB, setWhatsAppMessageB] = useState<string>(
    WHATSAPP_TEMPLATES[1]?.defaultMessage || WHATSAPP_TEMPLATES[0].defaultMessage
  );
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isWhatsAppQueueOpen, setIsWhatsAppQueueOpen] = useState(false);

  const whatsAppMessage = (isAbTesting && activeVariant === 'B') ? whatsAppMessageB : whatsAppMessageA;
  const setWhatsAppMessage = (updater: any) => {
    if (isAbTesting && activeVariant === 'B') {
      setWhatsAppMessageB(updater);
    } else {
      setWhatsAppMessageA(updater);
    }
  };

  // WhatsApp Rich Media & Document Attachments State (Picture + PDF)
  const [whatsAppImage, setWhatsAppImage] = useState<WhatsAppImageAttachment>({
    enabled: true,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    caption: 'Strovr Growth Analytics & Live Performance Overview',
    fileName: 'Executive_Analytics_Dashboard.jpg'
  });

  const [whatsAppPdf, setWhatsAppPdf] = useState<WhatsAppPdfAttachment>({
    enabled: true,
    url: 'https://www.strovr.space/assets/Strovr_Executive_Deck.pdf',
    fileName: '{{business_name}}_Growth_Blueprint.pdf',
    fileSize: '2.4 MB',
    pageCount: '6 pages'
  });

  // Universal Email Attachments State (Supported across all 10 Email Frameworks)
  const [emailAttachments, setEmailAttachments] = useState<Array<{
    id: string;
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'image' | 'doc' | 'sheet';
    url: string;
    base64?: string;
    enabled: boolean;
  }>>([
    {
      id: 'email-att-1',
      fileName: '{{business_name}}_Growth_Blueprint.pdf',
      fileSize: '2.4 MB',
      fileType: 'pdf',
      url: 'https://www.strovr.space/assets/Strovr_Executive_Deck.pdf',
      enabled: true
    }
  ]);
  const emailFileInputRef = useRef<HTMLInputElement>(null);

  const [activeMediaPresetId, setActiveMediaPresetId] = useState<string>('executive_deck');
  const [copiedMediaLinks, setCopiedMediaLinks] = useState(false);

  // Template Styling Layer Settings
  const [templateStyling, setTemplateStyling] = useState({
    containerWidth: '600px',
    spacingPadding: '24px',
    accentColor: '#191716', // Dark Indigo
    borderRadius: '6px',
    showComplianceFooter: true
  });

  // Dynamic workspace profile fallback when the user hasn't harvested leads yet
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

  // Toggle and dynamically calculate whether dropdown should anchor left or right
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

  // Re-check dropdown alignment on window resize or scroll when open
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

  // Close dropdown on click outside
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

  // Select a new template from gallery
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
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'persuasive' | 'direct' | 'executive' | 'urgent'>('persuasive');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // File Upload Helper for Dynamic Catalog Products
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

  // AI Auto-Compose Handler for Any Template
  const handleAiGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    // Monthly AI Copilot Quota Check
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

      const res = await axios.post(`${API_URL}/api/outreach/ai-generate`, {
        templateId: selectedTemplateId,
        prompt: promptToUse,
        tone: aiTone,
        niche: previewLead?.fieldOfWork || previewLead?.category,
        userBusinessName: user?.name || 'Strovr'
      }, {
        headers
      });

      if (res.data?.generatedData) {
        setTemplateData(prev => ({
          ...prev,
          ...res.data.generatedData
        }));
        recordAiGeneration();
        setAiSuccessMessage('✨ All template segments auto-composed with merge tags!');
        setTimeout(() => setAiSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        await alertDialog({
          title: 'Monthly Generation Quota Reached',
          message: err.response.data?.error || `Monthly generation quota reached. Upgrade your plan to compose more campaigns.`,
          variant: 'warning'
        });
        setUpgradeModalOpen(true);
        return;
      }
      console.warn('Backend AI endpoint failed, falling back to instant client AI synthesis:', err);
      // High-converting executive client-side synthesis
      const p = promptToUse.trim().toLowerCase();

      const isIntroOrCall = p.includes('call') || p.includes('15-minute') || p.includes('15 min') || 
                            p.includes('introductory') || p.includes('growth call') || p.includes('decision maker') ||
                            p.includes('meeting') || p.includes('discovery') || p.includes('chat') ||
                            p.includes('appointment') || p.includes('calendar') || p.includes('schedule') ||
                            p.includes('pipeline') || p.includes('book');

      const isAudit = p.includes('audit') || p.includes('review') || p.includes('analysis') || 
                      p.includes('benchmark') || p.includes('competitor') || p.includes('teardown') || p.includes('gap');

      const isDiscount = p.includes('discount') || p.includes('offer') || p.includes('deal') || 
                         p.includes('pilot') || p.includes('special') || p.includes('pricing') || p.includes('trial');

      const isDemo = p.includes('demo') || p.includes('software') || p.includes('platform') || 
                     p.includes('walkthrough') || p.includes('tool');

      let subject = `Quick 15-minute growth conversation for {{business_name}}`;
      let preheader = `Scaling pipeline and driving predictable revenue growth`;
      let headline = `Predictable Pipeline & Growth for {{business_name}}`;
      let subheadline = `Streamlining sales operations and connecting with high-value prospects.`;
      let body = '';
      let ctaText = 'Book 15-Min Growth Call';

      if (isIntroOrCall) {
        subject = `Quick 15-minute growth conversation for {{business_name}}`;
        preheader = `Scaling pipeline and driving predictable revenue growth`;
        headline = `Predictable Pipeline & Growth for {{business_name}}`;
        subheadline = `Streamlining sales operations and connecting with high-value prospects.`;
        body = `Are you looking to scale your pipeline and drive predictable revenue growth without the guesswork?\n\nWe help businesses streamline their sales operations and connect directly with high-value prospects. I would love to invite you to a quick 15-minute introductory growth call to share how we can tailor this for your team.\n\nFeel free to grab a quick slot that works best for you here: {{booking_link}}\n\nLooking forward to connecting!`;
        ctaText = 'Book 15-Min Growth Call';
      } else if (isAudit) {
        subject = `Complimentary Growth Audit & Benchmarks for {{business_name}}`;
        preheader = `Uncovering high-impact revenue leverage points`;
        headline = `Unlocking Hidden Revenue for {{business_name}}`;
        subheadline = `Data-backed acquisition and conversion benchmarks across {{location}}.`;
        body = `Are you getting the maximum return from your client acquisition channels in {{location}}?\n\nWe conducted a preliminary analysis on the local footprint of {{business_name}} and identified three actionable opportunities to accelerate qualified pipeline.\n\nI have compiled the full benchmarks and recommendations into a brief executive breakdown.\n\nFeel free to review your complimentary audit here: {{booking_link}}\n\nExcited to hear your thoughts!`;
        ctaText = 'View Free Growth Audit';
      } else if (isDiscount) {
        subject = `Exclusive Preferred Partner Terms for {{business_name}}`;
        preheader = `Reserved acquisition infrastructure for your team`;
        headline = `Accelerate Growth with Preferred Partner Access`;
        subheadline = `Dedicated pipeline acceleration for industry leaders in {{location}}.`;
        body = `Looking for an unfair advantage to scale customer acquisition this quarter without adding overhead?\n\nWe are rolling out an exclusive growth initiative for select leaders in {{location}}, delivering automated prospecting and verified decision-maker introductions on preferred terms.\n\nWe have reserved a dedicated pilot slot for {{business_name}}.\n\nReview the reserved terms and pick a convenient slot here: {{booking_link}}\n\nLooking forward to collaborating!`;
        ctaText = 'Claim Preferred Terms';
      } else if (isDemo) {
        subject = `Interactive Pipeline Walkthrough for {{business_name}}`;
        preheader = `Zero manual prospecting and verified inbox deliverability`;
        headline = `Automate Your Acquisition Pipeline`;
        subheadline = `Autonomous discovery and personalized multi-channel outreach.`;
        body = `How much time is your team spending every week on manual prospecting and lead research?\n\nOur autonomous platform discovers verified decision makers, validates real-time email deliverability, and orchestrates personalized outreach in minutes.\n\nI would love to walk you through a brief 10-minute live demonstration tailored to {{business_name}}.\n\nGrab a quick walkthrough slot that works best for you here: {{booking_link}}\n\nLooking forward to connecting!`;
        ctaText = 'Book Live Demo';
      } else {
        subject = `Strategic Growth Initiative for {{business_name}}`;
        preheader = `Predictable revenue growth and pipeline acceleration`;
        headline = `Scale Acquisition for {{business_name}} in {{location}}`;
        subheadline = `Connecting directly with verified high-value decision makers.`;
        body = `Are you looking to scale your pipeline and drive predictable revenue growth without the guesswork?\n\nWe help businesses streamline their sales operations and connect directly with high-value prospects across {{location}}. I would love to invite you to a quick 15-minute introductory growth call to share how we can tailor this for your team.\n\nFeel free to grab a quick slot that works best for you here: {{booking_link}}\n\nLooking forward to connecting!`;
        ctaText = 'Book 15-Min Growth Call';
      }

      const generated: any = {
        subject,
        preheader,
        headline,
        subheadline,
        body,
        ctaText,
        ctaUrl: resolvedBookingUrl,
        secondaryCtaText: 'View Growth Deck',
        secondaryCtaUrl: 'https://www.strovr.space/assets/Strovr_Executive_Deck.pdf'
      };

      if (selectedTemplateId === 'two_column' || selectedTemplateId === 'hybrid') {
        generated.col1Title = '15-Min Strategy Session';
        generated.col1Body = `Walk through tailored pipeline bottlenecks and revenue opportunities for {{business_name}}.`;
        generated.col1Cta = 'Reserve Strategy Slot';
        generated.col1CtaUrl = resolvedBookingUrl;
        generated.col2Title = 'Executive Briefing Deck';
        generated.col2Body = `Review our high-ticket conversion metrics and verified client case studies on your own schedule.`;
        generated.col2Cta = 'Download Executive Deck';
        generated.col2CtaUrl = 'https://www.strovr.space/assets/Strovr_Executive_Deck.pdf';
      } else if (selectedTemplateId === 'zig_zag') {
        generated.zig1Title = '1. Pipeline Scalability';
        generated.zig1Text = `Identify and connect with high-intent decision makers across {{location}} with zero scraping friction.`;
        generated.zig1Cta = 'Explore Discovery';
        generated.zig1CtaUrl = resolvedBookingUrl;
        generated.zig2Title = '2. Predictable Execution';
        generated.zig2Text = `Turn cold prospects into booked discovery calls with proven executive outreach frameworks.`;
        generated.zig2Cta = 'Book 15-Min Call';
        generated.zig2CtaUrl = resolvedBookingUrl;
      } else if (selectedTemplateId === 'f_pattern') {
        generated.fBullet1 = `Predictable Pipeline: Reach verified commercial decision makers across {{location}}.`;
        generated.fBullet2 = `Zero Guesswork: Streamline sales operations with automated, high-deliverability dispatch.`;
        generated.fBullet3 = `Tailored Growth: 15-minute introductory session focused entirely on {{business_name}}'s revenue goals.`;
        generated.fBottomNote = `Direct calendar booking link: {{booking_link}}`;
      } else if (selectedTemplateId === 'dynamic_product_feed') {
        generated.products = [
          {
            name: 'Starter Pipeline',
            category: 'Lead Discovery',
            price: '₹999 / mo',
            badge: 'Starter',
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
            description: `Get started with verified local prospects in {{location}}.`,
            ctaText: 'Select Starter',
            ctaUrl: resolvedBookingUrl
          },
          {
            name: 'Pro Multi-Channel Suite',
            category: 'Full Automation',
            price: '₹1,999 / mo',
            badge: 'Most Popular',
            imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
            description: `Engage decision makers directly across Email and WhatsApp.`,
            ctaText: 'Select Pro',
            ctaUrl: resolvedBookingUrl
          },
          {
            name: 'Executive Partnership',
            category: 'Dedicated Scale',
            price: '₹4,999 / mo',
            badge: 'Enterprise',
            imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&auto=format&fit=crop&q=80',
            description: `Full done-for-you pipeline scaling for {{business_name}}.`,
            ctaText: 'Select Enterprise',
            ctaUrl: resolvedBookingUrl
          }
        ];
      }

      setTemplateData(prev => ({ ...prev, ...generated }));
      recordAiGeneration();
      setAiSuccessMessage('✨ All template segments auto-composed with merge tags!');
      setTimeout(() => setAiSuccessMessage(null), 6000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const insertTag = (tag: string) => {
    if (activeChannel === 'whatsapp') {
      setWhatsAppMessage(prev => prev + ' ' + tag);
    } else {
      setTemplateData(prev => ({
        ...prev,
        body: prev.body + ' ' + tag
      }));
    }
  };

  // Highlighting Renderer for text preview with natural styling
  const renderPreviewHtml = (text?: string) => {
    if (!text) return '';
    let rendered = text;
    const targetLead = previewLead || workspaceProfileLead || {
      businessName: 'Target Business',
      location: 'Local Market',
      fieldOfWork: 'B2B Services',
      category: 'B2B Services',
      firstName: 'Partner',
      phone: '+91 98765 43210',
      rating: '4.8'
    };
    const bName = targetLead.businessName || 'Target Business';
    const loc = targetLead.location || 'Local Market';
    const fow = targetLead.fieldOfWork || targetLead.category || 'B2B Services';
    const tag = targetLead.category || targetLead.fieldOfWork || 'B2B Services';
    const fName = targetLead.firstName || (targetLead.businessName ? targetLead.businessName.split(' ')[0] : 'Partner');
    const phone = targetLead.phone || '+91 98765 43210';
    const rating = targetLead.rating || '4.8';

    const senderName = user?.name || 'Workspace Operator';
    const senderEmail = user?.email || 'outreach@strovr.space';
    const senderCompany = user?.company_name || 'Strovr';

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

  // WhatsApp Hook Selection Handler
  const handleSelectWhatsAppTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedWhatsAppId(tpl.id);
    setWhatsAppMessage(tpl.defaultMessage);
    if (tpl.suggestedImage) {
      setWhatsAppImage(prev => ({
        ...prev,
        ...tpl.suggestedImage,
        enabled: true
      }));
    }
    if (tpl.suggestedPdf) {
      setWhatsAppPdf(prev => ({
        ...prev,
        ...tpl.suggestedPdf,
        enabled: true
      }));
    }
  };

  // Insert Email Capture Bridge Script
  const handleInsertBridgeScript = () => {
    setWhatsAppMessage(prev => prev + '\n\n' + EMAIL_CAPTURE_BRIDGE_SCRIPT);
  };

  // Apply Media Preset
  const handleApplyMediaPreset = (preset: WhatsAppMediaPreset) => {
    setActiveMediaPresetId(preset.id);
    setWhatsAppImage({
      enabled: true,
      url: preset.image.url,
      caption: preset.image.caption,
      fileName: preset.image.fileName
    });
    setWhatsAppPdf({
      enabled: true,
      url: preset.pdf.url,
      fileName: preset.pdf.fileName,
      fileSize: preset.pdf.fileSize,
      pageCount: preset.pdf.pageCount
    });
  };

  // Handle Image File Upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setWhatsAppImage({
            enabled: true,
            url: result,
            fileName: file.name,
            caption: whatsAppImage.caption || `Attached visual: ${file.name}`
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle PDF File Upload
  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = parseFloat(sizeMb) > 0.1 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setWhatsAppPdf({
          enabled: true,
          url: result || `https://www.strovr.space/assets/${encodeURIComponent(file.name)}`,
          fileName: file.name,
          fileSize: sizeStr,
          pageCount: 'Doc'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy Media Links Only
  const handleCopyMediaLinks = () => {
    const lines: string[] = [];
    if (whatsAppPdf.enabled && whatsAppPdf.url) {
      lines.push(`PDF Document (${whatsAppPdf.fileName}): ${whatsAppPdf.url}`);
    }
    if (whatsAppImage.enabled && whatsAppImage.url) {
      lines.push(`Image (${whatsAppImage.fileName || 'Visual'}): ${whatsAppImage.url}`);
    }
    if (lines.length > 0) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopiedMediaLinks(true);
      setTimeout(() => setCopiedMediaLinks(false), 2400);
    }
  };

  // Format Text for External Copy / Dispatch
  const getCompiledWhatsAppMessage = (lead: any) => {
    const targetLead = lead || previewLead || workspaceProfileLead || {};
    let msg = whatsAppMessage || '';
    const bName = targetLead.businessName || 'Business';
    const loc = targetLead.location || 'Local Area';
    const fow = targetLead.fieldOfWork || targetLead.category || 'Services';
    const tag = targetLead.category || targetLead.fieldOfWork || 'Services';
    const fName = targetLead.firstName || (targetLead.businessName ? targetLead.businessName.split(' ')[0] : 'Partner');
    const phone = targetLead.phone || '';
    const rating = targetLead.rating || '4.8';

    msg = msg.replace(/{{business_name}}/g, bName);
    msg = msg.replace(/{{location}}/g, loc);
    msg = msg.replace(/{{field_of_work}}/g, fow);
    msg = msg.replace(/{{tag}}/g, tag);
    msg = msg.replace(/{{first_name}}/g, fName);
    msg = msg.replace(/{{phone}}/g, phone);
    msg = msg.replace(/{{rating}}/g, rating);
    msg = msg.replace(/{{(booking_link|calendly_link|appointment_link)}}/g, `Book an Appointment : ${resolvedBookingUrl}`);

    // Append Media Attachments neatly (Safeguard: never embed giant data: base64 URLs in text or wa.me URLs)
    const mediaItems: string[] = [];
    if (whatsAppPdf?.enabled) {
      const cleanPdfName = String(whatsAppPdf.fileName || 'Overview.pdf').replace(/{{business_name}}/g, bName);
      if (whatsAppPdf.url && (whatsAppPdf.url.startsWith('http://') || whatsAppPdf.url.startsWith('https://'))) {
        mediaItems.push(`📄 *Document Attached:* ${cleanPdfName} (${whatsAppPdf.fileSize || 'PDF'})\n🔗 Access Link: ${whatsAppPdf.url}`);
      } else {
        mediaItems.push(`📄 *Document Attached:* ${cleanPdfName} (${whatsAppPdf.fileSize || 'PDF'}) [📎 File Attached in Strovr]`);
      }
    }
    if (whatsAppImage?.enabled) {
      const captionStr = whatsAppImage.caption ? ` (${whatsAppImage.caption})` : '';
      const cleanImgName = whatsAppImage.fileName || 'Visual Preview';
      if (whatsAppImage.url && (whatsAppImage.url.startsWith('http://') || whatsAppImage.url.startsWith('https://'))) {
        mediaItems.push(`🖼️ *Visual Preview:* ${cleanImgName}${captionStr}\n🔗 Access Link: ${whatsAppImage.url}`);
      } else {
        mediaItems.push(`🖼️ *Visual Preview:* ${cleanImgName}${captionStr} [📎 Visual Attached in Strovr]`);
      }
    }

    if (mediaItems.length > 0) {
      msg += `\n\n────────────────\n📎 *Attached Media & Deliverables:*\n\n` + mediaItems.join('\n\n');
    }

    return msg;
  };

  // Open Direct in WhatsApp Web
  const handleOpenWhatsAppWeb = async (lead: any) => {
    const targetLead = lead || previewLead || workspaceProfileLead;
    const cleanPhone = (targetLead?.phone || '').replace(/[^0-9]/g, '');
    
    if (!cleanPhone || cleanPhone.length < 7) {
      await alertDialog({
        title: 'Missing Phone Number',
        message: `No valid WhatsApp phone number was found for "${targetLead?.businessName || 'this prospect'}". Please set a valid contact number in the CRM or select a lead with a phone listing before launching WhatsApp Web.`,
        variant: 'warning'
      });
      return;
    }

    const rawText = getCompiledWhatsAppMessage(targetLead);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawText)}`;
    window.open(url, '_blank');
  };

  // Copy WhatsApp Script
  const handleCopyWhatsApp = () => {
    const rawText = getCompiledWhatsAppMessage(previewLead);
    navigator.clipboard.writeText(rawText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

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
      name: 'Commercial Pricing & Scope',
      fileName: 'Commercial_Pricing_Sheet.pdf',
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
    const subject = renderPreviewHtml(templateData.subject || 'Strategic Partnership Inquiry');
    const activeAtts = emailAttachments.filter(a => a.enabled);
    const attachmentNote = activeAtts.length > 0 
      ? `\n\n[Attached Collateral]\n${activeAtts.map(a => `• ${renderPreviewHtml(a.fileName)}: ${a.url}`).join('\n')}`
      : '';
    const body = `${renderPreviewHtml(templateData.headline || '')}\n\n${renderPreviewHtml(templateData.body || templateData.content || '')}${attachmentNote}\n\nBest regards,\n${user?.name || 'Growth Specialist'}\n${user?.company_name || ''}`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Direct Single Email Test Dispatcher
  const handleSendSingleTest = async () => {
    // Mailbox Connection Check
    if (!connectedMailbox) {
      await alertDialog({
        title: 'No Sending Mailbox Connected',
        message: 'To deliver real emails straight to prospect inboxes, connect your standard SMTP server credentials in Outbox settings, or click "Open Webmail" to compose directly.',
        variant: 'warning'
      });
      setIsProviderModalOpen(true);
      return;
    }

    // Email Quota Check
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
        templateStyling,
        targetLead: previewLead,
        customRecipientEmail: previewLead.email,
        fromName: connectedMailbox?.fromName || user?.name || 'Workspace Operator',
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

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#FAF8F5] font-sans text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#FAF8F5] relative overflow-hidden">
        <Header title="Outreach Studio & Campaign Center" />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative z-10">
          
          {/* Dispatch Live Notification Banner */}
          {dispatchNotification && (
            <div className="p-4 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
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
          <div className="w-full xl:w-1/2 flex flex-col h-full bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs">
            
            {/* Clean Segmented Channel Header Bar */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#E5E0D5] bg-[#FAF8F5] px-4 py-2.5 gap-3">
              {/* Channel Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E0D5] shadow-2xs">
                <button 
                  onClick={() => setActiveChannel('email')}
                  className={`px-3 py-1.5 text-xs font-delight font-medium flex items-center gap-2 rounded-lg transition-all cursor-pointer ${
                    activeChannel === 'email' 
                      ? 'bg-[#191716] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> 
                  <span>Email Studio</span>
                </button>
                <button 
                  onClick={() => setActiveChannel('whatsapp')}
                  className={`px-3 py-1.5 text-xs font-delight font-medium flex items-center gap-2 rounded-lg transition-all cursor-pointer ${
                    activeChannel === 'whatsapp' 
                      ? 'bg-[#1E6B52] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> 
                  <span>WhatsApp Outreach</span>
                </button>
                <button 
                  onClick={() => setActiveChannel('sms')}
                  className={`px-3 py-1.5 text-xs font-delight font-medium flex items-center gap-2 rounded-lg transition-all cursor-pointer ${
                    activeChannel === 'sms' 
                      ? 'bg-slate-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> 
                  <span>SMS Gateway</span>
                </button>
              </div>
              
              {/* Header Right Actions */}
              {activeChannel === 'whatsapp' ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-delight font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Direct Web Bridge</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsWhatsAppQueueOpen(true)}
                    className="bg-[#1E6B52] hover:bg-[#165440] text-white px-3 py-1.5 rounded-lg text-xs font-delight font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Launch 30-Contact WhatsApp Batch Queue"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Batch Queue (30)</span>
                  </button>
                </div>
              ) : activeChannel === 'email' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsGalleryOpen(true)}
                    className="bg-white hover:bg-slate-50 border border-[#E5E0D5] text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-delight font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Change Email Template Layout"
                  >
                    <Layout className="w-3.5 h-3.5 text-slate-500" />
                    <span className="max-w-[120px] truncate">{activeTemplateConfig.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setIsProviderModalOpen(true)}
                    className={`border px-2.5 py-1.5 rounded-lg text-xs font-delight font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      connectedMailbox 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                    title={connectedMailbox ? `Outbox: ${connectedMailbox.fromEmail || connectedMailbox.user} (SendGrid Active)` : "No SendGrid Outbox Connected - Click to configure"}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${connectedMailbox ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="hidden sm:inline">{connectedMailbox ? 'SendGrid Active' : 'Setup Outbox'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="border border-[#E5E0D5] bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-delight font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="View dispatch history"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user?.emails_sent || 0}/{user?.emails_limit || 50}</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Editor Body */}
            <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-white">
              
              {/* WHATSAPP TAB VIEW */}
              {activeChannel === 'whatsapp' && (
                <div className="space-y-4 font-delight font-medium">
                  
                  {/* SECTION 1: CONVERSATIONAL ANGLE SELECTOR (Compact 1-Row, Zero Truncation) */}
                  <div className="p-3 rounded-xl border border-[#E5E0D5] bg-[#FAF8F5] shadow-2xs space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-delight font-medium text-slate-700 flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#1E6B52]" />
                        <span className="font-semibold text-slate-900">01. Conversational Angle:</span>
                      </label>
                      <select
                        value={selectedWhatsAppId}
                        onChange={(e) => {
                          const tpl = WHATSAPP_TEMPLATES.find(t => t.id === e.target.value);
                          if (tpl) handleSelectWhatsAppTemplate(tpl);
                        }}
                        className="bg-white border border-[#E5E0D5] focus:border-[#1E6B52] rounded-lg px-3 py-1.5 text-xs font-delight font-medium text-slate-900 outline-none cursor-pointer flex-1 sm:max-w-md shadow-2xs"
                      >
                        {WHATSAPP_TEMPLATES.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} — {tpl.hookType} ({tpl.badge})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500 font-normal pl-4 truncate">
                      {WHATSAPP_TEMPLATES.find(t => t.id === selectedWhatsAppId)?.description.replace(/{{location}}/g, previewLead.location)}
                    </p>
                  </div>

                  {/* SECTION 2: MESSAGE TEXT & MERGE TAGS (Prominent, High-Visibility Textarea) */}
                  <div className="rounded-xl border border-[#E5E0D5] overflow-hidden bg-white shadow-2xs flex flex-col">
                    {/* Header Strip with Tags */}
                    <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E5E0D5] flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-delight font-semibold text-slate-900">02. Message Text</span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({whatsAppMessage.length} chars · ~{whatsAppMessage.trim().split(/\s+/).filter(Boolean).length} words)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-400">Insert:</span>
                        {[
                          { tag: '{{business_name}}', label: 'Business Name' },
                          { tag: '{{first_name}}', label: 'First Name' },
                          { tag: '{{location}}', label: 'Location' },
                          { tag: '{{booking_link}}', label: 'Booking Link' }
                        ].map(({ tag, label }) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertTag(tag)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-[#E5E0D5] transition-colors cursor-pointer shadow-2xs"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generous Textarea */}
                    <textarea 
                      rows={8}
                      value={whatsAppMessage}
                      onChange={(e) => setWhatsAppMessage(e.target.value)}
                      placeholder="Type your WhatsApp outreach message..."
                      className="w-full p-4 text-xs sm:text-sm font-sans outline-none leading-relaxed text-slate-800 placeholder:text-slate-400 border-0 resize-y min-h-[170px]"
                    />
                  </div>

                  {/* SECTION 3: DELIVERABLES & MEDIA COLLATERAL (Side-by-Side Cards) */}
                  <div className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FAF8F5] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-900">03. Attached Deliverables (PDF & Picture)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyMediaPreset(WHATSAPP_MEDIA_PRESETS[0])}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E5E0D5] text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          Load Standard Deck
                        </button>
                        {(whatsAppImage.enabled || whatsAppPdf.enabled) && (
                          <button
                            type="button"
                            onClick={handleCopyMediaLinks}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E5E0D5] text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                          >
                            {copiedMediaLinks ? 'Links Copied' : 'Copy File Links'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Visual Graphic Card */}
                      <div className={`p-3.5 rounded-xl border transition-all ${whatsAppImage.enabled ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Image className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="font-semibold text-slate-800">Visual Attachment</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWhatsAppImage(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${whatsAppImage.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                          >
                            {whatsAppImage.enabled ? 'Attached' : '+ Attach'}
                          </button>
                        </div>
                        {whatsAppImage.enabled && (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={whatsAppImage.url}
                                onChange={(e) => setWhatsAppImage({ ...whatsAppImage, url: e.target.value })}
                                placeholder="Image URL..."
                                className="flex-1 bg-white border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                              />
                              <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#E5E0D5] rounded-lg text-xs font-medium text-slate-700 cursor-pointer shrink-0">
                                <Upload className="w-3 h-3 inline mr-1" />
                                Upload
                                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                              </label>
                            </div>
                            <input
                              type="text"
                              value={whatsAppImage.caption || ''}
                              onChange={(e) => setWhatsAppImage({ ...whatsAppImage, caption: e.target.value })}
                              placeholder="Caption / Description..."
                              className="w-full bg-white border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* PDF Document Card */}
                      <div className={`p-3.5 rounded-xl border transition-all ${whatsAppPdf.enabled ? 'bg-white border-rose-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-rose-700" />
                            <span className="font-semibold text-slate-800">PDF Pitch Deck</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWhatsAppPdf(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${whatsAppPdf.enabled ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                          >
                            {whatsAppPdf.enabled ? 'Attached' : '+ Attach'}
                          </button>
                        </div>
                        {whatsAppPdf.enabled && (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={whatsAppPdf.url}
                                onChange={(e) => setWhatsAppPdf({ ...whatsAppPdf, url: e.target.value })}
                                placeholder="PDF Hosted URL..."
                                className="flex-1 bg-white border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                              />
                              <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#E5E0D5] rounded-lg text-xs font-medium text-slate-700 cursor-pointer shrink-0">
                                <Upload className="w-3 h-3 inline mr-1" />
                                Upload
                                <input type="file" accept=".pdf,application/pdf" onChange={handlePdfFileUpload} className="hidden" />
                              </label>
                            </div>
                            <input
                              type="text"
                              value={whatsAppPdf.fileName}
                              onChange={(e) => setWhatsAppPdf({ ...whatsAppPdf, fileName: e.target.value })}
                              placeholder="e.g. {{business_name}}_Growth_Blueprint.pdf"
                              className="w-full bg-white border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: EMAIL CAPTURE BRIDGE */}
                  <div className="p-3.5 rounded-xl border border-[#E5E0D5] bg-white flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block">04. Follow-up Bridge:</span>
                      <p className="text-slate-500 truncate font-normal mt-0.5">
                        "{EMAIL_CAPTURE_BRIDGE_SCRIPT}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleInsertBridgeScript}
                      className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-100 border border-[#E5E0D5] text-slate-800 rounded-lg font-medium shrink-0 cursor-pointer shadow-2xs"
                    >
                      + Append Bridge
                    </button>
                  </div>
                </div>
              )}

              {/* SMS TAB VIEW */}
              {activeChannel === 'sms' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-center gap-2 font-delight">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>DLT registered SMS gateway enabled (160 chars / segment).</span>
                  </div>

                  <div className="border border-slate-200 rounded-md overflow-hidden">
                    <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200">
                      <label className="text-xs font-delight font-semibold text-[#191716]">SMS Dispatch Copy</label>
                    </div>
                    <textarea 
                      rows={6}
                      value={templateData.body}
                      onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                      className="w-full p-3.5 text-xs font-sans outline-none border-0"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL CHANNEL VIEW */}
              {activeChannel === 'email' && (
                <>
                  {/* ======================================================== */}
                  {/* LAYER 1: CONTENT LAYER (Architectural Studio Sheet)      */}
                  {/* ======================================================== */}
                  {editorLayer === 'content' && (
                    <div className="space-y-4">
                      
                      {/* Copywriting Presets Bar */}
                      <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl flex items-center justify-between gap-2 shadow-2xs text-xs font-delight font-medium">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-500 shrink-0 font-semibold">1-Click Presets:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                            {[
                              { label: 'Cold B2B Intro', prompt: 'Introduce our agency services to local business owners with a free consultation.' },
                              { label: '15-Min Discovery', prompt: 'Book a 15-minute introductory growth call with decision makers.' },
                              { label: '20% Partner Offer', prompt: 'Offer an exclusive 20% discount on packages reserved this week.' },
                              { label: 'Free Local Audit', prompt: 'Offer a complimentary local visibility audit and competitor gap analysis.' }
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleAiGenerate(preset.prompt)}
                                disabled={isAiGenerating}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#E5E0D5] text-slate-700 rounded-md shrink-0 transition-colors cursor-pointer shadow-2xs"
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

                      {/* UNIFIED ARCHITECTURAL ENVELOPE SHEET (Subject, Preheader, Headline, Subheadline) */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                        {/* Subject Row */}
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

                      {/* PITCH BODY & MERGE VARIABLES SHEET */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-delight font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            <span>Message Body</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5 items-center">
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
                                  onClick={() => insertTag(tag)}
                                  className={`text-xs font-delight font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs ${colorClass}`}
                                >
                                  + {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <textarea 
                          rows={7}
                          value={templateData.body}
                          onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                          className="w-full p-4 text-xs font-sans text-slate-800 border-0 outline-none focus:ring-0 leading-relaxed bg-white resize-y placeholder:text-slate-400"
                          placeholder="Compose your structured message copy..."
                        />
                      </div>

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
                  {/* LAYER 2: TEMPLATE LAYER (Spacing, Width, Colors, Footer) */}
                  {/* ======================================================== */}
                  {editorLayer === 'template' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div>
                        <h4 className="text-xs font-delight font-semibold text-slate-900 mb-0.5">Layout & Responsive Geometry</h4>
                        <p className="text-xs text-slate-500">Configure global container parameters for all screen viewports.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-delight font-semibold text-slate-700 mb-1">Container Width</label>
                          <select 
                            value={templateStyling.containerWidth}
                            onChange={(e) => setTemplateStyling({ ...templateStyling, containerWidth: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-delight font-normal outline-none"
                          >
                            <option value="540px">Compact (540px)</option>
                            <option value="600px">Standard Industry (600px)</option>
                            <option value="660px">Wide Editorial (660px)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-delight font-semibold text-slate-700 mb-1">Inner Padding</label>
                          <select 
                            value={templateStyling.spacingPadding}
                            onChange={(e) => setTemplateStyling({ ...templateStyling, spacingPadding: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-delight font-normal outline-none"
                          >
                            <option value="16px">Compact Padding (16px)</option>
                            <option value="24px">Balanced Padding (24px)</option>
                            <option value="32px">Spacious Padding (32px)</option>
                          </select>
                        </div>
                      </div>

                      {/* Brand Accent Color */}
                      <div>
                        <label className="block text-xs font-delight font-bold text-slate-700 mb-2">Brand Accent Tone</label>
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
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-delight font-semibold border transition-all cursor-pointer ${
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

                      {/* CAN-SPAM Deliverability Footer Guard */}
                      <div className="p-4 bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-white border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-950 font-delight font-bold text-xs mb-0.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Mandatory Unsubscribe Compliance Footer</span>
                          </div>
                          <p className="text-xs text-emerald-800/80 font-medium">
                            Enforces CAN-SPAM and GDPR legal opt-out links on every outbound email automatically.
                          </p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={templateStyling.showComplianceFooter}
                          onChange={(e) => setTemplateStyling({ ...templateStyling, showComplianceFooter: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-5 py-3 border-t border-[#E5E0D5] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl font-delight font-medium">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {activeChannel === 'whatsapp' ? 'WhatsApp wa.me Bridge Active · Free & Account Safe' : 'SendGrid Web API Transport Ready'}
                </span>
              </div>

              {activeChannel === 'whatsapp' ? (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                  <button 
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="bg-white border border-[#E5E0D5] hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedWhatsApp ? 'Copied' : 'Copy Text'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleOpenWhatsAppWeb(previewLead)}
                    className="bg-white border border-[#E5E0D5] hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open wa.me</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsWhatsAppQueueOpen(true)}
                    className="bg-[#1E6B52] hover:bg-[#165440] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Launch 30-Contact Queue</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                  <button 
                    type="button"
                    onClick={() => handleOpenWebmail(previewLead)}
                    className="bg-white border border-[#E5E0D5] hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Open prefilled email in Gmail"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Webmail</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendSingleTest}
                    disabled={isSendingSingle}
                    className="bg-white border border-[#E5E0D5] hover:bg-slate-50 disabled:opacity-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
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
                    className="bg-[#191716] hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Launch Email Batch</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT: LIVE PREVIEW PANE */}
          <div 
            ref={previewCardRef}
            className="w-full xl:w-1/2 flex flex-col h-full bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs font-delight font-medium"
          >
            {/* Right Pane Header */}
            <div className="shrink-0 px-5 py-2.5 border-b border-[#E5E0D5] bg-white flex items-center justify-between gap-3 relative z-30">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Preview</span>
                </div>
                {activeChannel === 'email' && (
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
                )}
              </div>

              {/* Prospect Dropdown Switcher */}
              <div className="relative" ref={leadDropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleLeadDropdown}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-[#E5E0D5] text-xs text-slate-700 shadow-2xs cursor-pointer"
                >
                  <span className="text-slate-400">Prospect:</span>
                  <span className="font-semibold text-slate-900 max-w-[160px] truncate">{previewLead.businessName}</span>
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
              
              {/* ======================================================== */}
              {/* EMAIL CLIENT CONTAINER                                   */}
              {/* ======================================================== */}
              {activeChannel === 'email' && (
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
                          ST
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          <span className="font-bold text-slate-900">{user?.name || 'Workspace Operator'}</span> &lt;{user?.email || 'outreach@strovr.space'}&gt;
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
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.subject) }}
                    />
                  </div>

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

                  {/* ==================================================== */}
                  {/* COMPLIANCE & DELIVERABILITY FOOTER (MANDATORY)       */}
                  {/* ==================================================== */}
                  {templateStyling.showComplianceFooter && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1 font-delight font-normal">
                      <div className="font-medium text-slate-700 text-xs">
                        Strovr Platform • BKC Financial Hub, Mumbai, India • www.strovr.space
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
              )}

              {/* WHATSAPP PHONE MOCKUP PREVIEW */}
              {activeChannel === 'whatsapp' && (
                <div className="w-[340px] sm:w-[360px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-700/80 flex flex-col font-sans shrink-0 my-auto">
                  {/* Speaker Notch */}
                  <div className="h-3 w-full flex items-center justify-center mb-1">
                    <div className="w-14 h-1 rounded-full bg-slate-700" />
                  </div>

                  <div className="w-full rounded-[26px] overflow-hidden flex flex-col bg-[#ECE5DD] border border-slate-800/20">
                    {/* WhatsApp Green Top Chat Header */}
                    <div className="bg-[#1E6B52] text-white p-3 flex items-center justify-between shrink-0 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {previewLead?.businessName?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate max-w-[180px] text-white">
                            {previewLead?.businessName || 'Target Business'}
                          </div>
                          <div className="text-[11px] text-emerald-100 font-delight font-normal flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                            <span>WhatsApp Business Account</span>
                          </div>
                        </div>
                      </div>
                      <Phone className="w-4 h-4 text-white/90" />
                    </div>

                    {/* Chat Message Window */}
                    <div className="p-3 overflow-y-auto flex flex-col gap-2 min-h-[350px] max-h-[460px] custom-scrollbar bg-[#ECE5DD]">
                      {/* Date Badge */}
                      <div className="self-center my-0.5 bg-white/90 px-3 py-0.5 rounded-full text-[11px] font-delight font-medium text-slate-500 shadow-2xs">
                        Today
                      </div>

                      <div className="self-end max-w-[95%] flex flex-col gap-1.5">
                        {/* Attached PDF Card */}
                        {whatsAppPdf.enabled && (
                          <div className="bg-[#DCF8C6] border border-emerald-200/80 rounded-2xl rounded-tr-xs p-2 shadow-2xs">
                            <div className="bg-white rounded-xl p-2 border border-emerald-100 flex items-center gap-2 shadow-2xs">
                              <div className="w-8 h-9 rounded-lg bg-rose-600 text-white flex flex-col items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                                <span className="text-[7px] font-black uppercase mt-0.5">PDF</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {String(whatsAppPdf?.fileName || 'Document.pdf').replace(/{{business_name}}/g, previewLead?.businessName || 'Prospect')}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                                  <span>{whatsAppPdf.pageCount || '6 pages'}</span>
                                  <span>•</span>
                                  <span>{whatsAppPdf.fileSize || '2.4 MB'}</span>
                                </div>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                <Download className="w-3 h-3" />
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 text-right mt-1 mr-1 flex items-center justify-end gap-1 font-delight">
                              <span>10:41 AM</span>
                              <CheckCircle2 className="w-3 h-3 text-[#1E6B52]" />
                            </div>
                          </div>
                        )}

                        {/* Attached Picture + Text Bubble */}
                        {whatsAppImage.enabled ? (
                          <div className="bg-[#DCF8C6] border border-emerald-200/80 rounded-2xl rounded-tr-xs overflow-hidden shadow-2xs">
                            <div className="relative w-full h-32 bg-slate-900/10 overflow-hidden flex items-center justify-center">
                              {whatsAppImage.url ? (
                                <img
                                  src={whatsAppImage.url}
                                  alt="WhatsApp Attachment"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as any).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                              ) : (
                                <div className="p-4 text-center text-xs text-slate-400">No visual URL</div>
                              )}
                              {whatsAppImage.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 text-xs text-white font-medium truncate">
                                  {whatsAppImage.caption}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <div
                                className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed break-words"
                                dangerouslySetInnerHTML={{ __html: renderPreviewHtml(whatsAppMessage) }}
                              />
                              <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-1 font-delight font-medium">
                                <span>10:42 AM</span>
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#DCF8C6] border border-emerald-200/80 p-3 rounded-2xl rounded-tr-xs shadow-2xs">
                            <div
                              className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed break-words"
                              dangerouslySetInnerHTML={{ __html: renderPreviewHtml(whatsAppMessage) }}
                            />
                            <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-1 font-delight font-medium">
                              <span>10:42 AM</span>
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Chat Bar Mockup */}
                    <div className="bg-[#F0F2F5] border-t border-slate-200/80 px-3 py-2 flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-xs text-slate-400 border border-slate-200">
                        Type a message...
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#1E6B52] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS PHONE MOCKUP PREVIEW */}
              {activeChannel === 'sms' && (
                <div className="w-[320px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col font-sans ring-4 ring-slate-100/80">
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-3.5 flex flex-col items-center justify-center border-b border-slate-200/80 shrink-0 font-delight font-medium">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-1 shadow-2xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">{previewLead.phone}</div>
                    <div className="text-xs text-slate-400 font-delight">Direct Carrier Gateway</div>
                  </div>
                  <div className="flex-1 bg-white p-3.5 overflow-y-auto flex flex-col min-h-[300px]">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 rounded-2xl rounded-br-xs self-end max-w-[88%] text-xs shadow-2xs whitespace-pre-wrap mb-1 font-sans leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml(templateData.body) }}
                    />
                    <div className="text-xs text-slate-400 self-end mr-1 font-delight font-medium">Delivered</div>
                  </div>
                </div>
              )}

            </div>
          </div>

          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TEMPLATE GALLERY MODAL (8 INDUSTRY LAYOUTS)                  */}
      {/* ============================================================ */}
      <TemplateGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* ============================================================ */}
      {/* DIRECT-TO-INBOX EMAIL DISPATCH CONSOLE MODAL                 */}
      {/* ============================================================ */}
      <DispatchTrackerModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        templateId={selectedTemplateId}
        templateName={activeTemplateConfig.name}
        templateData={templateDataA}
        templateDataB={templateDataB}
        isAbTesting={isAbTesting}
        templateStyling={templateStyling}
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

      {/* ============================================================ */}
      {/* STANDARD SMTP OUTBOX CONFIGURATION MODAL                     */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* SENT EMAIL DISPATCH HISTORY MODAL                            */}
      {/* ============================================================ */}
      <SentEmailHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        user={user}
      />

      {/* ============================================================ */}
      {/* WHATSAPP BATCH OUTREACH QUEUE MODAL (30-CONTACT RELAY)       */}
      {/* ============================================================ */}
      <WhatsAppBatchQueueModal
        isOpen={isWhatsAppQueueOpen}
        onClose={() => setIsWhatsAppQueueOpen(false)}
        leads={leadsList}
        whatsAppMessage={whatsAppMessage}
        whatsAppImage={whatsAppImage}
        whatsAppPdf={whatsAppPdf}
        resolvedBookingUrl={resolvedBookingUrl}
        user={user}
        onLeadsUpdated={fetchUserLeads}
      />
    </div>
  );
};

export default OutreachCenter;
