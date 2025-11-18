/**
 * Minimal test script for workflow orchestration
 * Uses fewer tokens to avoid quota limits
 */

import dotenv from 'dotenv';
import { EmbeddingService, QdrantService, AnomalyService, CoachingService, WorkflowService } from './services';
import { Trade, SimilarTrade, AnomalyResult } from './types';

// Load environment variables
dotenv.config();

async function testMinimalWorkflow() {
  console.log('=== Testing Minimal Workflow (Low Token Usage) ===\n');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  if (!geminiApiKey) {
    console.error('Error: GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // Initialize services
    console.log('Initializing services...');
    const coachingService = new CoachingService(geminiApiKey);

    // Create minimal test data
    const recentTrades: Trade[] = [
      {
        id: 'test-1',
        symbol: 'BTCUSD',
        direction: 'BUY',
        lot_size: 1.0,
        entry: 42000,
        exit: 43000,
        pnl: 1000,
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: 'test-2',
        symbol: 'ETHUSD',
        direction: 'SELL',
        lot_size: 2.0,
        entry: 2200,
        exit: 2100,
        pnl: 200,
        timestamp: '2024-01-15T11:00:00Z'
      }
    ];

    const similarPatterns: SimilarTrade[] = [];

    const anomalyResults: AnomalyResult = {
      riskScore: 30,
      detectedBehaviors: [
        {
          type: 'over-leverage',
          severity: 'low',
          description: 'Lot size slightly elevated'
        }
      ]
    };

    console.log('\n--- Testing Coaching Generation (Minimal Prompt) ---');
    console.log('Generating coaching with 2 trades, 0 similar patterns, 1 behavior...\n');

    const coaching = await coachingService.generateCoaching({
      recentTrades,
      similarPatterns,
      anomalyResults
    });

    console.log('✓ Coaching generated successfully!\n');
    console.log('--- Coaching Output ---');
    console.log(coaching);
    console.log('\n--- Test Complete ---');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMinimalWorkflow();
