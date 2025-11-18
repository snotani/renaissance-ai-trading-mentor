import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllMockTrades } from './mockData';
import { WorkflowService } from './services/workflowService';
import { EmbeddingService } from './services/embeddingService';
import { QdrantService } from './services/qdrantService';
import { AnomalyService } from './services/anomalyService';
import { CoachingService } from './services/coachingService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!geminiApiKey) {
  console.warn('Warning: GEMINI_API_KEY not set in environment variables');
}

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

// Initialize Qdrant collection on startup
(async () => {
  try {
    await qdrantService.initializeCollection();
    console.log('Qdrant collection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Qdrant collection:', error);
  }
})();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * GET /api/trades
 * Returns mock trade data
 * Requirements: 7.1
 */
app.get('/api/trades', (req: Request, res: Response) => {
  try {
    const trades = getAllMockTrades();
    res.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      error: 'Failed to fetch trades',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/coaching/trigger
 * Triggers the coaching workflow and returns a workflowId
 * Requirements: 7.1, 7.3
 */
app.post('/api/coaching/trigger', async (req: Request, res: Response) => {
  try {
    const workflowId = await workflowService.executeWorkflow();
    res.json({ workflowId });
  } catch (error) {
    console.error('Error triggering coaching workflow:', error);
    res.status(500).json({
      error: 'Failed to trigger coaching workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/coaching/status/:workflowId
 * Returns the status and results of a workflow
 * Requirements: 7.3, 7.5
 */
app.get('/api/coaching/status/:workflowId', (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    
    if (!workflowId) {
      res.status(400).json({
        error: 'Missing workflowId parameter',
      });
      return;
    }

    const workflowResult = workflowService.getWorkflowStatus(workflowId);

    if (!workflowResult) {
      res.status(404).json({
        error: 'Workflow not found',
        message: `No workflow found with ID: ${workflowId}`,
      });
      return;
    }

    res.json(workflowResult);
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      error: 'Failed to fetch workflow status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/trades`);
  console.log(`  POST /api/coaching/trigger`);
  console.log(`  GET  /api/coaching/status/:workflowId`);
});
