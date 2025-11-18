import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Trade, CoachingResult, WorkflowStatus } from '../types';
import { TradesTable } from '../components/TradesTable';
import { PatternDetection } from '../components/PatternDetection';
import { CoachingOutput } from '../components/CoachingOutput';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [coachingResult, setCoachingResult] = useState<CoachingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Load trades on component mount
  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoadingTrades(true);
      const response = await axios.get<{ trades: Trade[] }>(`${API_BASE_URL}/api/trades`);
      setTrades(response.data.trades);
      setError(null);
    } catch (err) {
      console.error('Error loading trades:', err);
      setError('Failed to load trades. Please check if the backend is running.');
    } finally {
      setLoadingTrades(false);
    }
  };

  const handleGetCoaching = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Trigger the workflow
      const triggerResponse = await axios.post<{ workflowId: string }>(
        `${API_BASE_URL}/api/coaching/trigger`
      );
      const { workflowId } = triggerResponse.data;

      // Poll for workflow completion
      const pollInterval = 2000; // Poll every 2 seconds
      const maxAttempts = 30; // Maximum 60 seconds
      let attempts = 0;

      const poll = async (): Promise<void> => {
        attempts++;

        if (attempts > maxAttempts) {
          throw new Error('Workflow timeout: Analysis took too long');
        }

        const statusResponse = await axios.get<WorkflowStatus>(
          `${API_BASE_URL}/api/coaching/status/${workflowId}`
        );

        if (statusResponse.data.status === 'completed') {
          if (statusResponse.data.result) {
            setCoachingResult(statusResponse.data.result);
            setIsLoading(false);
          } else {
            throw new Error('Workflow completed but no result returned');
          }
        } else if (statusResponse.data.status === 'failed') {
          throw new Error(statusResponse.data.error || 'Workflow failed');
        } else {
          // Still pending, continue polling
          setTimeout(poll, pollInterval);
        }
      };

      await poll();
    } catch (err: unknown) {
      console.error('Error getting coaching:', err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to get coaching. Please try again.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Renaissance AI Coach</h1>
                <p className="text-sm text-gray-400 mt-1">
                  AI-Powered Trading Performance Analysis
                </p>
              </div>
            </div>
            <button
              onClick={handleGetCoaching}
              disabled={isLoading || loadingTrades}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${
                isLoading || loadingTrades
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Get Coaching'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trades - Full width on mobile, 2 columns on desktop */}
          <div className="lg:col-span-2">
            {loadingTrades ? (
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500"></div>
                </div>
              </div>
            ) : (
              <TradesTable trades={trades} />
            )}
          </div>

          {/* Pattern Detection - 1 column */}
          <div className="lg:col-span-1">
            <PatternDetection patterns={coachingResult?.patterns || null} />
          </div>

          {/* Coaching Output - Full width */}
          <div className="lg:col-span-3">
            <CoachingOutput
              coaching={coachingResult?.coaching || null}
              isLoading={isLoading}
              riskScore={coachingResult?.riskScore}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
