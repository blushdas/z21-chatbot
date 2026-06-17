
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Lock, Loader2, CheckCircle, XCircle, Send, LogOut } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountDetailsProps {
  userProfile: any;
  profileHook: any;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ userProfile, profileHook }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [editedEmail, setEditedEmail] = useState(userProfile.email);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');

  const handleSaveName = async () => {
    await profileHook.updateProfile({ name: editedName });
    setIsEditingName(false);
  };

  const handleCancelNameEdit = () => {
    setEditedName(userProfile.name);
    setIsEditingName(false);
  };

  const handleSaveEmail = async () => {
    await profileHook.updateProfile({ email: editedEmail });
    setIsEditingEmail(false);
  };

  const handleCancelEmailEdit = () => {
    setEditedEmail(userProfile.email);
    setIsEditingEmail(false);
  };

  const handlePasswordUpdate = async () => {
    if (!currentPasswordInput) {
      toast({ title: 'Enter your current password', variant: 'destructive' });
      return;
    }
    if (profileHook.newPassword) {
      const ok = await profileHook.updatePassword(profileHook.newPassword, currentPasswordInput);
      if (ok) {
        setShowPasswordSection(false);
        setCurrentPasswordInput('');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResendingVerification(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Failed to send verification email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and spam folder for the verification link."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Section */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name
          </Label>
          {isEditingName ? (
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full"
                placeholder="Enter your full name"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveName}
                  disabled={profileHook.loading}
                  size="sm"
                  className="flex-1"
                >
                  {profileHook.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save
                </Button>
                <Button 
                  onClick={handleCancelNameEdit}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white">
                {userProfile.name || 'No name set'}
              </span>
              <Button 
                onClick={() => setIsEditingName(true)}
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Email Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          {isEditingEmail ? (
            <div className="space-y-2">
              <Input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="w-full"
                placeholder="Enter your email address"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEmail}
                  disabled={profileHook.loading}
                  size="sm"
                  className="flex-1"
                >
                  {profileHook.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save
                </Button>
                <Button 
                  onClick={handleCancelEmailEdit}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Changing your email may require verification
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-gray-900 dark:text-white break-words">
                    {userProfile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.email_confirmed_at ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">Unverified</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => setIsEditingEmail(true)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  Edit
                </Button>
              </div>
              
              {/* Email Verification Section */}
              {!user?.email_confirmed_at && (
                <div className="bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-[color:var(--color-warning)] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-[color:var(--color-warning)] font-medium">
                        Email verification required
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please verify your email address to secure your account and enable all features.
                      </p>
                      <Button
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        size="sm"
                        variant="outline"
                        className="mt-2 text-[color:var(--color-warning)] border-[var(--color-warning-border)] hover:bg-[var(--color-warning-soft)]"
                      >
                        {isResendingVerification ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Send Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Password Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </Label>
          
          {!showPasswordSection ? (
            <Button 
              onClick={() => setShowPasswordSection(true)}
              variant="outline"
              size="sm"
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={profileHook.newPassword}
                onChange={(e) => profileHook.setNewPassword(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={profileHook.loading || !profileHook.newPassword || !currentPasswordInput}
                  size="sm"
                  className="flex-1"
                >
                  {profileHook.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update Password
                </Button>
                <Button 
                  onClick={() => {
                    setShowPasswordSection(false);
                    profileHook.setNewPassword('');
                    setCurrentPasswordInput('');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Account Info */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Account Status</Label>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="capitalize">{userProfile.role}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Account ID:</span>
              <span className="font-mono text-xs">{userProfile.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sign Out Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Session
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Sign out of your Daryle AI account on this device.
          </p>
          <Button 
            onClick={signOut}
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountDetails;
