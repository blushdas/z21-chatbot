import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Loader2, Copy, Download, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/SupabaseAuthContext';

const Setup2FAEmailPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'send' | 'verify' | 'backup'>('send');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    // Auto-send code when component mounts
    if (step === 'send' && !isSending && cooldown === 0) {
      handleSendCode();
    }
  }, []);

  const handleSendCode = async () => {
    if (!user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-2fa-email-code', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast.success('Verification code sent to your email');
      setStep('verify');
      setCooldown(60);
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Failed to send code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user || code.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('enable-2fa', {
        body: {
          userId: user.id,
          method: 'email',
          verificationCode: code
        }
      });

      if (error) throw error;

      toast.success('Email 2FA enabled successfully!');
      setBackupCodes(data.backupCodes || []);
      setStep('backup');
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daryle-ai-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success('Backup codes copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy backup codes');
    }
  };

  const handleComplete = () => {
    toast.success('Two-factor authentication is now active!');
    window.dispatchEvent(new CustomEvent('2fa:updated'));
    navigate('/');
  };

  if (step === 'send' || step === 'verify') {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full bg-white border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-brand-blue" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email Verification Code</CardTitle>
              <CardDescription className="text-base mt-2">
                {step === 'send' 
                  ? 'Sending a 6-digit code to your email...'
                  : 'Enter the 6-digit code sent to your email'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 'verify' && (
                <>
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={6} 
                      value={code} 
                      onChange={setCode}
                      disabled={isVerifying}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || isVerifying}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      onClick={handleSendCode}
                      disabled={cooldown > 0 || isSending}
                      variant="ghost"
                      size="sm"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </Button>
                  </div>
                </>
              )}

              {step === 'send' && isSending && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Backup codes step
  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Save Your Backup Codes</CardTitle>
            <CardDescription className="text-base mt-2">
              These codes can be used if you lose access to your email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Store these codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopyBackupCodes}
                variant="outline"
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={handleDownloadBackupCodes}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup2FAEmailPage;
