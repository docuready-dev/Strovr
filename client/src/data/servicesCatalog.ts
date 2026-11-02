export interface ServicePackage {
  id: string;
  category: 'Web Infrastructure & Engineering' | 'Brand Identity & Industrial Systems' | 'Software & Application Builds';
  categoryKey: 'web' | 'brand' | 'software';
  tierNumber: string; // "Tier 1", "Tier 2", "Tier 3", "Tier 4"
  title: string;
  investment: string;
  delivery: string;
  deliveryDays: string;
  suitability: string;
  coreFeatures: string[];
  keyDeliverables: string[];
  badge?: string;
  recommendedFor?: string;
}

export const SERVICE_CATEGORIES = [
  {
    key: 'all',
    label: 'All Systems',
    count: 10,
    tagline: 'Complete Engineering, Industrial Identity & Software Catalog'
  },
  {
    key: 'web',
    label: 'Web Infrastructure & Engineering',
    count: 3,
    tagline: 'High-concurrency web builds, tender-ready portals, and automated B2B architectures'
  },
  {
    key: 'brand',
    label: 'Brand Identity & Industrial Systems',
    count: 3,
    tagline: 'Precision vector marks, commercial stationery, and heavy industrial livery blueprints'
  },
  {
    key: 'software',
    label: 'Software & Application Builds',
    count: 4,
    tagline: 'Field Android runtimes, Progressive Edge PWAs, and full-stack operational dashboards'
  }
] as const;

