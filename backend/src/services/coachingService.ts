import { GoogleGenerativeAI } from '@google/generative-ai';
import { CoachingContext, Trade, SimilarTrade, AnomalyResult } from '../types';

export class CoachingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini 2.5 Flash Lite - lightweight model for lower token usage
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
  }

  /**
   * Builds the prompt template combining trades, patterns, and anomalies
   * Requirements: 5.1
   */
  buildPrompt(context: CoachingContext): string {
    const { recentTrades, similarPatterns, anomalyResults } = context;

    // Format recent trades
    const recentTradesText = recentTrades
      .map(
        (t) =>
          `- ${t.symbol} ${t.direction} | Lot: ${t.lot_size} | Entry: ${t.entry} | Exit: ${t.exit} | P/L: ${t.pnl} | Time: ${t.timestamp}`
      )
      .join('\n');

    // Format similar patterns
    const similarPatternsText =
      similarPatterns.length > 0
        ? similarPatterns
            .map(
              (t) =>
                `- ${t.symbol} ${t.direction} | Lot: ${t.lot_size} | P/L: ${t.pnl} | Similarity: ${(t.similarity * 100).toFixed(1)}%`
            )
            .join('\n')
        : 'No similar historical patterns found.';

    // Format anomaly results
    const behaviorsText =
      anomalyResults.detectedBehaviors.length > 0
        ? anomalyResults.detectedBehaviors
            .map((b) => `- ${b.type} (${b.severity}): ${b.description}`)
            .join('\n')
        : 'No anomalies detected.';

    const anomalyText = `Risk Score: ${anomalyResults.riskScore}/100\nDetected Behaviors:\n${behaviorsText}`;

    // Build the complete prompt as per design document template
    const prompt = `System: You are the OrionAI Trader Performance Coach. Your job is to evaluate the trader's recent trades, analyze anomalies, and provide clear, actionable coaching advice in simple language. Always be constructive, supportive, and specific.

User: Here are the trader's last trades:
${recentTradesText}

Similar historical patterns retrieved:
${similarPatternsText}

Anomaly detection output:
${anomalyText}

Generate 3–5 concise coaching insights. Focus on risk, psychology, consistency, and practical improvements for the next session.`;

    return prompt;
  }

  /**
   * Generates personalized coaching insights using Gemini
   * Requirements: 5.1, 5.2, 5.3, 5.5
   */
  async generateCoaching(context: CoachingContext): Promise<string> {
    const prompt = this.buildPrompt(context);
    
    // Retry logic: 1 retry as per requirement 5.5
    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }

        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxAttempts) {
          // Wait before retry (exponential backoff: 1s, 2s)
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Failed to generate coaching after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }
}
