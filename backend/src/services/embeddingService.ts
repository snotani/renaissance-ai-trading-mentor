import { GoogleGenerativeAI } from '@google/generative-ai';
import { Trade } from '../types';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
  }

  /**
   * Converts a trade to a descriptive text representation
   * Requirements: 2.1
   */
  tradeToText(trade: Trade): string {
    return `${trade.symbol} ${trade.direction} trade with lot size ${trade.lot_size}, P/L: ${trade.pnl}, at ${trade.timestamp}`;
  }

  /**
   * Generates embedding for a text string
   * Requirements: 2.2
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding;
      
      if (!embedding || !embedding.values) {
        throw new Error('Invalid embedding response from Gemini API');
      }

      // Verify 768 dimensions
      if (embedding.values.length !== 768) {
        throw new Error(`Expected 768 dimensions, got ${embedding.values.length}`);
      }

      return embedding.values;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate embedding: ${error.message}`);
      }
      throw new Error('Failed to generate embedding: Unknown error');
    }
  }

  /**
   * Generates embedding for a trade
   * Requirements: 2.1, 2.2
   */
  async embedTrade(trade: Trade): Promise<number[]> {
    const text = this.tradeToText(trade);
    return this.embedText(text);
  }
}