export const SERVICES_CATALOG: ServicePackage[] = [
  // ================= CATEGORY 1: Web Infrastructure & Engineering =================
  {
    id: 'web-tier-1-digital-nexus',
    category: 'Web Infrastructure & Engineering',
    categoryKey: 'web',
    tierNumber: 'Tier 1',
    title: 'Digital Nexus Core',
    investment: '₹25,000 to ₹40,000',
    delivery: '7 to 10 Business Days',
    deliveryDays: '7-10 BIZ DAYS',
    badge: 'Tender & Vendor Ready',
    suitability: 'Small-to-mid manufacturing facilities, local logistics operators, and transport fleets that need a verified corporate digital footprint for vendor onboarding, audits, and tenders.',
    coreFeatures: [
      '4 to 6 responsive high-performance views (Home, Infrastructure, Fleet/Services, Quality Standards, Compliance, Contact)',
      'Mobile-first performance grid architecture',
      'WhatsApp Business direct trigger integration',
      'Validated inquiry and vendor audit forms',
      'Optimized fleet and facility showcase galleries',
      'Baseline SSL certification and semantic SEO setup'
    ],
    keyDeliverables: [
      'Production-ready web build',
      'DNS and domain linking configuration',
      'Raw asset handoff archive',
      'Cross-browser and mobile audit report'
    ]
  },
  {
    id: 'web-tier-2-enterprise-grid',
    category: 'Web Infrastructure & Engineering',
    categoryKey: 'web',
    tierNumber: 'Tier 2',
    title: 'Enterprise Grid',
    investment: '₹45,000 to ₹80,000',
    delivery: '14 to 20 Business Days',
    deliveryDays: '14-20 BIZ DAYS',
    badge: 'Most Popular for Multi-Hub',
    suitability: 'Multi-branch supply chain firms, regional freight brokers, and high-capacity manufacturing plants requiring detailed technical breakdowns of capabilities and specs.',
    coreFeatures: [
      '8 to 12 structured modules with dedicated service landing paths',
      'Dynamic RFQ inquiry forms with automated email/SMS notifications',
      'Downloadable technical PDF spec sheets and brochures',
      'Interactive multi-hub branch and route location maps',
      'Full semantic on-page SEO schema configuration'
    ],
    keyDeliverables: [
      'Structured CMS or custom web build',
      'Integrated downloadable PDF spec assets',
      'Interactive branch and hub mapping',
      'Form submission logging and webhook feeds',
      '30 days post-launch technical support'
    ]
  },
  {
    id: 'web-tier-3-synapse-suite',
    category: 'Web Infrastructure & Engineering',
    categoryKey: 'web',
    tierNumber: 'Tier 3',
    title: 'Synapse B2B Suite',
    investment: '₹85,000 to ₹1,60,000+',
    delivery: '25 to 35 Business Days',
    deliveryDays: '25-35 BIZ DAYS',
    badge: 'Enterprise Architecture',
    suitability: 'Large-scale enterprise supply chains, export houses, shipping lines, and contract manufacturers requiring custom automation, client portals, and API interoperability.',
    coreFeatures: [
      'Custom frontend and backend architecture tailored to cargo volumes',
      'Interactive freight rate and volume RFQ calculator engine',
      'Third-party tracking webhook and API integrations',
      'Role-gated client portal interface for invoices and manifests',
      'High-concurrency database connectivity with CDN edge routing'
    ],
    keyDeliverables: [
      'Custom production codebase repository',
      'Comprehensive API documentation',
      'Administrative control panel',
      'Relational database schema and migration scripts',
      'Automated deployment pipeline setup'
    ]
  },

  // ================= CATEGORY 2: Brand Identity & Industrial Systems =================
  {
    id: 'brand-tier-1-vector-mark',
    category: 'Brand Identity & Industrial Systems',
    categoryKey: 'brand',
    tierNumber: 'Tier 1',
    title: 'Vector Vectorial Mark',
    investment: '₹1,999',
    delivery: '2 to 3 Business Days',
    deliveryDays: '2-3 BIZ DAYS',
    badge: 'Precision Geometry',
    suitability: 'New trade contractors, fabrication workshops, and micro-logistics agencies needing a sharp vector mark to replace generic clip art.',
    coreFeatures: [
      '2 bespoke conceptual logo directions based on geometric/monospaced systems',
      'Single-color, high-contrast, and dark-mode lockups',
      'Scalable master assets suitable for signage, CNC cutouts, and embroidery'
    ],
    keyDeliverables: [
      'Master vector files (SVG, EPS, high-res PNG)',
      'Exact hex and CMYK industrial color definitions'
    ]
  },
  {
    id: 'brand-tier-2-system-identity',
    category: 'Brand Identity & Industrial Systems',
    categoryKey: 'brand',
    tierNumber: 'Tier 2',
    title: 'System Identity Matrix',
    investment: '₹5,499',
    delivery: '5 to 7 Business Days',
    deliveryDays: '5-7 BIZ DAYS',
    badge: 'Commercial Fleet Standard',
    suitability: 'Expanding logistics fleets and commercial suppliers looking to unify customer paperwork, digital communications, and social platforms.',
    coreFeatures: [
      '3 refined conceptual variations with alternate horizontal and badge lockups',
      'Commercial stationery system (letterhead, purchase orders, invoice skins, email signatures)',
      'Social media launch kit with 6 editable templates',
      'Typography specifications and styling guidelines'
    ],
    keyDeliverables: [
      'Brand guideline handbook (PDF)',
      'Editable source files (AI, Figma, SVG)',
      'Print-ready commercial stationery PDFs',
      'Digital social media identity kit'
    ]
  },
  {
    id: 'brand-tier-3-livery-matrix',
    category: 'Brand Identity & Industrial Systems',
    categoryKey: 'brand',
    tierNumber: 'Tier 3',
    title: 'Industrial Livery Matrix',
    investment: '₹12,499',
    delivery: '8 to 10 Business Days',
    deliveryDays: '8-10 BIZ DAYS',
    badge: 'Fleet & Facility Specs',
    suitability: 'Heavy transport operations, ocean/air cargo companies, and plant floors requiring strict real-world asset and vehicle branding.',
    coreFeatures: [
      'Vehicle and container livery blueprints (box trucks, flatbeds, shipping containers, utility vans)',
      'Floor-ready staff wear specs (high-vis jackets, safety helmets, factory uniforms)',
      'Shipping carton stamps, pallet stencil labels, packing tape graphics, and industrial badges'
    ],
    keyDeliverables: [
      'Factory-ready vector print files',
      'Dimensional decal blueprints with scale markers',
      'Full industrial physical asset kit'
    ]
  },

  // ================= CATEGORY 3: Software & Application Builds =================
  {
    id: 'software-tier-1-mobile-utility',
    category: 'Software & Application Builds',
    categoryKey: 'software',
    tierNumber: 'Tier 1',
    title: 'Mobile Utility (Android)',
    investment: '₹3,999',
    delivery: '5 to 7 Business Days',
    deliveryDays: '5-7 BIZ DAYS',
    badge: 'Field Driver Ready',
    suitability: 'Localized fleet drivers, shop-floor operators, or field agents needing a lightweight reference app, directory, or contact tool without browser clutter.',
    coreFeatures: [
      'Up to 4 custom native-style screen views',
      'Offline caching for core reference assets and documents',
      'Direct one-tap call and WhatsApp dispatch integration',
      'Custom launcher icon with branded splash screen'
    ],
    keyDeliverables: [
      'Ready-to-install signed Android APK',
      'Complete screen graphic asset package'
    ]
  },
  {
    id: 'software-tier-2-core-android',
    category: 'Software & Application Builds',
    categoryKey: 'software',
    tierNumber: 'Tier 2',
    title: 'Core Android Runtime',
    investment: '₹9,999',
    delivery: '12 to 15 Business Days',
    deliveryDays: '12-15 BIZ DAYS',
    badge: 'Play Store Compliant',
    suitability: 'Transport booking services, warehouse inventory logging, or client-facing tracking utilities requiring verified access and dynamic data updates.',
    coreFeatures: [
      '8 to 10 dynamic UI screens and workflow flows',
      'User authentication (Email/Phone OTP or secure password login)',
      'Real-time database sync for orders and dispatches',
      'Payment gateway integration (Razorpay/UPI)',
      'Push notification triggers for dispatch updates'
    ],
    keyDeliverables: [
      'Google Play Store-compliant Android App Bundle (AAB)',
      'Signed production APK',
      'Cloud backend configuration setup',
      'Payment gateway verification sign-off'
    ]
  },
  {
    id: 'software-tier-3-progressive-edge-pwa',
    category: 'Software & Application Builds',
    categoryKey: 'software',
    tierNumber: 'Tier 3',
    title: 'Progressive Edge PWA',
    investment: '₹3,999',
    delivery: '5 to 7 Business Days',
    deliveryDays: '5-7 BIZ DAYS',
    badge: 'Zero-Install Web Shell',
    suitability: 'Quick-access client portals, route calculators, or rate lookup sheets where app store installation creates friction.',
    coreFeatures: [
      'Zero-install web shell executable from any browser across mobile and desktop',
      'Add to Home Screen native prompt integration',
      'Up to 4 interactive views with dynamic filter and search logic',
      'Offline caching via service workers'
    ],
    keyDeliverables: [
      'Web app manifest configuration',
      'Service worker caching setup',
      'Optimized production web bundle',
      'Cross-device responsive testing report'
    ]
  },
  {
    id: 'software-tier-4-full-stack-app',
    category: 'Software & Application Builds',
    categoryKey: 'software',
    tierNumber: 'Tier 4',
    title: 'Full-Stack Application',
    investment: '₹9,999',
    delivery: '12 to 15 Business Days',
    deliveryDays: '12-15 BIZ DAYS',
    badge: 'Custom Operations Hub',
    suitability: 'Back-office management, custom quotation tracking, internal cargo job logging, and operational dashboards.',
    coreFeatures: [
      'Dynamic cloud-backed single-page application',
      'Multi-role authentication (Admin vs. Client privileges)',
      'Full CRUD operations for orders, manifests, and shipments',
      'Interactive data tables with live search, filters, and CSV export',
      'Payment gateway hooks and billing ledger'
    ],
    keyDeliverables: [
      'Deployed cloud web application',
      'Complete database schema and index setup',
      'Master administrative credentials handoff',
      'Administrative operational documentation'
    ]
  }
];
