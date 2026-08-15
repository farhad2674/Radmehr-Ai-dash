import { useState, useRef, useCallback, useEffect } from 'react';
import { GenerateParams, UseKieImageGeneratorResult } from '../types';

export function useKieImageGenerator(): UseKieImageGeneratorResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPolling();
    };
  }, [cancelPolling]);

  const generateImage = useCallback(
    async (params: GenerateParams): Promise<string | null> => {
      cancelPolling();
      setLoading(true);
      setError(null);
      setStatus('INITIATING');
      setTaskId(null);
      setElapsedSeconds(0);

      // Start elapsed timer
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      try {
        // Step 1: Request task creation
        const initRes = await fetch('/api/kie/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const initData = await initRes.json();

        if (!initRes.ok || !initData.taskId) {
          throw new Error(initData.error || 'Failed to initiate generation task.');
        }

        const currentTaskId = initData.taskId;
        setTaskId(currentTaskId);
        setStatus('PROCESSING');

        // Step 2: Poll every 5 seconds until COMPLETED or FAILED
        return new Promise<string | null>((resolve, reject) => {
          // Immediately perform an initial status poll after 1s then loop every 5s
          const checkStatus = async () => {
            try {
              const statusRes = await fetch(`/api/kie/status?taskId=${currentTaskId}`);
              const statusData = await statusRes.json();

              if (!statusRes.ok) {
                throw new Error(statusData.error || 'Error checking task status.');
              }

              const currentStatus = statusData.status?.toUpperCase();
              setStatus(currentStatus);

              if (currentStatus === 'COMPLETED' || currentStatus === 'SUCCESS') {
                cancelPolling();
                setLoading(false);
                if (statusData.imageUrl) {
                  resolve(statusData.imageUrl);
                } else {
                  const err = 'Task completed but no image URL was returned.';
                  setError(err);
                  reject(new Error(err));
                }
              } else if (currentStatus === 'FAILED') {
                cancelPolling();
                setLoading(false);
                const err = statusData.error || 'Image generation failed on server.';
                setError(err);
                reject(new Error(err));
              }
            } catch (err: any) {
              cancelPolling();
              setLoading(false);
              setError(err.message || 'Polling network failure.');
              reject(err);
            }
          };

          pollTimerRef.current = setInterval(checkStatus, 5000);
        });
      } catch (err: any) {
        cancelPolling();
        setLoading(false);
        setStatus('FAILED');
        const errMsg = err.message || 'An unexpected error occurred.';
        setError(errMsg);
        return null;
      }
    },
    [cancelPolling]
  );

  return {
    generateImage,
    loading,
    status,
    error,
    cancelPolling,
    taskId,
    elapsedSeconds,
  };
}
