// Core data types for the frontend (matching backend types)

export interface Trade {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  lot_size: number;
  entry: number;
  exit: number;
  pnl: number;
  timestamp: string;
}

export interface SimilarTrade extends Trade {
  similarity: number;
}

export interface Behavior {
  type: 'over-leverage' | 'revenge-trading' | 'tilt' | 'volatility-mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AnomalyResult {
  riskScore: number;
  detectedBehaviors: Behavior[];
}

export interface PatternIndicators {
  overLeverage: {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
  };
  profitConsistency: {
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    status: 'excellent' | 'good' | 'poor';
    message: string;
  };
  tiltRevenge: {
    detected: boolean;
    instances: number;
    message: string;
  };
  riskReward: {
    ratio: number;
    status: 'excellent' | 'good' | 'poor';
    message: string;
  };
}

export interface CoachingResult {
  coaching: string;
  patterns: PatternIndicators;
  riskScore: number;
  timestamp: string;
}

export interface WorkflowStatus {
  status: 'pending' | 'completed' | 'failed';
  result?: CoachingResult;
  error?: string;
}
