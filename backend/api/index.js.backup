import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAllMockTrades } from '../src/mockData';
import { WorkflowService } from '../src/services/workflowService';
import { EmbeddingService } from '../src/services/embeddingService';
import { QdrantService } from '../src/services/qdrantService';
import { AnomalyService } from '../src/services/anomalyService';
import { CoachingService } from '../src/services/coachingService';

const app = express();

// Middleware - Configure CORS properly for Vercel
app.use(cors({
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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

// Initialize Qdrant collection
let initialized = false;
async function initializeServices() {
  if (!initialized) {
    try {
      await qdrantService.initializeCollection();
      console.log('Qdrant collection initialized successfully');
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize Qdrant collection:', error);
    }
  }
}

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// GET /api/trades
app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    await initializeServices();
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

// POST /api/coaching/trigger
app.post('/api/coaching/trigger', async (req: Request, res: Response) => {
  try {
    await initializeServices();
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

// GET /api/coaching/status/:workflowId
app.get('/api/coaching/status/:workflowId', async (req: Request, res: Response) => {
  try {
    await initializeServices();
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

export default app;
