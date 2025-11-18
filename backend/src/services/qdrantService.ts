import { QdrantClient } from '@qdrant/js-client-rest';
import { Trade, SimilarTrade } from '../types';

export class QdrantService {
  private client: QdrantClient;
  private collectionName = 'trades';
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(url: string, apiKey?: string) {
    if (!url) {
      throw new Error('Qdrant URL is required');
    }
    
    this.client = new QdrantClient({
      url,
      apiKey,
    });
  }

  /**
   * Initializes the Qdrant collection with proper configuration
   * Requirements: 2.3
   */
  async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!exists) {
        // Create collection with 768 dimensions and cosine distance
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: 'Cosine',
          },
        });
        console.log(`Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`Qdrant collection already exists: ${this.collectionName}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize Qdrant collection: ${error.message}`);
      }
      throw new Error('Failed to initialize Qdrant collection: Unknown error');
    }
  }

  /**
   * Converts a string ID to a numeric ID for Qdrant
   * Uses a simple hash function to convert string to number
   */
  private stringToNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure positive number
    return Math.abs(hash);
  }

  /**
   * Stores a trade with its embedding vector in Qdrant with retry logic
   * Requirements: 2.3, 2.4, 2.5
   */
  async storeTrade(tradeId: string, vector: number[], metadata: Trade): Promise<void> {
    let lastError: Error | null = null;
    
    // Convert string ID to numeric ID for Qdrant
    const numericId = this.stringToNumericId(tradeId);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.client.upsert(this.collectionName, {
          wait: true,
          points: [
            {
              id: numericId,
              vector,
              payload: {
                id: metadata.id,
                symbol: metadata.symbol,
                direction: metadata.direction,
                lot_size: metadata.lot_size,
                entry: metadata.entry,
                exit: metadata.exit,
                pnl: metadata.pnl,
                timestamp: metadata.timestamp,
              },
            },
          ],
        });
        
        console.log(`Successfully stored trade ${tradeId} (numeric ID: ${numericId}) in Qdrant`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Attempt ${attempt}/${this.maxRetries} failed for trade ${tradeId}:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to store trade after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Finds similar trades based on vector similarity
   * Requirements: 3.1, 3.2, 3.3
   */
  async findSimilarTrades(vector: number[], limit: number = 5): Promise<SimilarTrade[]> {
    try {
      const searchResult = await this.client.search(this.collectionName, {
        vector,
        limit,
        with_payload: true,
      });

      return searchResult.map((result) => {
        const payload = result.payload as any;
        return {
          id: payload.id,
          symbol: payload.symbol,
          direction: payload.direction,
          lot_size: payload.lot_size,
          entry: payload.entry,
          exit: payload.exit,
          pnl: payload.pnl,
          timestamp: payload.timestamp,
          similarity: result.score || 0,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find similar trades: ${error.message}`);
      }
      throw new Error('Failed to find similar trades: Unknown error');
    }
  }

  /**
   * Retrieves a trade by ID
   */
  async getTradeById(tradeId: string): Promise<Trade | null> {
    try {
      const numericId = this.stringToNumericId(tradeId);
      const result = await this.client.retrieve(this.collectionName, {
        ids: [numericId],
        with_payload: true,
      });

      if (result.length === 0) {
        return null;
      }

      const payload = result[0].payload as any;
      return {
        id: payload.id,
        symbol: payload.symbol,
        direction: payload.direction,
        lot_size: payload.lot_size,
        entry: payload.entry,
        exit: payload.exit,
        pnl: payload.pnl,
        timestamp: payload.timestamp,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve trade: ${error.message}`);
      }
      throw new Error('Failed to retrieve trade: Unknown error');
    }
  }
}
