interface CoachingOutputProps {
  coaching: string | null;
  isLoading: boolean;
  riskScore?: number;
}

export function CoachingOutput({ coaching, isLoading, riskScore }: CoachingOutputProps) {
  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const getRiskScoreBg = (score: number) => {
    if (score < 30) return 'bg-green-500/10 border-green-500/30';
    if (score < 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  // Parse coaching text into structured insights
  const parseCoaching = (text: string) => {
    // Split by numbered points (1., 2., 3., etc.) or bullet points
    const sections = text.split(/(?:\d+\.|•|\*\*|\n\n)/g).filter(s => s.trim());
    
    // Try to identify insights by common patterns
    const insights: { title: string; content: string; icon: string }[] = [];
    
    sections.forEach(section => {
      const trimmed = section.trim();
      if (trimmed.length < 10) return; // Skip very short sections
      
      // Detect insight type based on keywords
      let icon = '💡';
      let title = 'Insight';
      
      if (trimmed.toLowerCase().includes('risk') || trimmed.toLowerCase().includes('danger')) {
        icon = '⚠️';
        title = 'Risk Management';
      } else if (trimmed.toLowerCase().includes('psychology') || trimmed.toLowerCase().includes('emotion')) {
        icon = '🧠';
        title = 'Trading Psychology';
      } else if (trimmed.toLowerCase().includes('consistency') || trimmed.toLowerCase().includes('discipline')) {
        icon = '🎯';
        title = 'Consistency';
      } else if (trimmed.toLowerCase().includes('improve') || trimmed.toLowerCase().includes('action')) {
        icon = '🚀';
        title = 'Action Item';
      } else if (trimmed.toLowerCase().includes('pattern') || trimmed.toLowerCase().includes('behavior')) {
        icon = '📊';
        title = 'Pattern Analysis';
      }
      
      insights.push({ title, content: trimmed, icon });
    });
    
    return insights.length > 0 ? insights : [{ title: 'Coaching Insight', content: text, icon: '💡' }];
  };

  const insights = coaching ? parseCoaching(coaching) : [];

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">AI Coaching Insights</h2>
        </div>
        {riskScore !== undefined && (
          <div className={`px-4 py-3 rounded-lg border ${getRiskScoreBg(riskScore)}`}>
            <div className="text-xs text-gray-400 mb-1">Risk Score</div>
            <div className={`text-3xl font-bold ${getRiskScoreColor(riskScore)}`}>
              {riskScore.toFixed(0)}
              <span className="text-sm font-normal text-gray-500">/100</span>
            </div>
            <div className={`text-xs font-semibold ${getRiskScoreColor(riskScore)}`}>
              {getRiskScoreLabel(riskScore)}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-blue-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-300 mt-6 text-lg font-medium">Analyzing your trading patterns...</p>
          <p className="text-sm text-gray-500 mt-2">AI is processing your data</p>
        </div>
      ) : coaching ? (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-5 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-1">{insight.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">{insight.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{insight.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No coaching available</h3>
          <p className="text-sm text-gray-500">
            Click the "Get Coaching" button to receive personalized insights
          </p>
        </div>
      )}
    </div>
  );
}
