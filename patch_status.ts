import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const statusCodeOriginal = `  const kieApiKey = process.env.KIE_AI_API_KEY;

  // Check remote Kie.ai API if taskId is from remote Kie.ai
  if (kieApiKey && kieApiKey.trim() !== '' && !taskId.startsWith('job_kie_')) {`;

const statusCodeNew = `  const kieApiKey = process.env.KIE_AI_API_KEY;

  // 1. Check local job state first (it might have been updated by the webhook callback)
  const job = activeJobs.get(taskId);
  if (job && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
    res.json({
      status: job.status,
      imageUrl: job.imageUrl,
      error: job.error || null,
    });
    return;
  }

  // 2. Check remote Kie.ai API if taskId is from remote Kie.ai and not yet completed
  if (kieApiKey && kieApiKey.trim() !== '' && !taskId.startsWith('job_kie_')) {`;

content = content.replace(statusCodeOriginal, statusCodeNew);
fs.writeFileSync('server.ts', content);
