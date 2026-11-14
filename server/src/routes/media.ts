import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const uploadsDir = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err: any) {
    console.warn('[Media] Could not create uploads dir:', err.message);
  }
}

// Upload Media Endpoint (Accepts JSON base64 or binary data)
router.post('/upload', express.json({ limit: '25mb' }), async (req, res) => {
  try {
    const { fileData, fileName = 'attachment.pdf', fileType = 'application/pdf' } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'fileData (base64) is required' });
    }

    // Extract base64 payload
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : fileData;
    const resolvedType = matches ? matches[1] : fileType;

    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;
    const filePath = path.join(uploadsDir, fileId);

    fs.writeFileSync(filePath, buffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.strovr.space';
    const publicUrl = `${protocol}://${host}/api/media/view/${encodeURIComponent(fileId)}`;

    res.json({
      success: true,
      fileId,
      fileName: safeName,
      fileType: resolvedType,
      fileSize: `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`,
      url: publicUrl
    });
  } catch (err: any) {
    console.error('[Media] Upload error:', err);
    res.status(500).json({ error: 'Failed to upload media file' });
  }
});

// View / Download Media Endpoint
router.get('/view/:fileId', (req, res) => {
  const fileId = path.basename(req.params.fileId);
  const filePath = path.join(uploadsDir, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found or expired.');
  }

  const ext = path.extname(fileId).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.csv': 'text/csv',
    '.txt': 'text/plain'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${fileId.replace(/^[0-9]+_[a-z0-9]+_/, '')}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

export default router;
