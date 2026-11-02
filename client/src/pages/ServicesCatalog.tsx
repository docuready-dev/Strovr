import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';
import strovrLogo from '../assets/strovr-logo.png';
import docuReadyBlackLogo from '../assets/DocuReady-black.png';
import { ServicesCatalogSection } from '../components/ServicesCatalogSection';

const ServicesCatalog = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191716] font-delight flex flex-col selection:bg-[#C85A32] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#E5E0D5] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer" title="Return to Home">
              <img src={strovrLogo} alt="Strovr Logo" className="h-8 md:h-9 w-auto object-contain" />
            </Link>
            <span className="text-[#D6CFC2]">|</span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#FAF8F5] border border-[#E5E0D5]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#57524B]">A</span>
              <img src={docuReadyBlackLogo} alt="DocuReady" className="h-3 w-auto object-contain" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#57524B]">Entity</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-xs font-semibold text-[#57524B] hover:text-[#191716] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link 
              to="/login"
              className="px-3.5 py-1.5 bg-[#191716] hover:bg-[#C85A32] text-white rounded-[5px] text-xs font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Services Catalog Section */}
      <main className="flex-1">
        <ServicesCatalogSection id="catalog" />

        {/* Technical FAQ & Procurement Process */}
        <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-[#E5E0D5]">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[5px] border border-[#E5E0D5] bg-[#F5F2EB] text-[11px] font-mono uppercase font-bold text-[#57524B] mb-2">
              <Terminal className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>PROCUREMENT &amp; EXECUTION PROTOCOL</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#191716] tracking-tight">
              How Custom Builds &amp; Industrial Systems Are Dispatched
            </h3>
            <p className="text-xs text-[#57524B] mt-1 leading-relaxed">
              Standard operating procedures for milestone execution, GST invoicing, and source code ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 space-y-2.5 shadow-2xs">
              <span className="font-mono text-xs font-bold text-[#C85A32] uppercase">01 // Scope Verification</span>
              <h4 className="text-sm font-bold text-[#191716]">Direct Technical Audit</h4>
              <p className="text-xs text-[#57524B] leading-relaxed">
                Every project begins with a 30-minute specification audit by Ashley Ghose to verify infrastructure requirements, asset readiness, and milestone timelines.
              </p>
            </div>

            <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 space-y-2.5 shadow-2xs">
              <span className="font-mono text-xs font-bold text-[#C85A32] uppercase">02 // Milestone Settlement</span>
              <h4 className="text-sm font-bold text-[#191716]">Escrow &amp; GST Invoicing</h4>
              <p className="text-xs text-[#57524B] leading-relaxed">
                Payments are structured across milestone stages (40% initial, 40% functional staging, 20% production handoff) with formal tax invoices adhering to Indian commercial laws.
              </p>
            </div>

            <div className="bg-white border border-[#E5E0D5] rounded-xl p-5 space-y-2.5 shadow-2xs">
              <span className="font-mono text-xs font-bold text-[#C85A32] uppercase">03 // Asset Ownership</span>
              <h4 className="text-sm font-bold text-[#191716]">100% IP &amp; Code Handoff</h4>
              <p className="text-xs text-[#57524B] leading-relaxed">
                You retain full copyright and ownership of all vector assets, compiled APKs, web repositories, and database schemas with zero vendor lock-in.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 md:px-12 border-t border-[#E5E0D5] bg-[#F5F2EB]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716A]">
          <div className="flex items-center gap-2">
            <span>Strovr is a DocuReady Entity. Founded &amp; Managed by Ashley Ghose.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-[#C85A32]">Terms</Link>
            <Link to="/privacy" className="hover:text-[#C85A32]">Privacy</Link>
            <Link to="/contact" className="hover:text-[#C85A32]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServicesCatalog;
