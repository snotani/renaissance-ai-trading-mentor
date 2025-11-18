/**
 * Test script for workflow orchestration
 * Tests the complete coaching pipeline
 */

import dotenv from 'dotenv';
import { EmbeddingService, QdrantService, AnomalyService, CoachingService, WorkflowService } from './services';

// Load environment variables
dotenv.config();

async function testWorkflow() {
  console.log('=== Testing Workflow Orchestration ===\n');

  // Validate environment variables
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
    const embeddingService = new EmbeddingService(geminiApiKey);
    const qdrantService = new QdrantService(qdrantUrl, qdrantApiKey);
    const anomalyService = new AnomalyService();
    const coachingService = new CoachingService(geminiApiKey);

    // Initialize Qdrant collection
    console.log('Initializing Qdrant collection...');
    await qdrantService.initializeCollection();

    // Create workflow service
    const workflowService = new WorkflowService(
      embeddingService,
      qdrantService,
      anomalyService,
      coachingService
    );

    // Execute workflow
    console.log('\n--- Executing Workflow ---');
    const workflowId = await workflowService.executeWorkflow();
    console.log(`Workflow started with ID: ${workflowId}`);

    // Poll for workflow completion
    console.log('\nPolling for workflow completion...');
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const status = workflowService.getWorkflowStatus(workflowId);
      
      if (!status) {
        console.error('Workflow not found!');
        break;
      }

      if (status.status === 'completed') {
        console.log('\n✓ Workflow completed successfully!');
        console.log('\n--- Results ---');
        console.log(`Risk Score: ${status.result?.riskScore}/100`);
        console.log(`\nPattern Indicators:`);
        console.log(`- Over-leverage: ${status.result?.patterns.overLeverage.detected ? 'YES' : 'NO'} (${status.result?.patterns.overLeverage.severity})`);
        console.log(`  ${status.result?.patterns.overLeverage.message}`);
        console.log(`- Profit Consistency: ${status.result?.patterns.profitConsistency.status.toUpperCase()} (Win Rate: ${status.result?.patterns.profitConsistency.winRate.toFixed(1)}%)`);
        console.log(`  ${status.result?.patterns.profitConsistency.message}`);
        console.log(`- Tilt/Revenge: ${status.result?.patterns.tiltRevenge.detected ? 'YES' : 'NO'} (${status.result?.patterns.tiltRevenge.instances} instances)`);
        console.log(`  ${status.result?.patterns.tiltRevenge.message}`);
        console.log(`- Risk/Reward Ratio: ${status.result?.patterns.riskReward.ratio.toFixed(2)}:1 (${status.result?.patterns.riskReward.status.toUpperCase()})`);
        console.log(`  ${status.result?.patterns.riskReward.message}`);
        console.log(`\nCoaching Insights:`);
        console.log(status.result?.coaching);
        break;
      } else if (status.status === 'failed') {
        console.error(`\n✗ Workflow failed at step: ${status.failedStep}`);
        console.error(`Error: ${status.error}`);
        break;
      } else {
        process.stdout.write('.');
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      console.error('\n✗ Workflow timed out');
    }

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWorkflow();
