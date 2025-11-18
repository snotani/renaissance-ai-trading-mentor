import { Trade, AnomalyResult, Behavior } from '../types';

export class AnomalyService {
  /**
   * Detects anomalies in trading behavior
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async detectAnomalies(trades: Trade[]): Promise<AnomalyResult> {
    if (trades.length === 0) {
      return {
        riskScore: 0,
        detectedBehaviors: [],
      };
    }

    const behaviors: Behavior[] = [];
    
    // Detect over-leverage
    const overLeverageBehavior = this.detectOverLeverage(trades);
    if (overLeverageBehavior) {
      behaviors.push(overLeverageBehavior);
    }

    // Detect revenge trading
    const revengeTradingBehavior = this.detectRevengeTrading(trades);
    if (revengeTradingBehavior) {
      behaviors.push(revengeTradingBehavior);
    }

    // Detect tilt
    const tiltBehavior = this.detectTilt(trades);
    if (tiltBehavior) {
      behaviors.push(tiltBehavior);
    }

    // Calculate risk score based on detected behaviors
    const riskScore = this.calculateRiskScore(behaviors);

    return {
      riskScore,
      detectedBehaviors: behaviors,
    };
  }

  /**
   * Detects over-leverage: lot size > 2x average
   * Requirements: 4.3
   */
  private detectOverLeverage(trades: Trade[]): Behavior | null {
    if (trades.length === 0) return null;

    const avgLotSize = trades.reduce((sum, t) => sum + t.lot_size, 0) / trades.length;
    const threshold = avgLotSize * 2;

    const overLeveragedTrades = trades.filter(t => t.lot_size > threshold);

    if (overLeveragedTrades.length === 0) return null;

    const maxLotSize = Math.max(...overLeveragedTrades.map(t => t.lot_size));
    const ratio = maxLotSize / avgLotSize;

    let severity: 'low' | 'medium' | 'high';
    if (ratio > 4) {
      severity = 'high';
    } else if (ratio > 3) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      type: 'over-leverage',
      severity,
      description: `Detected ${overLeveragedTrades.length} trade(s) with lot size exceeding 2x average (${avgLotSize.toFixed(2)}). Maximum lot size: ${maxLotSize.toFixed(2)}.`,
    };
  }

  /**
   * Detects revenge trading: lot size increase after loss
   * Requirements: 4.3
   */
  private detectRevengeTrading(trades: Trade[]): Behavior | null {
    if (trades.length < 2) return null;

    // Sort trades by timestamp to ensure chronological order
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let revengeInstances = 0;
    let maxIncrease = 0;

    for (let i = 1; i < sortedTrades.length; i++) {
      const prevTrade = sortedTrades[i - 1];
      const currentTrade = sortedTrades[i];

      // Check if previous trade was a loss and current lot size increased
      if (prevTrade.pnl < 0 && currentTrade.lot_size > prevTrade.lot_size) {
        revengeInstances++;
        const increase = currentTrade.lot_size / prevTrade.lot_size;
        maxIncrease = Math.max(maxIncrease, increase);
      }
    }

    if (revengeInstances === 0) return null;

    let severity: 'low' | 'medium' | 'high';
    if (revengeInstances >= 3 || maxIncrease > 2) {
      severity = 'high';
    } else if (revengeInstances >= 2 || maxIncrease > 1.5) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      type: 'revenge-trading',
      severity,
      description: `Detected ${revengeInstances} instance(s) of revenge trading (increasing lot size after losses). Maximum increase: ${maxIncrease.toFixed(2)}x.`,
    };
  }

  /**
   * Detects tilt: 3+ consecutive losses
   * Requirements: 4.3
   */
  private detectTilt(trades: Trade[]): Behavior | null {
    if (trades.length < 3) return null;

    // Sort trades by timestamp to ensure chronological order
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let maxConsecutiveLosses = 0;
    let currentConsecutiveLosses = 0;

    for (const trade of sortedTrades) {
      if (trade.pnl < 0) {
        currentConsecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
      } else {
        currentConsecutiveLosses = 0;
      }
    }

    if (maxConsecutiveLosses < 3) return null;

    let severity: 'low' | 'medium' | 'high';
    if (maxConsecutiveLosses >= 5) {
      severity = 'high';
    } else if (maxConsecutiveLosses >= 4) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      type: 'tilt',
      severity,
      description: `Detected tilt behavior with ${maxConsecutiveLosses} consecutive losses. This may indicate emotional trading.`,
    };
  }

  /**
   * Calculates overall risk score based on detected behaviors
   * Requirements: 4.4
   */
  private calculateRiskScore(behaviors: Behavior[]): number {
    if (behaviors.length === 0) return 0;

    let score = 0;

    for (const behavior of behaviors) {
      let behaviorScore = 0;

      // Base score by behavior type
      switch (behavior.type) {
        case 'over-leverage':
          behaviorScore = 30;
          break;
        case 'revenge-trading':
          behaviorScore = 35;
          break;
        case 'tilt':
          behaviorScore = 25;
          break;
        case 'volatility-mismatch':
          behaviorScore = 20;
          break;
      }

      // Multiply by severity
      switch (behavior.severity) {
        case 'low':
          behaviorScore *= 0.5;
          break;
        case 'medium':
          behaviorScore *= 1.0;
          break;
        case 'high':
          behaviorScore *= 1.5;
          break;
      }

      score += behaviorScore;
    }

    // Cap at 100
    return Math.min(Math.round(score), 100);
  }
}
