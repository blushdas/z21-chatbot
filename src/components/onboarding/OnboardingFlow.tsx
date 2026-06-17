import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from './WelcomeStep';
import ModeSelectionStep from './ModeSelectionStep';
import LengthPreferenceStep from './LengthPreferenceStep';
import ConsentStep from './ConsentStep';
import { ChatMode } from '@/components/ChatInterface';
import { onboardingConfig } from '@/data/onboardingConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';
import { toast } from 'sonner';

const SHOW_LENGTH_SELECTOR = true;

// Recursively replace brand-name strings in a config object so white-label
// sessions never surface "Daryle" in onboarding copy.
const brandifyConfig = <T,>(value: T, brandText: (s: string) => string): T => {
  if (typeof value === 'string') return brandText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => brandifyConfig(v, brandText)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = brandifyConfig(v, brandText);
    }
    return out as T;
  }
  return value;
};

// Export interface for onboarding data that will be passed to the parent component
export interface OnboardingData {
  mode: ChatMode;
  tone: string;
  length: string;
  consentGiven: boolean;
}

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { brandText } = useBrand();
  const config = useMemo(() => brandifyConfig(onboardingConfig, brandText), [brandText]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<ChatMode>("coach");
  const [selectedTone, setSelectedTone] = useState<string>("wise_direct");
  const [selectedLength, setSelectedLength] = useState<string>("medium");
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  
  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };
  
  const handleModeSelect = (mode: ChatMode) => {
    setSelectedMode(mode);
    
    // Default tone based on selected mode
    const defaultTone = onboardingConfig.toneMappings[mode]?.[0]?.id || onboardingConfig.tones[0].id;
    setSelectedTone(defaultTone);
  };

  const handleLengthSelect = (length: string) => {
    setSelectedLength(length);
  };
  
  const handleConsentChange = (consent: boolean) => {
    setConsentGiven(consent);
  };

  const handleSkip = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }

    setIsSkipping(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to skip onboarding:', error);
        toast.error('Failed to skip. Please try again.');
        setIsSkipping(false);
        return;
      }

      localStorage.setItem('daryleBot_onboardingComplete', 'true');
      navigate('/auth/setup-2fa');
    } catch (err) {
      console.error('Error skipping onboarding:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSkipping(false);
    }
  };
  
  const handleComplete = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }

    setIsSaving(true);
    
    try {
      // Save onboarding completion to database
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save onboarding status:', error);
        toast.error('Failed to save preferences. Please try again.');
        setIsSaving(false);
        return;
      }

      // Save preferences to localStorage as backup
      localStorage.setItem('daryleBot_onboardingComplete', 'true');
      localStorage.setItem('daryleBot_preferences', JSON.stringify({
        mode: selectedMode,
        tone: selectedTone,
        length: selectedLength,
        consentGiven
      }));
      
      // Notify parent component if callback provided
      if (onComplete) {
        onComplete({
          mode: selectedMode,
          tone: selectedTone,
          length: selectedLength,
          consentGiven
        });
      }

      // Navigate to 2FA setup
      navigate('/auth/setup-2fa');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSaving(false);
    }
  };
  
  // Determine which step to render - conditionally skip length selection step
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome step
        return (
          <WelcomeStep 
            config={config}
            onNext={handleNextStep}
            onSkip={handleSkip}
            isSkipping={isSkipping}
          />
        );
      case 1: // Mode selection
        return (
          <ModeSelectionStep
            config={config}
            selectedMode={selectedMode}
            onSelectMode={handleModeSelect}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 2: // Length preference step (conditionally shown)
        if (SHOW_LENGTH_SELECTOR) {
          return (
            <LengthPreferenceStep
              config={config}
              selectedLength={selectedLength}
              onSelectLength={handleLengthSelect}
              onNext={handleNextStep}
              onBack={handlePreviousStep}
            />
          );
        }
        // If length selector is hidden, fall through to consent step
        return (
          <ConsentStep
            config={config}
            consentGiven={consentGiven}
            onConsentChange={handleConsentChange}
            onComplete={handleComplete}
            onBack={handlePreviousStep}
            onNext={handleNextStep}
            isLoading={isSaving}
          />
        );
      case 3: // Consent step (or step 2 if length is skipped)
        return (
          <ConsentStep
            config={config}
            consentGiven={consentGiven}
            onConsentChange={handleConsentChange}
            onComplete={handleComplete}
            onBack={handlePreviousStep}
            onNext={handleNextStep}
            isLoading={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ui-bg-hover)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingFlow;
