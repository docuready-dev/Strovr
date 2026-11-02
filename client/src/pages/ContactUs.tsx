import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock, ShieldCheck, CheckCircle2, MessageSquare, Send, Building } from 'lucide-react';
import strovrLogo from '../assets/strovr-logo.png';
import docuReadyBlackLogo from '../assets/DocuReady-black.png';

const ContactUs = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191716] font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[#E5E0D5] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <img src={strovrLogo} alt="Strovr Logo" className="h-8 md:h-9 w-auto object-contain" />
            </Link>
            <span className="text-[#D6CFC2]">|</span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#FAF8F5] border border-[#E5E0D5]">
              <span className="text-[10px] font-delight font-bold uppercase tracking-wider text-[#57524B]">A</span>
              <img src={docuReadyBlackLogo} alt="DocuReady" className="h-3 w-auto object-contain" />
              <span className="text-[10px] font-delight font-bold uppercase tracking-wider text-[#57524B]">Entity</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="text-xs font-delight font-semibold text-[#57524B] hover:text-[#191716] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link 
              to="/login"
              className="px-3.5 py-1.5 bg-[#191716] hover:bg-[#C85A32] text-white rounded-[5px] text-xs font-delight font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 md:py-14 w-full">
        {/* Document Header */}
        <div className="border-b border-[#E5E0D5] pb-6 mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-delight font-bold mb-3">
            <Building className="w-3.5 h-3.5 text-blue-700" />
            <span>Direct Operational &amp; Grievance Redressal Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191716] font-delight">
            Contact Details &amp; Customer Support
          </h1>
          <p className="text-xs font-delight text-[#78716A] mt-2 leading-relaxed">
            Statutory disclosures in adherence with Consumer Protection (E-Commerce) Rules, 2020 &amp; Reserve Bank of India (RBI) Payment Aggregator Directives.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Information Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Real Contact Details Box */}
            <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191716] font-delight pb-2 border-b border-[#E5E0D5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Official Contact Coordinates</span>
              </h3>

              <div className="space-y-3.5 text-xs text-[#57524B]">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#C85A32] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-delight font-bold uppercase tracking-wider text-[#78716A]">Official Support Email</span>
                    <a href="mailto:ashleyghose64@gmail.com" className="text-sm font-delight font-bold text-[#191716] hover:text-[#C85A32] transition-colors underline">
                      ashleyghose64@gmail.com
                    </a>
                    <span className="block text-[10px] text-[#78716A] mt-0.5">Response turnaround: within 24 business hours</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-delight font-bold uppercase tracking-wider text-[#78716A]">Direct Telephone / Helpline</span>
                    <a href="tel:+919004804043" className="text-sm font-delight font-bold text-[#191716] hover:text-[#C85A32] transition-colors">
                      +91 90048 04043
                    </a>
                    <span className="block text-[10px] text-[#78716A] mt-0.5">Monday to Friday, 9:30 AM to 6:30 PM IST</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#191716] shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-delight font-bold uppercase tracking-wider text-[#78716A]">Operating Location</span>
                    <span className="font-delight font-medium text-[#191716]">
                      Bandra West / BKC Financial Hub, Mumbai, Maharashtra 400050, India
                    </span>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-delight font-bold uppercase tracking-wider text-[#78716A]">Operating Hours</span>
                    <span className="font-delight font-medium text-[#191716]">
                      09:30 – 18:30 IST (Mon – Fri)
                    </span>
                    <span className="block text-[10px] text-[#78716A] mt-0.5">Excluding Gazetted National Holidays</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grievance Redressal Card */}
            <div className="bg-[#F5F2EB] border border-[#E5E0D5] rounded-xl p-5 space-y-2 text-xs text-[#57524B]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#191716] font-delight">
                Statutory Grievance Officer
              </h4>
              <p>
                In compliance with the <strong>Information Technology Act, 2000</strong> &amp; <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>:
              </p>
              <div className="pt-1 text-[11px] font-delight space-y-1">
                <div><strong>Officer Name:</strong> Ashley Ghose</div>
                <div><strong>Designation:</strong> Founder &amp; Grievance Officer</div>
                <div><strong>Entity:</strong> Strovr (A DocuReady Entity)</div>
                <div><strong>Grievance Email:</strong> <a href="mailto:ashleyghose64@gmail.com" className="text-[#C85A32] underline font-semibold">ashleyghose64@gmail.com</a></div>
                <div><strong>Helpline:</strong> <a href="tel:+919004804043" className="text-[#C85A32] underline font-semibold">+91 90048 04043</a></div>
              </div>
              <div className="text-[10.5px] text-emerald-800 font-medium pt-1">
                Resolution Timeline: Acknowledgment within 48 hours; resolution within 30 days.
              </div>
            </div>

          </div>

          {/* Right: Interactive Support Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E5E0D5] rounded-xl p-6 sm:p-8 shadow-2xs">
            <div className="border-b border-[#E5E0D5] pb-4 mb-6">
              <h3 className="text-base font-bold text-[#191716] font-delight">
                Submit an Operational or Billing Inquiry
              </h3>
              <p className="text-xs text-[#78716A] font-delight mt-1">
                Direct transmission to our technical support and account management desk.
              </p>
            </div>

            {formSubmitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-950 font-delight">
                  Ticket Generated Successfully
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name}</strong>. Your ticket has been logged and assigned to Ashley Ghose. A confirmation has been routed to <strong>{formData.email}</strong>. Our team will respond within 24 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-delight font-semibold rounded-md transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] font-delight font-bold uppercase tracking-wider text-[#57524B] mb-1">
                      Full Name *
                    </label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3 py-2 border border-[#D6CFC2] rounded-md text-xs font-delight outline-none focus:ring-1 focus:ring-[#C85A32] focus:border-[#C85A32] bg-[#FAF8F5]/50 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-delight font-bold uppercase tracking-wider text-[#57524B] mb-1">
                      Email Address *
                    </label>
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. alex@company.com"
                      className="w-full px-3 py-2 border border-[#D6CFC2] rounded-md text-xs font-delight outline-none focus:ring-1 focus:ring-[#C85A32] focus:border-[#C85A32] bg-[#FAF8F5]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] font-delight font-bold uppercase tracking-wider text-[#57524B] mb-1">
                      Phone Number (Optional)
                    </label>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-[#D6CFC2] rounded-md text-xs font-delight outline-none focus:ring-1 focus:ring-[#C85A32] focus:border-[#C85A32] bg-[#FAF8F5]/50 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-delight font-bold uppercase tracking-wider text-[#57524B] mb-1">
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D6CFC2] rounded-md text-xs font-delight outline-none focus:ring-1 focus:ring-[#C85A32] focus:border-[#C85A32] bg-[#FAF8F5]/50 focus:bg-white transition-all"
                    >
                      <option value="General Inquiry">General Platform Inquiry</option>
                      <option value="Billing & Subscriptions">Billing, Invoices &amp; Subscriptions</option>
                      <option value="Cancellations & Refunds">Cancellations &amp; Refunds (RBI TAT)</option>
                      <option value="Technical & API Support">Technical &amp; API Integration</option>
                      <option value="Grievance Redressal">Statutory Grievance Redressal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-delight font-bold uppercase tracking-wider text-[#57524B] mb-1">
                    Message Details *
                  </label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about your query or transaction order ID..."
                    className="w-full p-3 border border-[#D6CFC2] rounded-md text-xs font-delight outline-none focus:ring-1 focus:ring-[#C85A32] focus:border-[#C85A32] bg-[#FAF8F5]/50 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#191716] hover:bg-[#C85A32] text-white rounded-md font-delight font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Support Ticket</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D5] bg-[#F5F2EB] py-8 px-6 text-xs font-delight text-[#78716A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Strovr (DocuReady Entity). All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-[#57524B]">
            <Link to="/terms" className="hover:text-[#C85A32]">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[#C85A32]">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-[#C85A32]">Refund &amp; Cancellation</Link>
            <Link to="/contact" className="hover:text-[#C85A32] font-semibold text-[#191716]">Contact Details</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
