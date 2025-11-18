// Core data types for the Trader Performance Agent

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
  tradeFrequency: {
    tradesPerHour: number;
    status: 'normal' | 'elevated' | 'excessive';
  };
  tiltRevenge: {
    detected: boolean;
    instances: number;
    message: string;
  };
  volatilityMismatch: {
    detected: boolean;
    message: string;
  };
}

export interface CoachingResult {
  coaching: string;
  patterns: PatternIndicators;
  riskScore: number;
  timestamp: string;
}

export interface CoachingContext {
  recentTrades: Trade[];
  similarPatterns: SimilarTrade[];
  anomalyResults: AnomalyResult;
}
