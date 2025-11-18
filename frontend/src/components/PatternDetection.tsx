import type { PatternIndicators } from '../types';

interface PatternDetectionProps {
  patterns: PatternIndicators | null;
}

export function PatternDetection({ patterns }: PatternDetectionProps) {
  if (!patterns) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Pattern Detection</h2>
        <p className="text-gray-400">No pattern data available. Click "Get Coaching" to analyze.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
  };

  const getPerformanceColor = (status: 'excellent' | 'good' | 'poor') => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'good':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'poor':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
  };

  const getIcon = (detected: boolean) => {
    return detected ? '🔴' : '✅';
  };

  const getPerformanceIcon = (status: 'excellent' | 'good' | 'poor') => {
    switch (status) {
      case 'excellent':
        return '🌟';
      case 'good':
        return '👍';
      case 'poor':
        return '⚠️';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Pattern Detection</h2>
      </div>
      
      <div className="space-y-3">
        {/* Over-Leverage Indicator */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getIcon(patterns.overLeverage.detected)}</span>
              <h3 className="font-semibold text-gray-200">Over-Leverage Alert</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                patterns.overLeverage.detected
                  ? getSeverityColor(patterns.overLeverage.severity)
                  : 'bg-gray-700/50 text-gray-400 border-gray-600'
              }`}
            >
              {patterns.overLeverage.detected
                ? patterns.overLeverage.severity.toUpperCase()
                : 'NONE'}
            </span>
          </div>
          <p className="text-sm text-gray-400 ml-7">{patterns.overLeverage.message}</p>
        </div>

        {/* Profit Consistency Indicator */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getPerformanceIcon(patterns.profitConsistency.status)}</span>
              <h3 className="font-semibold text-gray-200">Profit Consistency</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(
                patterns.profitConsistency.status
              )}`}
            >
              {patterns.profitConsistency.status.toUpperCase()}
            </span>
          </div>
          <div className="ml-7 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-gray-300 font-medium">{patterns.profitConsistency.winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Profit Factor:</span>
              <span className="text-gray-300 font-medium">{patterns.profitConsistency.profitFactor.toFixed(2)}</span>
            </div>
            <div className="mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  patterns.profitConsistency.status === 'excellent'
                    ? 'bg-green-500'
                    : patterns.profitConsistency.status === 'good'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(patterns.profitConsistency.winRate, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tilt/Revenge Trading Indicator */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getIcon(patterns.tiltRevenge.detected)}</span>
              <h3 className="font-semibold text-gray-200">Tilt/Revenge Trading</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                patterns.tiltRevenge.detected
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-green-500/10 text-green-400 border-green-500/30'
              }`}
            >
              {patterns.tiltRevenge.detected ? 'DETECTED' : 'NONE'}
            </span>
          </div>
          <p className="text-sm text-gray-400 ml-7">
            {patterns.tiltRevenge.detected
              ? `${patterns.tiltRevenge.instances} instance(s) detected. ${patterns.tiltRevenge.message}`
              : patterns.tiltRevenge.message}
          </p>
        </div>

        {/* Risk/Reward Ratio Indicator */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getPerformanceIcon(patterns.riskReward.status)}</span>
              <h3 className="font-semibold text-gray-200">Risk/Reward Ratio</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(
                patterns.riskReward.status
              )}`}
            >
              {patterns.riskReward.status.toUpperCase()}
            </span>
          </div>
          <div className="ml-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-purple-400">{patterns.riskReward.ratio.toFixed(2)}</span>
              <span className="text-sm text-gray-500">: 1</span>
            </div>
            <p className="text-sm text-gray-400">{patterns.riskReward.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
