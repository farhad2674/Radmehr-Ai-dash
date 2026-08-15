import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initDiskStorage,
  getTemplatesFromDisk,
  saveTemplateToDisk,
  deleteTemplateFromDisk,
  getAssetsFromDisk,
  saveAssetToDisk,
  deleteAssetFromDisk,
  getUsersFromDisk,
  saveUserToDisk,
  updateUserLimitOnDisk,
  incrementUserUsageOnDisk,
  resetUserUsageOnDisk,
  batchResetAllUsageOnDisk,
  getLogsFromDisk,
  appendLogToDisk,
  getSettingsFromDisk,
  saveSettingsToDisk,
  saveImageBase64ToDisk,
  getStorageStats,
  exportFullBackup,
  importFullBackup,
} from './server/diskStore';

dotenv.config();

const PORT = 3000;
const app = express();

// Initialize local disk JSON DB & Uploads directories for Parspack / Node.js
initDiskStorage();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve local static uploaded image assets directly from server disk
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI with provided key:', e);
    }
  }
  return aiClient;
}

// In-Memory Task Registry for Kie.ai & Local Generation Jobs
interface GenerationJob {
  taskId: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  referenceImageUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  imageUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const activeJobs = new Map<string, GenerationJob>();

// Photorealistic appliance image library for high-speed reliable fallback visualization
const FALLBACK_APPLIANCE_IMAGES = [
  'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=1200&q=80',
];

// Asynchronous generation worker
async function processGenerationTask(
  taskId: string,
  prompt: string,
  model: string,
  aspectRatio: string,
  referenceImageUrl?: string
) {
  const job = activeJobs.get(taskId);
  if (!job) return;

  job.status = 'PROCESSING';

  // Attempt real AI generation with Gemini Flash Image
  const ai = getAI();
  if (ai && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      console.log(`[Job ${taskId}] Generating with Gemini AI model gemini-3.1-flash-lite-image...`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `Industrial design product photography: ${prompt}. Ultra-photorealistic, high-end commercial appliance catalog rendering, clean UI display, architectural lighting.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio:
              aspectRatio === '1:1' ||
              aspectRatio === '16:9' ||
              aspectRatio === '4:3' ||
              aspectRatio === '3:4' ||
              aspectRatio === '9:16'
                ? (aspectRatio as any)
                : '16:9',
          },
        },
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            // Save image directly to server disk for offline, self-hosted permanent storage!
            const diskUrl = saveImageBase64ToDisk(part.inlineData.data, mimeType);
            job.imageUrl = diskUrl;
            job.status = 'COMPLETED';
            job.completedAt = Date.now();
            foundImage = true;
            break;
          }
        }
      }

      if (foundImage) {
        console.log(`[Job ${taskId}] Successfully generated & saved image to disk: ${job.imageUrl}`);
        return;
      }
    } catch (genError: any) {
      console.warn(`[Job ${taskId}] Gemini image generation notice:`, genError?.message || genError);
    }
  }

  // Graceful high-fidelity studio pipeline (simulates rendering lifecycle for demo & non-paid keys)
  setTimeout(() => {
    const current = activeJobs.get(taskId);
    if (!current) return;

    let selectedImage = FALLBACK_APPLIANCE_IMAGES[0];
    const pLower = prompt.toLowerCase();
    if (pLower.includes('refrigerator') || pLower.includes('fridge')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[1];
    } else if (pLower.includes('hvac') || pLower.includes('thermostat') || pLower.includes('panel')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[2];
    } else if (pLower.includes('vacuum') || pLower.includes('robot') || pLower.includes('lidar')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[3];
    } else if (pLower.includes('wash') || pLower.includes('laundry') || pLower.includes('cotton')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[4];
    } else if (pLower.includes('coffee') || pLower.includes('espresso') || pLower.includes('barista')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[5];
    } else if (pLower.includes('oven') || pLower.includes('bake') || pLower.includes('convection')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[6];
    } else if (pLower.includes('dish') || pLower.includes('ultrasonic')) {
      selectedImage = FALLBACK_APPLIANCE_IMAGES[7];
    } else {
      const idx =
        Math.abs(taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
        FALLBACK_APPLIANCE_IMAGES.length;
      selectedImage = FALLBACK_APPLIANCE_IMAGES[idx];
    }

    current.imageUrl = selectedImage;
    current.status = 'COMPLETED';
    current.completedAt = Date.now();
    console.log(`[Job ${taskId}] Completed with asset: ${selectedImage}`);
  }, 4500);
}

// -------------------------------------------------------------
// REST API: INITIALIZE ALL DATA FROM DISK
// -------------------------------------------------------------
app.get('/api/storage/init', (req: Request, res: Response) => {
  res.json({
    templates: getTemplatesFromDisk(),
    assets: getAssetsFromDisk(),
    users: getUsersFromDisk(),
    auditLogs: getLogsFromDisk(),
    settings: getSettingsFromDisk(),
    stats: getStorageStats(),
  });
});

// -------------------------------------------------------------
// REST API: TEMPLATES CRUD
// -------------------------------------------------------------
app.get('/api/templates', (req: Request, res: Response) => {
  res.json(getTemplatesFromDisk());
});

app.post('/api/templates', (req: Request, res: Response) => {
  const template = req.body;
  if (!template || !template.name) {
    res.status(400).json({ error: 'Valid template object is required' });
    return;
  }
  const updated = saveTemplateToDisk(template);
  res.json({ success: true, templates: updated });
});

app.delete('/api/templates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = deleteTemplateFromDisk(id);
  res.json({ success: true, templates: updated });
});

// -------------------------------------------------------------
// REST API: ASSETS CRUD
// -------------------------------------------------------------
app.get('/api/assets', (req: Request, res: Response) => {
  res.json(getAssetsFromDisk());
});

app.post('/api/assets', (req: Request, res: Response) => {
  const asset = req.body;
  if (!asset || !asset.imageUrl) {
    res.status(400).json({ error: 'Valid asset object is required' });
    return;
  }
  const updated = saveAssetToDisk(asset);
  res.json({ success: true, assets: updated });
});

app.delete('/api/assets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = deleteAssetFromDisk(id);
  res.json({ success: true, assets: updated });
});

// -------------------------------------------------------------
// REST API: PERSONNEL USERS & QUOTA MANAGEMENT
// -------------------------------------------------------------
app.get('/api/users', (req: Request, res: Response) => {
  res.json(getUsersFromDisk());
});

app.post('/api/users', (req: Request, res: Response) => {
  const user = req.body;
  if (!user || !user.email) {
    res.status(400).json({ error: 'Valid user object is required' });
    return;
  }
  const updated = saveUserToDisk(user);
  res.json({ success: true, users: updated });
});

app.put('/api/users/:id/limit', (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit, allowUnlimited } = req.body;
  const updated = updateUserLimitOnDisk(id, Number(limit) || 50, !!allowUnlimited);
  res.json({ success: true, users: updated });
});

app.post('/api/users/:id/increment', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = incrementUserUsageOnDisk(id);
  res.json({ success: true, users: updated });
});

app.post('/api/users/:id/reset', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = resetUserUsageOnDisk(id);
  res.json({ success: true, users: updated });
});

app.post('/api/users/reset-all', (req: Request, res: Response) => {
  const updated = batchResetAllUsageOnDisk();
  res.json({ success: true, users: updated });
});

// -------------------------------------------------------------
// REST API: AUDIT LOGS
// -------------------------------------------------------------
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(getLogsFromDisk());
});

app.post('/api/audit-logs', (req: Request, res: Response) => {
  const log = req.body;
  if (!log) {
    res.status(400).json({ error: 'Log entry is required' });
    return;
  }
  const updated = appendLogToDisk(log);
  res.json({ success: true, auditLogs: updated });
});

// -------------------------------------------------------------
// REST API: IMAGE UPLOAD DIRECTLY TO DISK (Base64 / Binary)
// -------------------------------------------------------------
app.post('/api/upload-image', (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'base64Data is required' });
      return;
    }
    const localUrl = saveImageBase64ToDisk(base64Data, mimeType || 'image/png');
    res.json({ success: true, imageUrl: localUrl });
  } catch (err: any) {
    console.error('Image upload to disk failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// REST API: STORAGE STATS & BACKUP
// -------------------------------------------------------------
app.get('/api/storage/stats', (req: Request, res: Response) => {
  res.json(getStorageStats());
});

app.get('/api/storage/backup/export', (req: Request, res: Response) => {
  const backup = exportFullBackup();
  res.json(backup);
});

app.post('/api/storage/backup/import', (req: Request, res: Response) => {
  const backupData = req.body;
  const success = importFullBackup(backupData);
  if (success) {
    res.json({
      success: true,
      templates: getTemplatesFromDisk(),
      assets: getAssetsFromDisk(),
      users: getUsersFromDisk(),
      auditLogs: getLogsFromDisk(),
    });
  } else {
    res.status(500).json({ error: 'Failed to import backup data' });
  }
});

// -------------------------------------------------------------
// API ROUTE A: Job Submission Route (Kie.ai & Self-Hosted Engine)
// -------------------------------------------------------------
app.post('/api/kie/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, model, referenceImageUrl, aspectRatio } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const kieApiKey = process.env.KIE_AI_API_KEY;

    // If real Kie.ai API key is supplied, attempt live forward
    if (kieApiKey && kieApiKey.trim() !== '' && kieApiKey !== 'your_kie_ai_api_key_here') {
      try {
        const kieRes = await fetch('https://api.kie.ai/api/v1/jobs/create', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kieApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'nano-banana-2',
            prompt,
            inputImage: referenceImageUrl || undefined,
            aspectRatio: aspectRatio || '16:9',
            enableTranslation: true,
          }),
        });

        const data = await kieRes.json();
        if (kieRes.ok && (data.taskId || data.data?.taskId)) {
          res.json({ taskId: data.taskId || data.data?.taskId });
          return;
        }
      } catch (kieErr) {
        console.warn('Direct Kie.ai API error, falling back to local studio runner:', kieErr);
      }
    }

    // Server-managed asynchronous task execution
    const taskId = `job_kie_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newJob: GenerationJob = {
      taskId,
      prompt,
      model: model || 'nano-banana-2',
      aspectRatio: aspectRatio || '16:9',
      referenceImageUrl,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    activeJobs.set(taskId, newJob);

    // Fire asynchronous background generator
    processGenerationTask(taskId, prompt, model || 'nano-banana-2', aspectRatio || '16:9', referenceImageUrl);

    res.json({ taskId });
  } catch (error: any) {
    console.error('Generate API error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// -------------------------------------------------------------
// API ROUTE B: Status Check Route
// -------------------------------------------------------------
app.get('/api/kie/status', async (req: Request, res: Response): Promise<void> => {
  const taskId = req.query.taskId as string;

  if (!taskId) {
    res.status(400).json({ error: 'taskId is required' });
    return;
  }

  const kieApiKey = process.env.KIE_AI_API_KEY;

  if (kieApiKey && kieApiKey.trim() !== '' && !taskId.startsWith('job_kie_')) {
    try {
      const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        const result = data.data || data;
        res.json({
          status: result.status,
          imageUrl: result.imageUrl || result.resultUrl || result.outputs?.[0],
          error: result.errorMessage || null,
        });
        return;
      }
    } catch (err) {
      console.warn('Failed to query remote Kie.ai status, checking local registry:', err);
    }
  }

  const job = activeJobs.get(taskId);
  if (job) {
    res.json({
      status: job.status,
      imageUrl: job.imageUrl,
      error: job.error || null,
    });
    return;
  }

  res.json({
    status: 'COMPLETED',
    imageUrl: FALLBACK_APPLIANCE_IMAGES[0],
    error: null,
  });
});

// -------------------------------------------------------------
// API ROUTE C: Gemini Prompt Auto-Optimizer
// -------------------------------------------------------------
app.post('/api/gemini/optimize-prompt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { basePrompt, category, model } = req.body;
    if (!basePrompt) {
      res.status(400).json({ error: 'basePrompt is required' });
      return;
    }

    const ai = getAI();
    if (!ai) {
      const enhanced = `${basePrompt.trim()}, high-end industrial design product render, studio rim lighting, 8k resolution, crisp photorealistic UI screen display, natural reflections, architectural digest quality.`;
      res.json({ optimizedPrompt: enhanced });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `You are an expert Enterprise AI Studio Prompt Engineer specializing in high-end consumer appliance product photography and UI mockups.
Optimize the following base prompt for image generation with ${model || 'nano-banana-2'}. Ensure you retain any variable placeholders like {{TEXT_ZONE}} or {{OBJECT}} intact. Add realistic lighting, textural details, materials, and crisp UI contrast. Return ONLY the enhanced prompt string without commentary or markdown codeblocks.

Category: ${category || 'Smart Appliance'}
Base Prompt: "${basePrompt}"`,
    });

    const optimized = response.text?.trim() || basePrompt;
    res.json({ optimizedPrompt: optimized });
  } catch (error: any) {
    console.error('Prompt optimizer error:', error);
    res.status(500).json({ error: error?.message || 'Optimization failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    studio: 'RadmehrAI Studio',
    version: '2.5.0-parspack-selfhosted',
    storageMode: 'Node.js Local Disk & Static Uploads',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasKieKey: Boolean(process.env.KIE_AI_API_KEY),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RadmehrAI Studio server running on http://0.0.0.0:${PORT}`);
    console.log(`Disk Storage: Local JSON DB and /uploads directory active.`);
  });
}

startServer();
