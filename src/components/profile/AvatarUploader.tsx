
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/SupabaseAuthContext';
import AvatarCropDialog from './AvatarCropDialog';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdate: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatarUrl,
  userName,
  onAvatarUpdate,
  size = 'md'
}) => {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-28 w-28',
    lg: 'h-32 w-32'
  };

  const buttonSizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const uploadAvatar = async (blob: Blob) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload an avatar",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      const filePath = `${user.id}.jpg`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Cache-bust so the new image appears immediately
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (authError) {
        throw authError;
      }

      // Update profiles table - only update avatar_url field
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update parent component
      onAvatarUpdate(avatarUrl);

      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be smaller than 5MB', variant: 'destructive' });
      return;
    }

    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const closeCropper = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        {currentAvatarUrl ? (
          <AvatarImage src={currentAvatarUrl} alt={userName} />
        ) : (
          <AvatarFallback className="text-2xl font-semibold bg-brand-yellow text-brand-blue">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="absolute -bottom-1 -right-1">
        <Button
          size="sm"
          variant="outline"
          className={`${buttonSizeClasses[size]} rounded-full p-0 bg-[var(--chat-card)] text-[var(--chat-text)] border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)] shadow-md`}
          disabled={uploading}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          {uploading ? (
            <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
          ) : (
            <Camera className={iconSizeClasses[size]} />
          )}
        </Button>
      </div>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <AvatarCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        onCancel={closeCropper}
        onConfirm={async (blob) => {
          await uploadAvatar(blob);
          closeCropper();
        }}
      />
    </div>
  );
};

export default AvatarUploader;
