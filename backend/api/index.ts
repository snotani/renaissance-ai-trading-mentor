import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Health check
    if (url === '/health' || url === '/api/health') {
      res.status(200).json({ status: 'ok' });
      return;
    }

    // GET /api/trades
    if ((url === '/api/trades' || url?.startsWith('/api/trades')) && method === 'GET') {
      // Import dynamically to avoid cold start issues
      const { getAllMockTrades } = await import('../src/mockData');
      const trades = getAllMockTrades();
      res.status(200).json({ trades });
      return;
    }

    // POST /api/coaching/trigger
    if ((url === '/api/coaching/trigger' || url?.startsWith('/api/coaching/trigger')) && method === 'POST') {
      // Import services dynamically
      const { WorkflowService } = await import('../src/services/workflowService');
      const { EmbeddingService } = await import('../src/services/embeddingService');
      const { QdrantService } = await import('../src/services/qdrantService');
      const { AnomalyService } = await import('../src/services/anomalyService');
      const { CoachingService } = await import('../src/services/coachingService');

      const geminiApiKey = process.env.GEMINI_API_KEY || '';
      const qdrantUrl = process.env.QDRANT_URL || '';
      const qdrantApiKey = process.env.QDRANT_API_KEY;

      const embeddingService = new EmbeddingService(geminiApiKey);
      const qdrantService = new QdrantService(qdrantUrl, qdrantApiKey);
      const anomalyService = new AnomalyService();
      const coachingService = new CoachingService(geminiApiKey);
      const workflowService = new WorkflowService(
        embeddingService,
        qdrantService,
        anomalyService,
        coachingService
      );

      // Initialize Qdrant
      await qdrantService.initializeCollection();
      
      const workflowId = await workflowService.executeWorkflow();
      res.status(200).json({ workflowId });
      return;
    }

    // GET /api/coaching/status/:workflowId
    if (url?.startsWith('/api/coaching/status/') && method === 'GET') {
      const workflowId = url.split('/').pop();
      
      if (!workflowId) {
        res.status(400).json({ error: 'Missing workflowId parameter' });
        return;
      }

      // Import services dynamically
      const { WorkflowService } = await import('../src/services/workflowService');
      const { EmbeddingService } = await import('../src/services/embeddingService');
      const { QdrantService } = await import('../src/services/qdrantService');
      const { AnomalyService } = await import('../src/services/anomalyService');
      const { CoachingService } = await import('../src/services/coachingService');

      const geminiApiKey = process.env.GEMINI_API_KEY || '';
      const qdrantUrl = process.env.QDRANT_URL || '';
      const qdrantApiKey = process.env.QDRANT_API_KEY;

      const embeddingService = new EmbeddingService(geminiApiKey);
      const qdrantService = new QdrantService(qdrantUrl, qdrantApiKey);
      const anomalyService = new AnomalyService();
      const coachingService = new CoachingService(geminiApiKey);
      const workflowService = new WorkflowService(
        embeddingService,
        qdrantService,
        anomalyService,
        coachingService
      );

      const workflowResult = workflowService.getWorkflowStatus(workflowId);

      if (!workflowResult) {
        res.status(404).json({
          error: 'Workflow not found',
          message: `No workflow found with ID: ${workflowId}`,
        });
        return;
      }

      res.status(200).json(workflowResult);
      return;
    }

    // 404 for unknown routes
    res.status(404).json({ error: 'Not found', url, method });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
