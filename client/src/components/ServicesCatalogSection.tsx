import React, { useState } from 'react';
import { 
  SERVICES_CATALOG, 
  SERVICE_CATEGORIES 
} from '../data/servicesCatalog';
import type { ServicePackage } from '../data/servicesCatalog';
import { 
  Globe, 
  Cpu, 
  Layers, 
  Clock, 
  Check, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Box, 
  Smartphone, 
  Code2, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { ProjectInquiryModal } from './ProjectInquiryModal';

interface ServicesCatalogSectionProps {
  id?: string;
  showCategoryFilters?: boolean;
  className?: string;
}

export const ServicesCatalogSection: React.FC<ServicesCatalogSectionProps> = ({
  id = 'services',
  showCategoryFilters = true,
  className = ''
}) => {
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>('all');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(SERVICES_CATALOG[0].id);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const handleInquire = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    setIsInquiryModalOpen(true);
  };

  const filteredPackages = activeCategoryKey === 'all'
    ? SERVICES_CATALOG
    : SERVICES_CATALOG.filter(pkg => pkg.categoryKey === activeCategoryKey);

  // Group by categories for structured rendering
  const categoriesToRender = activeCategoryKey === 'all'
    ? [
        {
          key: 'web',
          title: 'Web Infrastructure & Engineering',
          tagline: 'High-performance web builds, tender-ready portals, and automated B2B architectures',
          icon: Globe,
          packages: SERVICES_CATALOG.filter(p => p.categoryKey === 'web')
        },
        {
          key: 'brand',
          title: 'Brand Identity & Industrial Systems',
          tagline: 'Precision vector marks, commercial stationery, and heavy industrial livery blueprints',
          icon: Box,
          packages: SERVICES_CATALOG.filter(p => p.categoryKey === 'brand')
        },
        {
          key: 'software',
          title: 'Software & Application Builds',
          tagline: 'Field Android runtimes, Progressive Edge PWAs, and full-stack operational dashboards',
          icon: Cpu,
          packages: SERVICES_CATALOG.filter(p => p.categoryKey === 'software')
        }
      ]
    : [
        {
          key: activeCategoryKey,
          title: SERVICE_CATEGORIES.find(c => c.key === activeCategoryKey)?.label || '',
          tagline: SERVICE_CATEGORIES.find(c => c.key === activeCategoryKey)?.tagline || '',
          icon: activeCategoryKey === 'web' ? Globe : activeCategoryKey === 'brand' ? Box : Cpu,
          packages: filteredPackages
        }
      ];

  return (
    <section id={id} className={`py-20 px-6 md:px-12 max-w-7xl mx-auto w-full relative z-10 scroll-mt-20 border-t border-[#E5E0D5] font-delight ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[5px] border border-[#E5E0D5] bg-[#F5F2EB] text-[11px] font-mono uppercase font-bold text-[#57524B] mb-3.5">
            <Terminal className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>ARCHITECTURE CATALOG // REVISED SERVICE TIERS</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#191716] mb-3">
            Industrial Web, Brand Identity &amp; Software Builds.
          </h2>
          <p className="text-sm md:text-[15px] text-[#57524B] leading-relaxed">
            Engineered specifically for manufacturers, supply chain operators, and commercial fleets requiring verified digital footprints, real-world asset branding, and operational software runtimes.
          </p>
        </div>

        {/* Support SLA Pill */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-md px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="text-xs">
            <div className="font-mono font-bold text-[#191716]">SLA: 24h Review Window</div>
            <div className="text-[11px] text-[#78716A]">Direct engineering lead oversight</div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {showCategoryFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-10 select-none pb-2 border-b border-[#E5E0D5]/70">
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = activeCategoryKey === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategoryKey(cat.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#191716] text-[#FAF8F5] shadow-xs'
                    : 'bg-white/70 hover:bg-white text-[#57524B] hover:text-[#191716] border border-[#E5E0D5]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#78716A] border border-[#E5E0D5]'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Structured Category Sections */}
      <div className="space-y-16">
        {categoriesToRender.map((catGroup) => {
          const GroupIcon = catGroup.icon;
          return (
            <div key={catGroup.key} className="space-y-6">
              {/* Category Sub-header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E0D5] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-center text-[#191716]">
                    <GroupIcon className="w-4 h-4 text-[#C85A32]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#191716] tracking-tight">{catGroup.title}</h3>
                    <p className="text-xs text-[#78716A] mt-0.5">{catGroup.tagline}</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-[#78716A] uppercase">
                  {catGroup.packages.length} Packages Available
                </span>
              </div>

              {/* Package Grid (Cards) */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${catGroup.packages.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                {catGroup.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="relative flex flex-col justify-between rounded-xl border border-[#D6CFC2] bg-white/75 backdrop-blur-md p-6 shadow-xs hover:border-[#191716] hover:shadow-md transition-all duration-200 group"
                  >
                    <div>
                      {/* Top Meta: Tier & Category Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-[10.5px] uppercase font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5] text-[#78716A]">
                          {pkg.tierNumber}
                        </span>
                        {pkg.badge && (
                          <span className="font-mono text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/30">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      {/* Package Title */}
                      <h4 className="text-lg font-extrabold text-[#191716] tracking-tight mb-2 group-hover:text-[#C85A32] transition-colors">
                        {pkg.title}
                      </h4>

                      {/* Investment / Price (Monospaced) */}
                      <div className="mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#78716A] block">Target Investment</span>
                        <div className="font-mono text-2xl font-bold text-[#191716] tracking-tight">
                          {pkg.investment}
                        </div>
                      </div>

                      {/* Delivery Timeline (Monospaced Pill) */}
                      <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-[#E5E0D5]">
                        <Clock className="w-3.5 h-3.5 text-[#78716A]" />
                        <span className="font-mono text-xs font-semibold text-[#57524B]">
                          Delivery: {pkg.delivery}
                        </span>
                      </div>

                      {/* Suitability / Purpose */}
                      <div className="mb-5 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase font-bold text-[#78716A] block">
                          Suitability &amp; Operational Purpose
                        </span>
                        <p className="text-xs text-[#57524B] leading-relaxed">
                          {pkg.suitability}
                        </p>
                      </div>

                      {/* Core Features */}
                      <div className="mb-5 space-y-2">
                        <span className="text-[10.5px] font-mono uppercase font-bold text-[#191716] block">
                          Core Architecture Features
                        </span>
                        <ul className="space-y-1.5 text-xs text-[#57524B]">
                          {pkg.coreFeatures.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#C85A32] shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key Deliverables */}
                      <div className="mb-6 space-y-2">
                        <span className="text-[10.5px] font-mono uppercase font-bold text-[#191716] block">
                          Key Deliverables
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.keyDeliverables.map((deliv, dIdx) => (
                            <span
                              key={dIdx}
                              className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5] text-[#191716] flex items-center gap-1"
                            >
                              <FileCheck className="w-3 h-3 text-emerald-600" />
                              <span>{deliv}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Primary Call to Action Button */}
                    <div className="pt-4 border-t border-[#E5E0D5]">
                      <button
                        type="button"
                        onClick={() => handleInquire(pkg.id)}
                        className="w-full h-10 rounded-lg bg-[#191716] hover:bg-[#C85A32] text-white font-delight font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group-hover:bg-[#C85A32]"
                      >
                        <span>Inquire For This Package</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <p className="font-mono text-[10px] text-center text-[#78716A] mt-2">
                        Includes custom spec scoping &amp; milestone agreement
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Inquiry Modal Connection */}
      <ProjectInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        selectedPackageId={selectedPackageId}
      />
    </section>
  );
};
