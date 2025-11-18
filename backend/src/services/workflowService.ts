import { Trade, SimilarTrade, AnomalyResult, CoachingResult, PatternIndicators } from '../types';
import { EmbeddingService } from './embeddingService';
import { QdrantService } from './qdrantService';
import { AnomalyService } from './anomalyService';
import { CoachingService } from './coachingService';
import { getRecentTrades } from '../mockData';

/**
 * Workflow status types
 */
export type WorkflowStatus = 'pending' | 'completed' | 'failed';

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  result?: CoachingResult;
  error?: string;
  failedStep?: string;
}

/**
 * Workflow step names for error tracking
 */
enum WorkflowStep {
  LoadTrades = 'LoadTrades',
  EmbedTrades = 'EmbedTrades',
  StoreTrades = 'StoreTrades',
  RetrieveSimilar = 'RetrieveSimilar',
  DetectAnomalies = 'DetectAnomalies',
  GenerateCoaching = 'GenerateCoaching',
}

/**
 * WorkflowService orchestrates the entire coaching pipeline
 * Requirements: 7.2, 9.1, 9.2, 9.3, 9.4
 */
export class WorkflowService {
  private embeddingService: EmbeddingService;
  private qdrantService: QdrantService;
  private anomalyService: AnomalyService;
  private coachingService: CoachingService;
  
  // In-memory workflow status tracking
  private workflows: Map<string, WorkflowResult> = new Map();

  constructor(
    embeddingService: EmbeddingService,
    qdrantService: QdrantService,
    anomalyService: AnomalyService,
    coachingService: CoachingService
  ) {
    this.embeddingService = embeddingService;
    this.qdrantService = qdrantService;
    this.anomalyService = anomalyService;
    this.coachingService = coachingService;
  }

  /**
   * Generates a unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Converts anomaly results to pattern indicators for UI display
   */
  private convertToPatternIndicators(anomalyResult: AnomalyResult, trades: Trade[]): PatternIndicators {
    const overLeverageBehavior = anomalyResult.detectedBehaviors.find(
      (b) => b.type === 'over-leverage'
    );
    const revengeTradingBehavior = anomalyResult.detectedBehaviors.find(
      (b) => b.type === 'revenge-trading'
    );
    const tiltBehavior = anomalyResult.detectedBehaviors.find(
      (b) => b.type === 'tilt'
    );

    // Calculate profit consistency metrics
    const profitConsistency = this.calculateProfitConsistency(trades);
    
    // Calculate risk/reward ratio
    const riskReward = this.calculateRiskReward(trades);

    return {
      overLeverage: {
        detected: !!overLeverageBehavior,
        severity: overLeverageBehavior?.severity || 'low',
        message: overLeverageBehavior?.description || 'No over-leverage detected',
      },
      profitConsistency,
      tiltRevenge: {
        detected: !!(revengeTradingBehavior || tiltBehavior),
        instances:
          (revengeTradingBehavior ? 1 : 0) + (tiltBehavior ? 1 : 0),
        message:
          revengeTradingBehavior?.description ||
          tiltBehavior?.description ||
          'No tilt or revenge trading detected',
      },
      riskReward,
    };
  }

  /**
   * Calculates profit consistency metrics
   */
  private calculateProfitConsistency(trades: Trade[]) {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    
    let status: 'excellent' | 'good' | 'poor';
    if (winRate >= 60 && profitFactor >= 2) {
      status = 'excellent';
    } else if (winRate >= 45 && profitFactor >= 1.5) {
      status = 'good';
    } else {
      status = 'poor';
    }
    
    const message = `Win rate: ${winRate.toFixed(1)}%, Profit factor: ${profitFactor.toFixed(2)}. ${
      status === 'excellent' ? 'Excellent consistency!' :
      status === 'good' ? 'Good performance, room for improvement.' :
      'Focus on improving win rate and profit factor.'
    }`;
    
    return {
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      status,
      message,
    };
  }

  /**
   * Calculates risk/reward ratio
   */
  private calculateRiskReward(trades: Trade[]) {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;
    
    const ratio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
    
    let status: 'excellent' | 'good' | 'poor';
    if (ratio >= 2) {
      status = 'excellent';
    } else if (ratio >= 1.5) {
      status = 'good';
    } else {
      status = 'poor';
    }
    
    const message = `Average win: $${avgWin.toFixed(2)}, Average loss: $${avgLoss.toFixed(2)}. ${
      status === 'excellent' ? 'Excellent risk management!' :
      status === 'good' ? 'Good risk/reward balance.' :
      'Consider improving your risk/reward ratio.'
    }`;
    
    return {
      ratio,
      status,
      message,
    };
  }

  /**
   * Executes the complete coaching workflow
   * Requirements: 7.2, 9.1, 9.2, 9.3, 9.4
   * 
   * Workflow steps:
   * 1. LoadTrades - Fetch last 10 trades
   * 2. EmbedTrades - Generate embeddings for each trade
   * 3. StoreTrades - Store embeddings in Qdrant
   * 4. RetrieveSimilar - Query Qdrant for similar patterns
   * 5. DetectAnomalies - Analyze trades for risky behaviors
   * 6. GenerateCoaching - Generate personalized coaching insights
   */
  async executeWorkflow(): Promise<string> {
    const workflowId = this.generateWorkflowId();
    
    // Initialize workflow status as pending
    this.workflows.set(workflowId, {
      workflowId,
      status: 'pending',
    });

    // Execute workflow asynchronously
    this.runWorkflow(workflowId).catch((error) => {
      console.error(`Workflow ${workflowId} failed:`, error);
    });

    return workflowId;
  }

