import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, CheckCircle, Mail, Phone } from 'lucide-react';
import strovrLogo from '../assets/strovr-logo.png';
import docuReadyBlackLogo from '../assets/DocuReady-black.png';

const PrivacyPolicy = () => {
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
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 md:py-14 w-full">
        {/* Document Header */}
        <div className="border-b border-[#E5E0D5] pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-delight font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Digital Personal Data Protection Act (DPDP) 2023 · IT Act 2000 Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191716] font-delight">
            Privacy Policy
          </h1>
          <p className="text-xs font-delight text-[#78716A] mt-2">
            Last Updated &amp; Effective Date: October 2026 · Strovr (www.strovr.space) · DocuReady Entity
          </p>
        </div>

        {/* Regulatory Summary Box */}
        <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 mb-8 shadow-2xs space-y-2 text-xs leading-relaxed text-[#57524B]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#191716] font-delight flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>Commitment to User Privacy &amp; Data Security</span>
          </h3>
          <p>
            Strovr (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the privacy, confidentiality, and security of user information. This Privacy Policy outlines the specific mechanisms by which personal and business data is collected, processed, stored, and protected in full accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Information Technology Act, 2000 (Section 43A)</strong>, and the <strong>IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-xs text-[#57524B] leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              1. Information We Collect
            </h2>
            <p>
              We collect information strictly necessary to provide B2B discovery and campaign automation services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>User Account Information:</strong> Full name, professional email address, contact telephone number, organization name, and industry focus provided during registration.</li>
              <li><strong>Billing &amp; Payment Data:</strong> Transaction identifiers, GST numbers (if submitted), and subscription records. In accordance with RBI guidelines, <em>raw credit/debit card numbers, CVVs, and banking passwords are never stored on Strovr servers</em>; all payment data is processed exclusively by RBI-certified Payment Aggregators (e.g. PhonePe).</li>
              <li><strong>B2B Directory &amp; Public Records:</strong> Publicly available business data (business names, official contact numbers, corporate locations, domains) sourced from public directories for legitimate B2B commercial outreach.</li>
              <li><strong>System Logs &amp; Telemetry:</strong> IP addresses, browser types, device fingerprints, and platform interaction metrics gathered to safeguard against account abuse and brute-force attacks.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              2. Lawful Grounds &amp; Purposes of Processing
            </h2>
            <p>
              We process personal data only under recognized lawful bases under Indian law:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Service Delivery &amp; Contractual Necessity:</strong> To provision your user workspace, verify accounts, manage lead pipelines, and execute outreach dispatches.</li>
              <li><strong>Payment Processing:</strong> To communicate with authorized payment gateways to settle subscription invoices and prevent transactional fraud.</li>
              <li><strong>Legitimate Commercial B2B Interest:</strong> To enable professional business-to-business communications, commercial discovery, and market engagement.</li>
              <li><strong>Statutory Compliance:</strong> To retain tax, invoice, and transactional logs mandated by Indian financial and cybersecurity authorities.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              3. Strict Non-Sale Clause &amp; Data Sharing
            </h2>
            <p>
              <strong>We do not sell, rent, monetize, or trade your personal or customer data to data brokers or third parties.</strong> Data is shared only under strict operational conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Payment Aggregators (PhonePe):</strong> Encrypted transmission of transaction parameters for billing clearance in compliance with RBI guidelines.</li>
              <li><strong>Cloud Infrastructure Providers:</strong> Encrypted cloud hosting and databases (Google Cloud Platform / Firebase) operating under ISO 27001 and SOC 2 certifications.</li>
              <li><strong>Law Enforcement &amp; Legal Mandates:</strong> Where compelled by valid statutory subpoenas or court orders under Indian jurisdiction.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              4. Data Security &amp; Encryption Standards
            </h2>
            <p>
              Strovr implements robust technical and organizational security controls in compliance with Rule 8 of the IT Rules, 2011:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Transit Encryption:</strong> All platform data in transit is protected via Transport Layer Security (TLS 1.3) with SHA-256 cipher suites.</li>
              <li><strong>Rest Encryption:</strong> Database stores and credential vaults employ Advanced Encryption Standard (AES-256).</li>
              <li><strong>Access Control:</strong> Strict role-based access control (RBAC) and least-privilege administrative access protocols.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              5. User Rights Under the DPDP Act, 2023
            </h2>
            <p>
              As a Data Principal under the Digital Personal Data Protection Act, 2023, you hold the following statutory rights:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Right to Access:</strong> You may request a summary of your personal data processed by Strovr.</li>
              <li><strong>Right to Correction &amp; Erasure:</strong> You can update or request the deletion of your account and personal records at any time via your Account Settings or by emailing our Grievance Officer.</li>
              <li><strong>Right of Grievance Redressal:</strong> You have the right to register complaints regarding data privacy directly with our designated Grievance Officer.</li>
              <li><strong>Right to Nominate:</strong> You may designate an authorized representative to exercise your data rights in accordance with DPDP rules.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              6. Data Retention Period
            </h2>
            <p>
              We retain user information only for as long as your workspace account remains active. Upon voluntary account deletion, your CRM leads, outreach logs, and profile records are expunged from production databases within thirty (30) days, except for statutory tax/financial transaction invoices which must be archived under applicable Indian accounting laws.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              7. Statutory Grievance Redressal Officer
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Redressal Officer are published below:
            </p>
            <div className="p-4 bg-white border border-[#E5E0D5] rounded-lg space-y-1.5 font-delight">
              <div className="font-bold text-[#191716]">Ashley Ghose (Grievance Officer &amp; Founder)</div>
              <div>Entity: Strovr · A DocuReady Entity</div>
              <div className="flex items-center gap-2 text-[#57524B]">
                <Mail className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Email: <a href="mailto:ashleyghose64@gmail.com" className="text-[#C85A32] underline font-semibold">ashleyghose64@gmail.com</a></span>
              </div>
              <div className="flex items-center gap-2 text-[#57524B]">
                <Phone className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Helpline: <a href="tel:+919004804043" className="text-[#C85A32] underline font-semibold">+91 90048 04043</a></span>
              </div>
              <div className="text-[11px] text-[#78716A]">Location: Mumbai, Maharashtra 400050, India</div>
              <div className="text-[11px] text-emerald-800 font-medium pt-1">
                Grievance Response SLA: Formal acknowledgment within 48 hours; resolution within 30 days.
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D5] bg-[#F5F2EB] py-8 px-6 text-xs font-delight text-[#78716A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Strovr (DocuReady Entity). All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-[#57524B]">
            <Link to="/terms" className="hover:text-[#C85A32]">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[#C85A32] font-semibold text-[#191716]">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-[#C85A32]">Refund &amp; Cancellation</Link>
            <Link to="/contact" className="hover:text-[#C85A32]">Contact Details</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
