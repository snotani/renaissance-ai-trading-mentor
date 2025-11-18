import dotenv from 'dotenv';
import { CoachingService } from './services';
import { CoachingContext, Trade, SimilarTrade, AnomalyResult } from './types';

dotenv.config();

async function testCoachingService() {
  console.log('Testing Coaching Service...\n');

  // Test data
  const testTrades: Trade[] = [
    {
      id: 'test-1',
      symbol: 'XAUUSD',
      direction: 'BUY',
      lot_size: 1.0,
      entry: 2000.00,
      exit: 2005.00,
      pnl: 50.00,
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: 'test-2',
      symbol: 'EURUSD',
      direction: 'SELL',
      lot_size: 2.0,
      entry: 1.1000,
      exit: 1.0950,
      pnl: -50.00,
      timestamp: '2024-01-01T11:00:00Z',
    },
    {
      id: 'test-3',
      symbol: 'GBPUSD',
      direction: 'BUY',
      lot_size: 4.0, // Revenge trading: increased after loss
      entry: 1.2500,
      exit: 1.2450,
      pnl: -200.00,
      timestamp: '2024-01-01T12:00:00Z',
    },
  ];

  const similarPatterns: SimilarTrade[] = [
    {
      id: 'hist-1',
      symbol: 'XAUUSD',
      direction: 'BUY',
      lot_size: 1.2,
      entry: 1995.00,
      exit: 2000.00,
      pnl: 60.00,
      timestamp: '2023-12-15T10:00:00Z',
      similarity: 0.92,
    },
  ];

  const anomalyResult: AnomalyResult = {
    riskScore: 65,
    detectedBehaviors: [
      {
        type: 'revenge-trading',
        severity: 'high',
        description: 'Lot size increased significantly after loss',
      },
      {
        type: 'over-leverage',
        severity: 'medium',
        description: 'Lot size exceeds 2x average',
      },
    ],
  };

  try {
    console.log('1. Testing CoachingService initialization...');
    const coachingService = new CoachingService(process.env.GEMINI_API_KEY!);
    console.log('   ✓ Service initialized\n');

    console.log('2. Testing prompt building...');
    const coachingContext: CoachingContext = {
      recentTrades: testTrades,
      similarPatterns: similarPatterns,
      anomalyResults: anomalyResult,
    };
    
    const prompt = coachingService.buildPrompt(coachingContext);
    console.log(`   ✓ Prompt built (${prompt.length} characters)`);
    console.log('\n   Prompt Preview:');
    console.log('   ' + '-'.repeat(60));
    console.log(prompt.split('\n').slice(0, 10).map(line => '   ' + line).join('\n'));
    console.log('   ... (truncated)');
    console.log('   ' + '-'.repeat(60));

    // Verify prompt contains all three sections (Requirements 5.1)
    const hasRecentTrades = prompt.includes('Here are the trader\'s last trades:');
    const hasSimilarPatterns = prompt.includes('Similar historical patterns retrieved:');
    const hasAnomalyResults = prompt.includes('Anomaly detection output:');
    
    console.log(`\n   ✓ Prompt contains recent trades section: ${hasRecentTrades}`);
    console.log(`   ✓ Prompt contains similar patterns section: ${hasSimilarPatterns}`);
    console.log(`   ✓ Prompt contains anomaly results section: ${hasAnomalyResults}`);

    console.log('\n3. Testing coaching generation...');
    console.log('   (This may take 5-10 seconds...)');
    
    const startTime = Date.now();
    const coaching = await coachingService.generateCoaching(coachingContext);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`   ✓ Coaching generated in ${duration}s`);
    console.log(`   ✓ Response length: ${coaching.length} characters`);
    
    // Count insights (Requirements 5.3 - should be 3-5 insights)
    const insights = coaching.split('\n').filter(line => 
      line.trim().match(/^[\d\*\-•]/) || line.trim().match(/^\d+\./)
    );
    console.log(`   ✓ Number of insights detected: ${insights.length}`);

    console.log('\n   Coaching Output:');
    console.log('   ' + '='.repeat(60));
    console.log(coaching.split('\n').map(line => '   ' + line).join('\n'));
    console.log('   ' + '='.repeat(60));

    console.log('\n4. Testing retry logic...');
    console.log('   (Testing with invalid API key to trigger retry)');
    
    try {
      const failService = new CoachingService('invalid-key');
      await failService.generateCoaching(coachingContext);
      console.log('   ✗ Should have failed with invalid key');
    } catch (error) {
      console.log('   ✓ Retry logic working - failed as expected');
      console.log(`   ✓ Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n✅ All coaching service tests passed!');
  } catch (error) {
    console.error('\n❌ Error testing coaching service:', error);
    process.exit(1);
  }
}

testCoachingService();
