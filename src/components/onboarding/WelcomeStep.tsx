
import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useBrand } from "@/context/BrandContext";

export interface WelcomeStepProps {
  config: {
    welcome: {
      title: string;
      description: string;
    };
  };
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isSkipping?: boolean;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ config, onNext, onSkip, isSkipping = false }) => {
  const { activeBrand, productName, logoUrl, logoDarkUrl } = useBrand();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-8 text-center"
    >
      {/* App Logo */}
      <div className="mb-6 flex justify-center">
        <img 
          src={activeBrand ? (logoUrl ?? logoDarkUrl ?? '/lovable-uploads/Daryle_Logo_Dark.svg') : '/lovable-uploads/Daryle_Logo_Dark.svg'}
          alt={productName}
          className="h-24 w-auto object-contain dark:hidden"
        />
        <img 
          src={activeBrand ? (logoDarkUrl ?? logoUrl ?? '/lovable-uploads/Daryle_Logo_White.svg') : '/lovable-uploads/Daryle_Logo_White.svg'}
          alt={productName}
          className="h-24 w-auto object-contain hidden dark:block"
        />
      </div>
      
      {/* Tagline */}
      <div className="mb-4">
        <p className="text-sm text-[var(--chat-text-secondary)]">
          In Search of Wisdom
        </p>
      </div>
      
      {/* Subheadline */}
      <p className="text-[var(--chat-text-secondary)] mb-8">
        {config.welcome.description}
      </p>
      
      {/* CTA Button */}
      <Button
        onClick={onNext}
        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white py-3 px-6 rounded-md font-medium"
      >
        Get Started
      </Button>
      
      {/* Skip option */}
      {onSkip && (
        <button
          onClick={onSkip}
          disabled={isSkipping}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isSkipping ? 'Skipping...' : 'Skip setup and go to app →'}
        </button>
      )}
      
      {/* Optional footer */}
      <p className="text-xs text-[var(--chat-muted)] mt-8">
        Powered by Ambassador Enterprises
      </p>
    </motion.div>
  );
};

export default WelcomeStep;
