
import React, { useState } from 'react';
import type { MockUserProfile } from '@/data/mockUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import AvatarUploader from './AvatarUploader';

interface ProfileHeaderProps {
  userProfile: MockUserProfile;
  onUpdateProfile: (updatedProfile: MockUserProfile) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile, onUpdateProfile }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(userProfile.avatarUrl);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setCurrentAvatarUrl(newAvatarUrl);
    // Update the parent profile with the new avatar URL
    onUpdateProfile({
      ...userProfile,
      avatarUrl: newAvatarUrl
    });
  };

  const handleProfileUpdate = (updatedProfile: MockUserProfile) => {
    // Update both name and avatar URL
    onUpdateProfile({
      ...updatedProfile,
      avatarUrl: currentAvatarUrl
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-green to-brand-green/70"></div>
        <CardContent className="pt-0 relative">
          <div className="-mt-12 flex justify-between">
            <div className="border-4 border-white dark:border-gray-800 rounded-full bg-white">
              <AvatarUploader
                currentAvatarUrl={currentAvatarUrl}
                userName={userProfile.name}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-auto flex items-center gap-1.5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
          </div>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{userProfile.name}</h2>
            
            <div className="mt-1 flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">
                {userProfile.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={{...userProfile, avatarUrl: currentAvatarUrl}}
        onUpdateProfile={handleProfileUpdate}
      />
    </>
  );
};

export default ProfileHeader;
