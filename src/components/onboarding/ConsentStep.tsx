
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ConsentStepProps {
  onNext: () => void;
  onBack?: () => void;
  onConsentChange: (consent: boolean) => void;
  consentGiven: boolean;
  config: any;
  onComplete?: () => void;
  isLoading?: boolean;
}

const ConsentStep: React.FC<ConsentStepProps> = ({
  onNext,
  onBack,
  onConsentChange,
  consentGiven,
  config,
  onComplete,
  isLoading = false,
}) => {
  const [checkboxes, setCheckboxes] = useState({
    understand: consentGiven || false,
    respectful: consentGiven || false,
  });

  const allChecked = checkboxes.understand && checkboxes.respectful;

  const handleCheckboxChange = (field: keyof typeof checkboxes) => {
    setCheckboxes((prev) => {
      const newValues = {
        ...prev,
        [field]: !prev[field],
      };
      
      // Update parent component state whenever checkboxes change
      onConsentChange(newValues.understand && newValues.respectful);
      
      return newValues;
    });
  };

  const handleNextClick = () => {
    if (onComplete) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-[var(--chat-text)] dark:text-white">
          {config.consent.title}
        </h2>
      </motion.div>

      <motion.div
        className="bg-white p-6 rounded-lg border border-[var(--chat-border)] dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[var(--chat-text)] text-sm">
          {config.consent.description}
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="understand" 
              checked={checkboxes.understand}
              onCheckedChange={() => handleCheckboxChange('understand')}
              className="mt-1 text-brand-green"
            />
            <label htmlFor="understand" className="text-sm text-[var(--chat-text)] cursor-pointer">
              {config.consent.checkboxes.understand}
            </label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="respectful" 
              checked={checkboxes.respectful}
              onCheckedChange={() => handleCheckboxChange('respectful')}
              className="mt-1 text-brand-green"
            />
            <label htmlFor="respectful" className="text-sm text-[var(--chat-text)] cursor-pointer">
              {config.consent.checkboxes.respectful}
            </label>
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
          onClick={handleNextClick}
          disabled={!allChecked || isLoading}
          className={`bg-brand-green hover:bg-brand-green/90 px-8 ${
            onBack ? 'ml-auto' : 'w-full'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : onComplete ? 'Start Chatting' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default ConsentStep;
