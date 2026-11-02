import { Router, Request, Response } from 'express';
import { db } from '../index';

const router = Router();

// In-memory fallback store
export const memoryInquiriesStore: any[] = [];

// POST /api/inquiries - Log a new service/project scope inquiry
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const inquiry = {
      id: data.ticketId || `INQ-${Date.now()}`,
      packageId: data.packageId,
      packageTitle: data.packageTitle,
      category: data.category,
      tier: data.tier,
      investment: data.investment,
      delivery: data.delivery,
      clientName: data.client?.name || data.name || '',
      clientEmail: data.client?.email || data.email || '',
      clientPhone: data.client?.phone || data.phone || '',
      clientCompany: data.client?.company || data.company || '',
      timeline: data.client?.timeline || data.timeline || 'Standard',
      scopeNotes: data.client?.scopeNotes || data.scopeNotes || '',
      status: 'New Inquiry',
      createdAt: new Date().toISOString()
    };

    memoryInquiriesStore.unshift(inquiry);

    // If Firestore is available, save to inquiries collection
    try {
      if (db && typeof db.collection === 'function') {
        await db.collection('inquiries').doc(inquiry.id).set(inquiry);
      }
    } catch (e) {
      console.warn('[Inquiries] Firestore write skipped/failed:', (e as Error).message);
    }

    console.log(`[Inquiries] New Project Scope logged: ${inquiry.id} - ${inquiry.packageTitle} for ${inquiry.clientName} (${inquiry.clientEmail})`);

    return res.status(201).json({
      success: true,
      message: 'Project scope inquiry logged successfully.',
      inquiry
    });
  } catch (err: any) {
    console.error('[Inquiries] Error creating inquiry:', err);
    return res.status(500).json({ error: 'Failed to process inquiry' });
  }
});

// GET /api/inquiries - List logged inquiries (Admin / Superadmin)
router.get('/', async (_req: Request, res: Response) => {
  try {
    let list = [...memoryInquiriesStore];
    try {
      if (db && typeof db.collection === 'function') {
        const snap = await db.collection('inquiries').orderBy('createdAt', 'desc').limit(100).get();
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }
    } catch {}
    return res.json({ success: true, inquiries: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

export default router;
