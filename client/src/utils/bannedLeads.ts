export const BANNED_MOCK_LEAD_NAMES = new Set<string>([
  'royale realtors india',
  'royal siyaram properties & estate',
  'yadav properties - property dealers in south delhi',
  'gulshan estate agents – real estate consultants',
  'deepak chawla',
  'munjaal realtors',
  'perfect homes',
  'dazzle dental clinic',
  'techasoft private limited',
  'cloud software solution - website & mobile app development company in bangalore',
  'erplax bangalore',
  'apex cloud solutions',
  'nextgen ai labs',
  'zenith logistics hub',
  'quantum fintech global',
  'starlight media studios',
  'bluepeak real estate advisors',
  'pulsehealth telemedicine',
  'innova agritech ventures',
  'cyberguard defense systems',
  'greenmatrix solar energy'
]);

export function isBannedLead(lead: any): boolean {
  if (!lead) return true;
  const name = String(lead.businessName || lead.name || '').toLowerCase().trim();
  if (BANNED_MOCK_LEAD_NAMES.has(name)) return true;
  return false;
}

export function filterOutBannedLeads<T>(leads: T[]): T[] {
  if (!Array.isArray(leads)) return [];
  return leads.filter(l => !isBannedLead(l));
}
