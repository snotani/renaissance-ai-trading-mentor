import { Trade } from './types';
import { validateTrades } from './validation';
import mockTradesData from './mockTrades.json';

/**
 * Loads and validates mock trade data
 * @returns Array of validated Trade objects
 */
export function loadMockTrades(): Trade[] {
  try {
    const validatedTrades = validateTrades(mockTradesData);
    console.log(`Loaded ${validatedTrades.length} valid trades from mock data`);
    return validatedTrades;
  } catch (error) {
    console.error('Error loading mock trades:', error);
    throw new Error('Failed to load mock trade data');
  }
}

/**
 * Gets the most recent N trades sorted by timestamp (descending)
 * @param count - Number of recent trades to return (default: 10)
 * @returns Array of most recent trades
 */
export function getRecentTrades(count: number = 10): Trade[] {
  const trades = loadMockTrades();
  
  // Sort by timestamp descending (most recent first)
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Return the requested number of trades
  return sortedTrades.slice(0, count);
}

/**
 * Gets all mock trades
 * @returns Array of all mock trades
 */
export function getAllMockTrades(): Trade[] {
  return loadMockTrades();
}
