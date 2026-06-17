
import React from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';
import { ChatMode } from '@/components/ChatInterface';
import { Brain, Heart, Briefcase, Star } from 'lucide-react';

interface ToneSelectionStepProps {
  onNext: () => void;
  onBack?: () => void;
  onSelectTone: (tone: string) => void;
  selectedTone: string;
  selectedMode: ChatMode;
  config: any;
}

// Define the icons for each tone
const toneIcons = {
  wise_direct: <Brain className="h-6 w-6 text-brand-green" />,
  warm_reflective: <Heart className="h-6 w-6 text-brand-green" />,
  visionary_strategic: <Briefcase className="h-6 w-6 text-brand-green" />,
  anchored_mission: <Star className="h-6 w-6 text-brand-green" />, // Replaced Dove with Star
};

const ToneSelectionStep: React.FC<ToneSelectionStepProps> = ({
  onNext,
  onBack,
  onSelectTone,
  selectedTone,
  selectedMode,
  config,
}) => {
  const handleToneChange = (tone: string) => {
    onSelectTone(tone);
  };

  // Get tones specific to selected mode if available, otherwise use default tones
  const availableTones = selectedMode && config.toneMappings[selectedMode] 
    ? config.toneMappings[selectedMode]
    : config.tones;

  return (
    <div className="flex flex-col space-y-6">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-[var(--chat-text)] dark:text-white">
          {config.toneSelection.title}
        </h2>
        <p className="text-sm text-[var(--chat-text-secondary)] mt-2">
          {config.toneSelection.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <RadioGroup 
          value={selectedTone} 
          onValueChange={handleToneChange}
          className="space-y-3"
        >
          {availableTones.map((tone: any, index: number) => (
            <motion.div 
              key={tone.id}
              className="flex items-center space-x-3 bg-white p-4 rounded-md border border-[var(--chat-border)] dark:border-gray-700 hover:border-[var(--chat-border)] dark:hover:border-gray-600 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.3 }}
            >
              <RadioGroupItem value={tone.id} id={`tone-${tone.id}`} className="text-brand-green" />
              <div className="text-brand-green">
                {toneIcons[tone.id as keyof typeof toneIcons]}
              </div>
              <label 
                htmlFor={`tone-${tone.id}`}
                className="flex flex-col cursor-pointer flex-1"
              >
                <span className="font-medium text-[var(--chat-text)] dark:text-white">
                  {tone.name}
                </span>
                <span className="text-xs text-[var(--chat-muted)]">
                  {tone.description}
                </span>
              </label>
            </motion.div>
          ))}
        </RadioGroup>
      </motion.div>

      <div className="flex justify-between pt-4">
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
          disabled={!selectedTone}
          className={`bg-brand-green hover:bg-brand-green/90 px-5 ${
            onBack ? 'ml-auto' : 'w-full'
          }`}
        >
          Next: Confirm & Continue
        </Button>
      </div>
    </div>
  );
};

export default ToneSelectionStep;
