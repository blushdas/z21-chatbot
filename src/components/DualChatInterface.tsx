import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import { DualResponseComparison } from './DualResponseComparison';
import { DualResponseModeToggle } from './ComparisonModeToggle';

interface DualChatInterfaceProps {
  // Inherit from ChatInterface but extend for dual mode
}

export const DualChatInterface: React.FC<DualChatInterfaceProps> = () => {
  const [dualResponseMode, setDualResponseMode] = useState(false);
  const [pendingComparison, setPendingComparison] = useState<{
    responseA: string;
    responseB: string;
    sourceA?: any[];
    sourceB?: any[];
  } | null>(null);

  // Mock dual responses for testing - replace with actual API calls
  const mockDualResponse = {
    responseA: "Response A: This is the first version of the answer. It provides a detailed explanation with comprehensive coverage of the topic, including multiple perspectives and thorough analysis.",
    responseB: "Response B: This is the second version of the answer. It offers a more concise approach with focused insights and practical examples, emphasizing actionable takeaways.",
    sourceA: [{ title: "Source 1A", url: "example.com" }],
    sourceB: [{ title: "Source 1B", url: "example.com" }]
  };

  const handlePreferenceSelect = (preference: 'a' | 'b' | 'tie') => {
    // Here you would send the feedback to your analytics system
    setPendingComparison(null);
  };

  const simulateDualResponse = () => {
    // Simulate getting dual responses
    setPendingComparison(mockDualResponse);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dual Response Mode Toggle */}
      <div className="p-4 border-b">
        <DualResponseModeToggle
          enabled={dualResponseMode}
          onToggle={setDualResponseMode}
        />
        
        {dualResponseMode && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800 font-medium">
              ✨ Dual Response Mode Active
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Your next message will generate two different responses. Choose the one that works best for you!
            </div>
            <button 
              onClick={simulateDualResponse}
              className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
            >
              Preview with sample responses
            </button>
          </div>
        )}
      </div>

      {/* Dual Response Comparison */}
      {pendingComparison && (
        <div className="p-4 border-b bg-muted/30">
          <DualResponseComparison
            responseA={pendingComparison.responseA}
            responseB={pendingComparison.responseB}
            sourceA={pendingComparison.sourceA}
            sourceB={pendingComparison.sourceB}
            onPreferenceSelect={handlePreferenceSelect}
            showModelNames={true}
          />
        </div>
      )}

      {/* Regular Chat Interface */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
};