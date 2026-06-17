import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import SignUpStep1 from './SignUpStep1';
import SignUpStep2 from './SignUpStep2';
import SignUpStep3 from './SignUpStep3';
import { supabase } from '@/integrations/supabase/client';
import { collectSignupData } from '@/utils/signupDataCollector';

// Validate email domain against database via edge function
async function validateEmailDomain(email: string): Promise<{ isAuthorized: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-email-domain', {
      body: { email }
    });

    if (error) {
      console.error('Domain validation error:', error);
      return { isAuthorized: false, error: 'Unable to validate email domain' };
    }

    return { isAuthorized: data?.isAuthorized ?? false };
  } catch (err) {
    console.error('Domain validation exception:', err);
    return { isAuthorized: false, error: 'Validation error occurred' };
  }
}

const SignUpWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    termsAccepted: false,
  });

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Server-side domain validation before attempting signup
      const domainCheck = await validateEmailDomain(formData.email);
      if (!domainCheck.isAuthorized) {
        setCurrentStep(1); // Go back to email step
        const errorMsg = 'Your email domain is not authorized. Only approved organization emails can sign up.';
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { duration: 5000 });
        setIsLoading(false);
        return;
      }

      // Collect comprehensive client-side signup data for analytics
      const signupData = collectSignupData();

      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined,
        formData.termsAccepted,
        signupData
      );

      if (error) {
        console.error('Signup error:', error);
        
        // Check for domain authorization error from database trigger
        const errorMessage = error.message || '';
        const isDomainError = errorMessage.toLowerCase().includes('not authorized') || 
                              errorMessage.toLowerCase().includes('domain');
        
        if (isDomainError) {
          setCurrentStep(1);
          const friendlyError = 'Your email domain is not authorized for signup. Please use an approved organization email.';
          setErrorMessage(friendlyError);
          toast.error(friendlyError, { duration: 5000 });
          return;
        }
        
        // Check for specific password-related errors
        const isPasswordError = 
          errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('weak') ||
          errorMessage.toLowerCase().includes('pwned') ||
          errorMessage.toLowerCase().includes('breach');

        if (isPasswordError) {
          // Navigate back to password step with error
          setCurrentStep(2);
          const friendlyError = errorMessage.includes('pwned') || errorMessage.includes('breach')
            ? 'This password has been found in data breaches and cannot be used. Please choose a different, unique password.'
            : errorMessage.includes('weak')
            ? 'This password is too weak. Please create a stronger password with a mix of characters.'
            : errorMessage;
          
          setErrorMessage(friendlyError);
          toast.error(friendlyError, { duration: 5000 });
        } else {
          setErrorMessage(error.message || 'Failed to create account');
          toast.error(error.message || 'Failed to create account', { duration: 5000 });
        }
      } else {
        toast.success('Account created! Check your email for verification.');
        navigate('/auth/confirmation', { state: { email: formData.email } });
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <ProgressIndicator currentStep={currentStep} totalSteps={3} />

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {currentStep === 1 && (
        <SignUpStep1
          name={formData.name}
          email={formData.email}
          onNameChange={(value) => setFormData({ ...formData, name: value })}
          onEmailChange={(value) => setFormData({ ...formData, email: value })}
          onNext={() => {
            setErrorMessage(null);
            setCurrentStep(2);
          }}
        />
      )}

      {currentStep === 2 && (
        <SignUpStep2
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          onPasswordChange={(value) => {
            setErrorMessage(null);
            setFormData({ ...formData, password: value });
          }}
          onConfirmPasswordChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          onNext={() => {
            setErrorMessage(null);
            setCurrentStep(3);
          }}
          onBack={() => {
            setErrorMessage(null);
            setCurrentStep(1);
          }}
        />
      )}

      {currentStep === 3 && (
        <SignUpStep3
          phone={formData.phone}
          termsAccepted={formData.termsAccepted}
          onPhoneChange={(value) => setFormData({ ...formData, phone: value })}
          onTermsChange={(value) => setFormData({ ...formData, termsAccepted: value })}
          onSubmit={handleFinalSubmit}
          onBack={() => {
            setErrorMessage(null);
            setCurrentStep(2);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default SignUpWizard;
