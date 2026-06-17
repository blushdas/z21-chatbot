import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Crown, Trophy, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useSourceDrawer } from '@/hooks/useSourceDrawer';

interface DualResponseComparisonProps {
  responseA: string;
  responseB: string;
  sourceA?: any[];
  sourceB?: any[];
  citationA?: string;
  citationB?: string;
  onPreferenceSelect: (preference: 'a' | 'b' | 'tie') => void;
  showModelNames?: boolean;
  modelNameA?: string;
  modelNameB?: string;
}

export const DualResponseComparison: React.FC<DualResponseComparisonProps> = ({
  responseA,
  responseB,
  sourceA = [],
  sourceB = [],
  citationA,
  citationB,
  onPreferenceSelect,
  showModelNames = false, // Hide model names by default to avoid bias
  modelNameA,
  modelNameB
}) => {
  const [selectedPreference, setSelectedPreference] = useState<'a' | 'b' | 'tie' | null>(null);
  const [showComparison, setShowComparison] = useState(true);

  const { openSourceDrawer } = useSourceDrawer();
  const viewSources = (sources: any[] = []) => {
    if (!sources || sources.length === 0) return;
    const withIds = sources.map((s: any, i: number) => ({ id: s.id || `source-${i}-${Date.now()}`, title: s.title, ...s }));
    openSourceDrawer(withIds[0], withIds);
  };

  const handlePreferenceSelect = (preference: 'a' | 'b' | 'tie') => {
    setSelectedPreference(preference);
    onPreferenceSelect(preference);
    
    // Auto-hide comparison after selection
    setTimeout(() => {
      setShowComparison(false);
    }, 1500);
  };

  if (!showComparison && selectedPreference) {
    // Show the preferred response only
    const preferredResponse = selectedPreference === 'a' ? responseA : 
                             selectedPreference === 'b' ? responseB : responseA;
    const preferredSources = selectedPreference === 'a' ? sourceA : 
                           selectedPreference === 'b' ? sourceB : sourceA;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[var(--chat-text)] bg-green-500/10 p-3 rounded-lg border border-green-500/25">
          <Trophy className="h-4 w-4 text-green-600 dark:text-green-300" />
          <span className="text-green-700 dark:text-green-300 font-medium">
            You selected: Response {selectedPreference.toUpperCase()}
            {selectedPreference === 'tie' && ' (Both were equally good)'}
          </span>
        </div>
        <MessageBubble
          message={{
            role: 'assistant',
            content: preferredResponse,
            sources: preferredSources,
            citation: selectedPreference === 'a' ? citationA : 
                     selectedPreference === 'b' ? citationB : citationA
          }}
          isStreaming={false}
          onViewSources={() => viewSources(preferredSources)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-[var(--chat-text)]">
          <Sparkles className="h-5 w-5 text-primary" />
          Choose Your Preferred Response
        </h3>
        <p className="text-sm text-[var(--chat-muted)]">
          Here are two different approaches to your question. Pick the one that works better for you.
        </p>
      </div>

      {/* Dual Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response A */}
        <Card className={`bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] transition-all duration-200 ${
          selectedPreference === 'a' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Response A</Badge>
                {showModelNames && <span className="text-sm text-muted-foreground">{(typeof modelNameA === 'string' && modelNameA) || 'Claude Sonnet 4'}</span>}
              </CardTitle>
              {selectedPreference === 'a' && <Crown className="h-5 w-5 text-primary" />}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none">
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: responseA,
                  sources: sourceA,
                  citation: citationA
                }}
                isStreaming={false}
                variant="comparison"
                onViewSources={() => viewSources(sourceA)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Response B */}
        <Card className={`bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] transition-all duration-200 ${
          selectedPreference === 'b' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Response B</Badge>
                {showModelNames && <span className="text-sm text-muted-foreground">{(typeof modelNameB === 'string' && modelNameB) || 'Claude Sonnet 4'}</span>}
              </CardTitle>
              {selectedPreference === 'b' && <Crown className="h-5 w-5 text-primary" />}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none">
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: responseB,
                  sources: sourceB,
                  citation: citationB
                }}
                isStreaming={false}
                variant="comparison"
                onViewSources={() => viewSources(sourceB)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preference Selection - Integrated within the component */}
      <div className="space-y-4">
        {!selectedPreference ? (
          <div className="flex flex-col items-center gap-4 p-6 border border-[var(--chat-border)] rounded-lg bg-[var(--chat-card)]">
            <div className="text-center">
              <h4 className="font-semibold text-lg mb-2 text-[var(--chat-text)]">Which response do you prefer?</h4>
              <p className="text-sm text-[var(--chat-muted)]">Your choice helps improve future responses</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => handlePreferenceSelect('a')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                size="lg"
              >
                <ThumbsUp className="h-4 w-4" />
                Response A
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handlePreferenceSelect('tie')}
                className="flex items-center gap-2 border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] px-6 py-3"
                size="lg"
              >
                Both are good
              </Button>
              
              <Button
                onClick={() => handlePreferenceSelect('b')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                size="lg"
              >
                <ThumbsUp className="h-4 w-4" />
                Response B
              </Button>
            </div>
          </div>
        ) : (
          /* Feedback Message */
          <div className="text-center text-sm text-[var(--chat-muted)]">
            <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/25 p-3 rounded-lg">
              <Trophy className="h-4 w-4 text-green-600 dark:text-green-300" />
              <span className="text-green-700 dark:text-green-300">Thank you! Your feedback helps improve future responses.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};