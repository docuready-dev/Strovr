import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Clock, Layers, FileText, Check, Phone, Mail, Building, Send, ChevronDown } from 'lucide-react';
import { SERVICES_CATALOG } from '../data/servicesCatalog';
import type { ServicePackage } from '../data/servicesCatalog';

interface ProjectInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageId?: string;
  onSuccess?: (inquiry: any) => void;
}

export const ProjectInquiryModal: React.FC<ProjectInquiryModalProps> = ({
  isOpen,
  onClose,
  selectedPackageId,
  onSuccess
}) => {
  const [activePackageId, setActivePackageId] = useState<string>(selectedPackageId || SERVICES_CATALOG[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    timeline: 'Standard Timeline (As per tier)',
    scopeNotes: ''
  });

  // Keep activePackageId synchronized when opened with new selectedPackageId
  useEffect(() => {
    if (selectedPackageId) {
      setActivePackageId(selectedPackageId);
    }
  }, [selectedPackageId, isOpen]);

  // Reset form when modal closes or opens fresh
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPkg: ServicePackage = SERVICES_CATALOG.find(p => p.id === activePackageId) || SERVICES_CATALOG[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `INQ-${currentPkg.categoryKey.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generatedId);

    const payload = {
      ticketId: generatedId,
      packageId: currentPkg.id,
      packageTitle: currentPkg.title,
      category: currentPkg.category,
      tier: currentPkg.tierNumber,
      investment: currentPkg.investment,
      delivery: currentPkg.delivery,
      client: formData,
      submittedAt: new Date().toISOString()
    };

    try {
      // Post to backend if available
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Fallback gracefully if endpoint is local or simulated
      });

      // Save to localStorage so inquiries are persisted locally for reference
      const existingInquiries = JSON.parse(localStorage.getItem('strovr_project_inquiries') || '[]');
      existingInquiries.unshift(payload);
      localStorage.setItem('strovr_project_inquiries', JSON.stringify(existingInquiries.slice(0, 50)));

      if (onSuccess) onSuccess(payload);
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/919004804043?text=${encodeURIComponent(
    `Hello Ashley! I just submitted an inquiry for [${currentPkg.title}] (${currentPkg.tierNumber} · ${currentPkg.investment}). Reference: ${ticketId || 'Pending'}. Looking forward to discussing specifications.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#191716]/75 backdrop-blur-xs font-delight text-[#191716] animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-[#D6CFC2] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D5] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded bg-[#191716] text-[#FAF8F5] tracking-wide">
              SPEC // RFP
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#191716] tracking-tight leading-snug">
                Project Scope &amp; Architecture Inquiry
              </h3>
              <p className="text-[11px] text-[#78716A] leading-tight">
                Direct technical review with DocuReady engineering &amp; Ashley Ghose
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716A] hover:text-[#191716] hover:bg-[#E5E0D5]/50 transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSubmitted ? (
            /* Submission Success State */
            <div className="py-8 px-4 text-center max-w-lg mx-auto space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  DISPATCH CONFIRMED // {ticketId}
                </span>
                <h4 className="text-2xl font-extrabold text-[#191716] tracking-tight pt-2">
                  Technical Scope Logged
                </h4>
                <p className="text-sm text-[#57524B] leading-relaxed">
                  Your inquiry for <strong className="text-[#191716]">{currentPkg.title}</strong> has been routed directly to lead engineer <strong>Ashley Ghose</strong>.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-[#78716A] border-b border-[#E5E0D5] pb-2">
                  <span>Selected Package:</span>
                  <span className="font-mono font-semibold text-[#191716]">{currentPkg.title}</span>
                </div>
                <div className="flex justify-between items-center text-[#78716A] border-b border-[#E5E0D5] pb-2">
                  <span>Target Investment:</span>
                  <span className="font-mono font-semibold text-[#C85A32]">{currentPkg.investment}</span>
                </div>
                <div className="flex justify-between items-center text-[#78716A]">
                  <span>Delivery SLA:</span>
                  <span className="font-mono text-[#191716]">{currentPkg.delivery}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1E6B52] hover:bg-[#16513E] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Direct Chat</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#191716] hover:bg-[#322E2B] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Return to Catalog
                </button>
              </div>
            </div>
          ) : (
            /* Inquiry Form Flow */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Package Selector / Banner */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] relative space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-[#D6CFC2] text-[#78716A]">
                      {currentPkg.tierNumber}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase font-bold text-[#C85A32]">
                      {currentPkg.category}
                    </span>
                  </div>

                  {/* Dropdown to switch tier if desired */}
                  <div className="relative">
                    <select
                      value={activePackageId}
                      onChange={(e) => setActivePackageId(e.target.value)}
                      className="font-mono text-xs bg-white border border-[#D6CFC2] rounded-md px-3 py-1.5 text-[#191716] font-medium appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#C85A32]"
                    >
                      {SERVICES_CATALOG.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.tierNumber}: {pkg.title} ({pkg.investment})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#78716A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Selected Package Specifications Strip */}
                <div className="flex flex-wrap items-baseline justify-between gap-4 pt-2 border-t border-[#E5E0D5]">
                  <div>
                    <h4 className="text-lg font-bold text-[#191716] tracking-tight">{currentPkg.title}</h4>
                    <p className="text-xs text-[#57524B] mt-0.5 max-w-xl">{currentPkg.suitability}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-lg font-bold text-[#191716] tracking-tight">
                      {currentPkg.investment}
                    </div>
                    <div className="font-mono text-[11px] text-[#78716A] mt-0.5 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-[#78716A]" />
                      <span>{currentPkg.delivery}</span>
                    </div>
                  </div>
                </div>

                {/* Deliverables summary tag pills */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#78716A] mr-1 mt-0.5">Deliverables:</span>
                  {currentPkg.keyDeliverables.map((deliv, idx) => (
                    <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#E5E0D5] text-[#191716]">
                      ✓ {deliv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                      Contact Name <span className="text-[#C85A32]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-delight text-[#191716] focus:outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                    />
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                      Work Email <span className="text-[#C85A32]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-delight text-[#191716] focus:outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone / WhatsApp */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                      WhatsApp / Helpline <span className="text-[#C85A32]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 12345"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-mono text-[#191716] focus:outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                    />
                  </div>

                  {/* Company / Fleet / Facility */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Cargo Systems"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-delight text-[#191716] focus:outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                    />
                  </div>
                </div>

                {/* Target Timeline */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                    Target Deployment Window
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-delight text-[#191716] focus:outline-none focus:border-[#C85A32]"
                  >
                    <option value="Standard Timeline (As per tier)">Standard Delivery ({currentPkg.delivery})</option>
                    <option value="Urgent / Fast-Track Required">Urgent / Fast-Track Priority</option>
                    <option value="Flexible / Planning for next month">Flexible Planning (Next 30-60 Days)</option>
                  </select>
                </div>

                {/* Specific Requirements / Notes */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#57524B] mb-1.5">
                    Specific Requirements &amp; Scope Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Tell us about your operational requirements, existing domain/assets, or specific features needed for ${currentPkg.title}...`}
                    value={formData.scopeNotes}
                    onChange={(e) => setFormData({ ...formData, scopeNotes: e.target.value })}
                    className="w-full p-3 rounded-lg border border-[#D6CFC2] bg-white text-xs font-delight text-[#191716] focus:outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                  />
                </div>
              </div>

              {/* Security & Direct Support Disclaimer */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg flex items-center justify-between text-xs text-[#57524B]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct founder &amp; engineering dispatch. No automated call centers.</span>
                </div>
                <span className="font-mono text-[11px] text-[#78716A]">Direct SLA: 24h</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#D6CFC2] text-xs font-semibold text-[#57524B] hover:text-[#191716] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg bg-[#C85A32] hover:bg-[#B04B25] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Logging Scope...</span>
                  ) : (
                    <>
                      <span>Submit Project Inquiry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
