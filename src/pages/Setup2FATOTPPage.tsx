import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Smartphone, Loader2, Copy, Download, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/SupabaseAuthContext';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Setup2FATOTPPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const generateTOTP = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-2fa-totp', {
        body: { userId: user.id }
      });

      if (error) throw error;

      setOtpauthUrl(data.otpauthUrl);
      setSecret(data.manualEntryKey || data.secret);
    } catch (error: unknown) {
      console.error('Generate TOTP error:', error);
      toast.error(getErrorMessage(error, 'Failed to generate TOTP'));
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  useEffect(() => {
    if (step === 'setup' && !otpauthUrl) {
      generateTOTP();
    }
  }, [generateTOTP, otpauthUrl, step]);

  const handleVerifyCode = async () => {
    if (!user || code.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('enable-2fa', {
        body: {
          userId: user.id,
          method: 'totp',
          totpSecret: secret,
          verificationCode: code
        }
      });

      if (error) throw error;

      toast.success('Authenticator app linked successfully!');
      setBackupCodes(data.backupCodes || []);
      setStep('backup');
    } catch (error: unknown) {
      console.error('Verify code error:', error);
      toast.error(getErrorMessage(error, 'Invalid verification code'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success('Secret key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy secret key');
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

  if (step === 'setup' || step === 'verify') {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full bg-white border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-brand-blue" />
                </div>
              </div>
              <CardTitle className="text-2xl">Setup Authenticator App</CardTitle>
              <CardDescription className="text-base mt-2">
                {step === 'setup' 
                  ? 'Scan the QR code with your authenticator app'
                  : 'Enter the 6-digit code from your app'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 'setup' && (
                <>
                  {isGenerating ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                    </div>
                  ) : (
                    <>
                      <div className="bg-white border-2 border-border rounded-lg p-4 flex justify-center">
                        {otpauthUrl ? (
                          <QRCodeSVG
                            value={otpauthUrl}
                            size={192}
                            includeMargin
                            className="h-48 w-48"
                            aria-label="Authenticator app QR code"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Manual Entry Key:</p>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                            {secret}
                          </code>
                          <Button
                            onClick={handleCopySecret}
                            variant="outline"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use this key if you can't scan the QR code
                        </p>
                      </div>

                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="font-medium mb-2 text-sm">Recommended Apps:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Google Authenticator</li>
                          <li>Authy</li>
                          <li>Microsoft Authenticator</li>
                          <li>1Password</li>
                        </ul>
                      </div>

                      <Button
                        onClick={() => setStep('verify')}
                        className="w-full"
                      >
                        I've Scanned the Code
                      </Button>
                    </>
                  )}
                </>
              )}

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
                      'Verify & Enable'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      onClick={() => setStep('setup')}
                      variant="ghost"
                      size="sm"
                    >
                      Back to QR Code
                    </Button>
                  </div>
                </>
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
              These codes can be used if you lose access to your authenticator app
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

export default Setup2FATOTPPage;
