import { Trade } from './types';

/**
 * Validation error class for trade validation failures
 */
export class TradeValidationError extends Error {
  constructor(
    message: string,
    public tradeId?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'TradeValidationError';
  }
}

/**
 * Validates that a trade object contains all required fields with correct types
 * @param trade - The trade object to validate
 * @returns true if valid
 * @throws TradeValidationError if validation fails
 */
export function validateTrade(trade: any): trade is Trade {
  const requiredFields = [
    'id',
    'symbol',
    'direction',
    'lot_size',
    'entry',
    'exit',
    'pnl',
    'timestamp'
  ];

  // Check if trade is an object
  if (!trade || typeof trade !== 'object') {
    throw new TradeValidationError('Trade must be an object');
  }

  // Check for missing fields
  const missingFields = requiredFields.filter(field => !(field in trade));
  if (missingFields.length > 0) {
    throw new TradeValidationError(
      `Trade is missing required fields: ${missingFields.join(', ')}`,
      trade.id,
      missingFields
    );
  }

  // Validate field types
  if (typeof trade.id !== 'string' || trade.id.trim() === '') {
    throw new TradeValidationError('Trade id must be a non-empty string', trade.id);
  }

  if (typeof trade.symbol !== 'string' || trade.symbol.trim() === '') {
    throw new TradeValidationError('Trade symbol must be a non-empty string', trade.id);
  }

  if (trade.direction !== 'BUY' && trade.direction !== 'SELL') {
    throw new TradeValidationError(
      'Trade direction must be either "BUY" or "SELL"',
      trade.id
    );
  }

  if (typeof trade.lot_size !== 'number' || trade.lot_size <= 0) {
    throw new TradeValidationError(
      'Trade lot_size must be a positive number',
      trade.id
    );
  }

  if (typeof trade.entry !== 'number') {
    throw new TradeValidationError('Trade entry must be a number', trade.id);
  }

  if (typeof trade.exit !== 'number') {
    throw new TradeValidationError('Trade exit must be a number', trade.id);
  }

  if (typeof trade.pnl !== 'number') {
    throw new TradeValidationError('Trade pnl must be a number', trade.id);
  }

  if (typeof trade.timestamp !== 'string') {
    throw new TradeValidationError('Trade timestamp must be a string', trade.id);
  }

  // Validate timestamp is a valid ISO 8601 date
  const date = new Date(trade.timestamp);
  if (isNaN(date.getTime())) {
    throw new TradeValidationError(
      'Trade timestamp must be a valid ISO 8601 date string',
      trade.id
    );
  }

  return true;
}

/**
 * Validates an array of trades, filtering out invalid ones and logging errors
 * @param trades - Array of trade objects to validate
 * @returns Array of valid trades
 */
export function validateTrades(trades: any[]): Trade[] {
  if (!Array.isArray(trades)) {
    throw new Error('Trades must be an array');
  }

  const validTrades: Trade[] = [];
  const errors: string[] = [];

  for (const trade of trades) {
    try {
      if (validateTrade(trade)) {
        validTrades.push(trade as Trade);
      }
    } catch (error) {
      if (error instanceof TradeValidationError) {
        errors.push(`Trade ${error.tradeId || 'unknown'}: ${error.message}`);
        console.error(`Validation error for trade ${error.tradeId}:`, error.message);
      } else {
        errors.push(`Unknown error: ${error}`);
        console.error('Unknown validation error:', error);
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} trade(s) failed validation`);
  }

  return validTrades;
}
