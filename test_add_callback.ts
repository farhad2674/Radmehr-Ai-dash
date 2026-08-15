app.post('/api/kie/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    console.log('[Kie.ai Webhook] Received callback:', JSON.stringify(payload));
    
    if (payload && payload.data && payload.data.taskId) {
      const taskId = payload.data.taskId;
      const stateStr = (payload.data.state || '').toString().toLowerCase();
      
      const job = activeJobs.get(taskId);
      if (!job) {
        // If we don't have the job in memory, we can't update it. But it's good to log.
        console.log(`[Kie.ai Webhook] Job ${taskId} not found in memory`);
        res.status(200).send('OK');
        return;
      }

      if (stateStr === 'success' || stateStr === 'completed') {
        let foundImageUrl: string | null = null;
        if (payload.data.resultJson) {
           try {
             const parsedResult = typeof payload.data.resultJson === 'string' ? JSON.parse(payload.data.resultJson) : payload.data.resultJson;
             if (parsedResult.resultUrls && Array.isArray(parsedResult.resultUrls) && parsedResult.resultUrls.length > 0) {
               foundImageUrl = parsedResult.resultUrls[0];
             }
           } catch (e) {
             console.warn('[Kie.ai Webhook] Failed parsing resultJson');
           }
        }
        
        if (foundImageUrl) {
           // We can't await cacheRemoteImageToDisk if we want to return 200 immediately, but we can do it in background
           cacheRemoteImageToDisk(foundImageUrl, 'kie_market').then(diskUrl => {
             job.imageUrl = diskUrl;
             job.status = 'COMPLETED';
             job.completedAt = Date.now();
           });
        } else {
           job.status = 'FAILED';
           job.error = 'No image URL found in callback';
        }
      } else if (stateStr === 'fail' || stateStr === 'failed' || stateStr === 'error') {
         job.status = 'FAILED';
         job.error = 'Task failed according to callback';
      }
    }
    res.status(200).send('OK');
  } catch (err: any) {
    console.error('[Kie.ai Webhook] Error processing callback:', err);
    res.status(500).send('Error');
  }
});