  /**
   * Internal method to run the workflow steps
   */
  private async runWorkflow(workflowId: string): Promise<void> {
    let currentStep: WorkflowStep | null = null;

    try {
      // Step 1: LoadTrades
      currentStep = WorkflowStep.LoadTrades;
      console.log(`[${workflowId}] Step 1: Loading trades...`);
      const recentTrades = await this.loadTrades();
      console.log(`[${workflowId}] Loaded ${recentTrades.length} trades`);

      // Step 2: EmbedTrades
      currentStep = WorkflowStep.EmbedTrades;
      console.log(`[${workflowId}] Step 2: Generating embeddings...`);
      const embeddings = await this.embedTrades(recentTrades);
      console.log(`[${workflowId}] Generated ${embeddings.length} embeddings`);

      // Step 3: StoreTrades
      currentStep = WorkflowStep.StoreTrades;
      console.log(`[${workflowId}] Step 3: Storing trades in Qdrant...`);
      await this.storeTrades(recentTrades, embeddings);
      console.log(`[${workflowId}] Stored ${recentTrades.length} trades`);

      // Step 4: RetrieveSimilar
      currentStep = WorkflowStep.RetrieveSimilar;
      console.log(`[${workflowId}] Step 4: Retrieving similar trades...`);
      const similarTrades = await this.retrieveSimilarTrades(embeddings[0]);
      console.log(`[${workflowId}] Found ${similarTrades.length} similar trades`);

      // Step 5: DetectAnomalies
      currentStep = WorkflowStep.DetectAnomalies;
      console.log(`[${workflowId}] Step 5: Detecting anomalies...`);
      const anomalyResults = await this.detectAnomalies(recentTrades);
      console.log(
        `[${workflowId}] Detected ${anomalyResults.detectedBehaviors.length} behaviors, risk score: ${anomalyResults.riskScore}`
      );

      // Step 6: GenerateCoaching
      currentStep = WorkflowStep.GenerateCoaching;
      console.log(`[${workflowId}] Step 6: Generating coaching...`);
      const coaching = await this.generateCoaching(
        recentTrades,
        similarTrades,
        anomalyResults
      );
      console.log(`[${workflowId}] Generated coaching insights`);

      // Build final result
      const result: CoachingResult = {
        coaching,
        patterns: this.convertToPatternIndicators(anomalyResults, recentTrades),
        riskScore: anomalyResults.riskScore,
        timestamp: new Date().toISOString(),
      };

      // Update workflow status to completed
      this.workflows.set(workflowId, {
        workflowId,
        status: 'completed',
        result,
      });

      console.log(`[${workflowId}] Workflow completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update workflow status to failed
      this.workflows.set(workflowId, {
        workflowId,
        status: 'failed',
        error: errorMessage,
        failedStep: currentStep || 'Unknown',
      });

      console.error(`[${workflowId}] Workflow failed at step ${currentStep}:`, errorMessage);
    }
  }

  /**
   * Step 1: Load recent trades
   * Requirements: 9.1, 9.2
   */
  private async loadTrades(): Promise<Trade[]> {
    try {
      const trades = getRecentTrades(10);
      
      if (trades.length === 0) {
        throw new Error('No trades available');
      }

      return trades;
    } catch (error) {
      throw new Error(
        `LoadTrades failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Step 2: Generate embeddings for all trades
   * Requirements: 9.1, 9.2
   */
  private async embedTrades(trades: Trade[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];

      for (const trade of trades) {
        const embedding = await this.embeddingService.embedTrade(trade);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      throw new Error(
        `EmbedTrades failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Step 3: Store trades with embeddings in Qdrant
   * Requirements: 9.1, 9.2
   */
  private async storeTrades(trades: Trade[], embeddings: number[][]): Promise<void> {
    try {
      if (trades.length !== embeddings.length) {
        throw new Error('Mismatch between trades and embeddings count');
      }

      for (let i = 0; i < trades.length; i++) {
        await this.qdrantService.storeTrade(trades[i].id, embeddings[i], trades[i]);
      }
    } catch (error) {
      throw new Error(
        `StoreTrades failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Step 4: Retrieve similar trades from Qdrant
   * Requirements: 9.1, 9.2
   */
  private async retrieveSimilarTrades(embedding: number[]): Promise<SimilarTrade[]> {
    try {
      const similarTrades = await this.qdrantService.findSimilarTrades(embedding, 5);
      return similarTrades;
    } catch (error) {
      throw new Error(
        `RetrieveSimilar failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Step 5: Detect anomalies in trading behavior
   * Requirements: 9.1, 9.2
   */
  private async detectAnomalies(trades: Trade[]): Promise<AnomalyResult> {
    try {
      const anomalyResults = await this.anomalyService.detectAnomalies(trades);
      return anomalyResults;
    } catch (error) {
      throw new Error(
        `DetectAnomalies failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Step 6: Generate coaching insights
   * Requirements: 9.1, 9.2
   */
  private async generateCoaching(
    recentTrades: Trade[],
    similarPatterns: SimilarTrade[],
    anomalyResults: AnomalyResult
  ): Promise<string> {
    try {
      const coaching = await this.coachingService.generateCoaching({
        recentTrades,
        similarPatterns,
        anomalyResults,
      });

      return coaching;
    } catch (error) {
      throw new Error(
        `GenerateCoaching failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the status of a workflow
   * Requirements: 7.2
   */
  getWorkflowStatus(workflowId: string): WorkflowResult | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Gets all workflow statuses (for debugging)
   */
  getAllWorkflows(): WorkflowResult[] {
    return Array.from(this.workflows.values());
  }
}
