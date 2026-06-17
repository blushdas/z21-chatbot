
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlignLeft } from 'lucide-react';

interface LengthPreferenceStepProps {
  onNext: () => void;
  onBack?: () => void;
  onSelectLength: (length: string) => void;
  selectedLength: string;
  config: any;
}

const LengthPreferenceStep: React.FC<LengthPreferenceStepProps> = ({
  onNext,
  onBack,
  onSelectLength,
  selectedLength,
  config,
}) => {
  // Auto-select medium length since this feature is disabled
  React.useEffect(() => {
    onSelectLength('medium');
  }, [onSelectLength]);

  return (
    <div className="flex flex-col space-y-6">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-[var(--chat-text)] dark:text-white">
          Response Length
        </h2>
        <p className="text-sm text-[var(--chat-text-secondary)] mt-2">
          Length customization will be available soon
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white p-4 rounded-md border border-[var(--chat-border)] dark:border-gray-700 opacity-50">
          <div className="flex items-center space-x-3">
            <div className="text-[var(--chat-muted)]">
              <AlignLeft className="h-6 w-6" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-medium text-[var(--chat-text)] dark:text-white">
                Length Selection
              </span>
              <span className="text-xs text-[var(--chat-muted)]">
                Coming soon - medium length will be used by default
              </span>
            </div>
          </div>
        </div>
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
          className={`bg-brand-green hover:bg-brand-green/90 px-5 ${
            onBack ? 'ml-auto' : 'w-full'
          }`}
        >
          Next: Confirm & Complete
        </Button>
      </div>
    </div>
  );
};

export default LengthPreferenceStep;
