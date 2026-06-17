
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatMode } from '@/components/ChatInterface';
import { Leaf, Heart, Briefcase, Bird, Cross, Brain, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModeSelectionStepProps {
  onNext: () => void;
  onBack?: () => void;
  onSelectMode: (mode: ChatMode) => void;
  selectedMode: ChatMode;
  config: any;
}

// Define the icons for each mode
const modeIcons = {
  Coaching: <Leaf className="h-6 w-6" />,
  Family: <Heart className="h-6 w-6" />,
  "Coach Mode [ALPHA]": <Brain className="h-6 w-6" />,
  Advisor: <Compass className="h-6 w-6" />,
  Ambassador: <Bird className="h-6 w-6" />,
  Faith: <Cross className="h-6 w-6" />,
  "Default Mode": <Leaf className="h-6 w-6" />,
};

const ModeSelectionStep: React.FC<ModeSelectionStepProps> = ({
  onNext,
  onBack,
  onSelectMode,
  selectedMode,
  config,
}) => {
  const handleSelectMode = (mode: ChatMode) => {
    const modeConfig = config.modes.find((m: any) => m.id === mode);
    if (modeConfig?.available) {
      onSelectMode(mode);
    }
  };

  // Animation variants for staggered card appearance
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[var(--chat-text)] dark:text-white">
          {config.modeSelection.title}
        </h2>
        <p className="text-sm text-[var(--chat-text-secondary)] mt-2">
          {config.modeSelection.description}
        </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {config.modes.map((mode: any) => (
          <motion.div key={mode.id} variants={item}>
            <Card
              className={`p-4 transition-all ${
                !mode.available 
                  ? 'opacity-50 cursor-not-allowed' 
                  : `cursor-pointer hover:shadow-md ${
                      selectedMode === mode.id
                        ? 'ring-2 ring-brand-green bg-brand-green/5'
                        : 'hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800'
                    }`
              }`}
              onClick={() => handleSelectMode(mode.id as ChatMode)}
            >
              <div className="flex items-center space-x-4">
                <div className={`text-brand-green flex items-center justify-center`}>
                  {modeIcons[mode.name as keyof typeof modeIcons]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--chat-text)] dark:text-white">{mode.name}</h3>
                    {!mode.available && (
                      <span className="text-xs bg-[var(--ui-bg-hover)] text-[var(--chat-muted)] px-2 py-0.5 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--chat-muted)] mt-1">
                    {mode.available ? mode.description : "This mode will be available soon"}
                  </p>
                </div>
                <div 
                  className={`w-5 h-5 rounded-full border-2 ${
                    selectedMode === mode.id && mode.available
                      ? 'border-brand-green bg-brand-green'
                      : 'border-[var(--chat-border)] dark:border-gray-700'
                  }`}
                >
                  {selectedMode === mode.id && mode.available && (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-between mt-8">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="px-5"
          >
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedMode || !config.modes.find((m: any) => m.id === selectedMode)?.available}
          className={`bg-brand-green hover:bg-brand-green/90 px-5 ${
            onBack ? 'ml-auto' : 'w-full'
          }`}
        >
          Next: Choose Tone
        </Button>
      </div>
    </div>
  );
};

export default ModeSelectionStep;
