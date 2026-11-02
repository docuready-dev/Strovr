import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, ShieldCheck, Clock, CheckCircle2, AlertCircle, Mail, Phone, CreditCard } from 'lucide-react';
import strovrLogo from '../assets/strovr-logo.png';
import docuReadyBlackLogo from '../assets/DocuReady-black.png';

const RefundPolicy = () => {
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-delight font-bold mb-3">
            <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
            <span>RBI Payment Aggregator Turnaround Time (TAT) &amp; Consumer Protection Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191716] font-delight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs font-delight text-[#78716A] mt-2">
            Last Updated &amp; Effective Date: October 2026 · Strovr (www.strovr.space) · DocuReady Entity
          </p>
        </div>

        {/* Regulatory Summary Box */}
        <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 mb-8 shadow-2xs space-y-3 text-xs leading-relaxed text-[#57524B]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#191716] font-delight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>Summary of Cancellation &amp; Refund Rights</span>
          </h3>
          <p>
            At <strong>Strovr</strong> (a DocuReady Entity), we are committed to complete transparency, fair business practices, and prompt financial reconciliations. This Refund and Cancellation Policy is formulated in strict accordance with the <strong>Reserve Bank of India (RBI) Circular on Harmonisation of Turn Around Time (TAT) and customer compensation for failed transactions</strong>, the <strong>RBI Master Directions on Payment Aggregators (MD-PAG 2020)</strong>, and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="block font-delight font-bold text-emerald-950 text-xs">7-Day Initial Money-Back Window</span>
              <span className="text-[11px] text-emerald-800">100% full refund on first-time subscription plans within 7 days if quota consumption is below 15%.</span>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <span className="block font-delight font-bold text-blue-950 text-xs">5 to 7 Working Days Settlement (RBI TAT)</span>
              <span className="text-[11px] text-blue-800">Approved refunds are credited back to your original payment source via PhonePe within 5-7 bank days.</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-xs text-[#57524B] leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              1. Subscription Cancellation Policy
            </h2>
            <p>
              Users hold complete autonomy over their subscriptions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Self-Service Cancellation:</strong> You can cancel your monthly or annual subscription at any time with a single click by navigating to <code>Settings &gt; Billing &amp; Subscriptions</code> within your logged-in workspace.</li>
              <li><strong>Assisted Cancellation:</strong> Alternatively, you may submit a cancellation request by emailing <a href="mailto:ashleyghose64@gmail.com" className="text-[#C85A32] underline font-semibold">ashleyghose64@gmail.com</a> or calling <a href="tel:+919004804043" className="text-[#C85A32] underline font-semibold">+91 90048 04043</a>.</li>
              <li><strong>Post-Cancellation Service Continuation:</strong> When you cancel a subscription, your workspace remains fully active with full features and remaining lead tokens until the conclusion of your current paid billing period.</li>
              <li><strong>No Automatic Re-billing:</strong> Once canceled, no subsequent recurring charges will be placed on your payment method.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              2. Refund Eligibility &amp; Criteria
            </h2>
            <p>
              Refund requests are evaluated under the following standardized criteria:
            </p>
            
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-white border border-[#E5E0D5] rounded-lg">
                <h4 className="font-bold text-xs text-[#191716] font-delight mb-1">
                  A. 7-Day Initial Purchase Window (Full 100% Refund)
                </h4>
                <p>
                  First-time purchasers of Strovr Basic (₹999/mo or ₹8,999/yr) or Strovr Pro (₹1,999/mo or ₹17,999/yr) can request a full refund within <strong>7 calendar days</strong> from the transaction timestamp, provided that fewer than 15% of the allocated monthly lead credits/tokens have been consumed.
                </p>
              </div>

              <div className="p-3.5 bg-white border border-[#E5E0D5] rounded-lg">
                <h4 className="font-bold text-xs text-[#191716] font-delight mb-1">
                  B. Technical Failures &amp; Double Debits (Immediate 100% Reversal)
                </h4>
                <p>
                  If an account was debited multiple times due to a network timeout, gateway handoff error, or duplicate charge during PhonePe / UPI processing, the extra debit will be immediately reversed and refunded in full with zero deduction.
                </p>
              </div>

              <div className="p-3.5 bg-white border border-[#E5E0D5] rounded-lg">
                <h4 className="font-bold text-xs text-[#191716] font-delight mb-1">
                  C. Extended Unscheduled Downtime
                </h4>
                <p>
                  In the rare event of prolonged unscheduled platform unavailability exceeding 72 consecutive hours directly attributed to Strovr infrastructure, users may request a pro-rata refund for the affected billing period.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              3. Non-Refundable Scenarios
            </h2>
            <p>
              Refunds will <em>not</em> be granted in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Actively Consumed Lead Tokens:</strong> Token top-up packs that have already been expended for prospect discovery, enrichment, and verification.</li>
              <li><strong>Expired Refund Window:</strong> Requests submitted after the 7-day initial window for active monthly or annual cycles where platform features were actively utilized.</li>
              <li><strong>Terms of Service Violations:</strong> Accounts terminated due to transmission of unlawful spam, phishing, abusive cold campaigns, or violations of national anti-spam statutes.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              4. Refund Processing Mode &amp; RBI Settlement Timelines
            </h2>
            <p>
              In conformity with Reserve Bank of India (RBI) Payment Aggregator standards and Anti-Money Laundering (AML) regulations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Original Payment Method Only:</strong> All refunds are issued exclusively back to the <em>same bank account, debit/credit card, or UPI VPA</em> from which the original funds were received via PhonePe. We do not issue cash refunds, bearer cheques, or third-party transfers.</li>
              <li><strong>Initiation SLA:</strong> Strovr approves and initiates the refund transaction via our payment gateway within <strong>24 to 48 hours</strong> of receiving a valid refund request.</li>
              <li><strong>Bank Settlement Timeline (RBI TAT):</strong> Once initiated, funds typically reflect in your bank account or card balance within <strong>5 to 7 working days</strong>, subject to the clearing procedures of the customer's issuing bank.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              5. Step-by-Step: How to Request a Refund
            </h2>
            <p>
              To initiate a refund request, follow these simple steps:
            </p>
            <ol className="list-decimal pl-5 space-y-2 font-delight">
              <li>
                <strong>Send an Email:</strong> Dispatch an email to <a href="mailto:ashleyghose64@gmail.com" className="text-[#C85A32] underline font-bold">ashleyghose64@gmail.com</a> with the subject line <code>Refund Request · [Your Workspace Email / Transaction ID]</code>.
              </li>
              <li>
                <strong>Include Payment Proof:</strong> Attach your PhonePe transaction ID, invoice number, and registered email address.
              </li>
              <li>
                <strong>Confirmation &amp; Audit:</strong> Our finance desk will acknowledge receipt within 24 hours, audit quota consumption, and initiate the reversal through the payment gateway.
              </li>
            </ol>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#191716] font-delight">
              6. Escalations &amp; Grievance Redressal
            </h2>
            <p>
              If your refund has not reflected within 7 working days of initiation, or for any billing dispute escalation, contact our Grievance Officer directly:
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
              <div className="text-[11px] text-[#78716A]">Address: Bandra West / BKC Financial Hub, Mumbai, Maharashtra 400050, India</div>
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
            <Link to="/privacy" className="hover:text-[#C85A32]">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-[#C85A32] font-semibold text-[#191716]">Refund &amp; Cancellation</Link>
            <Link to="/contact" className="hover:text-[#C85A32]">Contact Details</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;
