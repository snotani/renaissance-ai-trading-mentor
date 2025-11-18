import dotenv from 'dotenv';
import { EmbeddingService, QdrantService, AnomalyService, CoachingService } from './services';
import { Trade, CoachingContext } from './types';

dotenv.config();

async function testServices() {
  console.log('Testing Core Services...\n');

  // Test data
  const testTrade: Trade = {
    id: 'test-1',
    symbol: 'XAUUSD',
    direction: 'BUY',
    lot_size: 1.5,
    entry: 2000.50,
    exit: 2010.75,
    pnl: 150.25,
    timestamp: new Date().toISOString(),
  };

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
    {
      id: 'test-4',
      symbol: 'XAUUSD',
      direction: 'SELL',
      lot_size: 1.5,
      entry: 2010.00,
      exit: 2015.00,
      pnl: -75.00,
      timestamp: '2024-01-01T13:00:00Z',
    },
    {
      id: 'test-5',
      symbol: 'EURUSD',
      direction: 'BUY',
      lot_size: 1.0,
      entry: 1.0950,
      exit: 1.0900,
      pnl: -50.00,
      timestamp: '2024-01-01T14:00:00Z',
    },
  ];

  try {
    // Test 1: Embedding Service
    console.log('1. Testing Embedding Service...');
    const embeddingService = new EmbeddingService(process.env.GEMINI_API_KEY!);
    
    const tradeText = embeddingService.tradeToText(testTrade);
    console.log(`   Trade text: ${tradeText}`);
    
    const embedding = await embeddingService.embedTrade(testTrade);
    console.log(`   ✓ Generated embedding with ${embedding.length} dimensions`);
    console.log(`   ✓ First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

    // Test 2: Qdrant Service
    console.log('\n2. Testing Qdrant Service...');
    const qdrantService = new QdrantService(
      process.env.QDRANT_URL!,
      process.env.QDRANT_API_KEY
    );
    
    await qdrantService.initializeCollection();
    console.log('   ✓ Collection initialized');
    
    await qdrantService.storeTrade(testTrade.id, embedding, testTrade);
    console.log('   ✓ Trade stored successfully');
    
    const retrievedTrade = await qdrantService.getTradeById(testTrade.id);
    console.log(`   ✓ Trade retrieved: ${retrievedTrade?.symbol} ${retrievedTrade?.direction}`);
    
    const similarTrades = await qdrantService.findSimilarTrades(embedding, 3);
    console.log(`   ✓ Found ${similarTrades.length} similar trade(s)`);

    // Test 3: Anomaly Detection Service
    console.log('\n3. Testing Anomaly Detection Service...');
    const anomalyService = new AnomalyService();
    
    const anomalyResult = await anomalyService.detectAnomalies(testTrades);
    console.log(`   ✓ Risk Score: ${anomalyResult.riskScore}`);
    console.log(`   ✓ Detected ${anomalyResult.detectedBehaviors.length} behavior(s):`);
    
    anomalyResult.detectedBehaviors.forEach((behavior) => {
      console.log(`     - ${behavior.type} (${behavior.severity}): ${behavior.description}`);
    });

    // Test 4: Coaching Service
    console.log('\n4. Testing Coaching Service...');
    const coachingService = new CoachingService(process.env.GEMINI_API_KEY!);
    
    const coachingContext: CoachingContext = {
      recentTrades: testTrades,
      similarPatterns: similarTrades,
      anomalyResults: anomalyResult,
    };
    
    console.log('   Building prompt...');
    const prompt = coachingService.buildPrompt(coachingContext);
    console.log(`   ✓ Prompt built (${prompt.length} characters)`);
    
    console.log('   Generating coaching (this may take a few seconds)...');
    const coaching = await coachingService.generateCoaching(coachingContext);
    console.log(`   ✓ Coaching generated (${coaching.length} characters)`);
    console.log('\n   Coaching Output:');
    console.log('   ' + '='.repeat(60));
    console.log(coaching.split('\n').map(line => '   ' + line).join('\n'));
    console.log('   ' + '='.repeat(60));

    console.log('\n✅ All services tested successfully!');
  } catch (error) {
    console.error('\n❌ Error testing services:', error);
    process.exit(1);
  }
}

testServices();
