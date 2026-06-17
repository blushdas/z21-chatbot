
import React from 'react';
import { MockUserProfile, modeDisplayInfo } from "@/data/mockUserProfile";;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ChatInterface';

interface AccessSummaryProps {
  userProfile: MockUserProfile;
}

const AccessSummary: React.FC<AccessSummaryProps> = ({ userProfile }) => {
  const accessibleModes = Object.entries(userProfile.accessLevels)
    .filter(([_, hasAccess]) => hasAccess)
    .map(([mode]) => mode as ChatMode);
  
  const inaccessibleModes = Object.entries(userProfile.accessLevels)
    .filter(([_, hasAccess]) => !hasAccess)
    .map(([mode]) => mode as ChatMode);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-brand-green">Access & Permissions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-sm">
            <p className="text-gray-500 mb-1">You have access to:</p>
            <div className="space-y-1.5">
              {accessibleModes.map((mode) => (
                <div key={mode} className="flex items-center">
                  <span className="mr-2">{modeDisplayInfo[mode].icon}</span>
                  <span className="text-gray-900">{modeDisplayInfo[mode].name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {inaccessibleModes.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Request access to:</p>
              {inaccessibleModes.map((mode) => (
                <div key={mode} className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="mr-2">{modeDisplayInfo[mode].icon}</span>
                    <span className="text-gray-500">{modeDisplayInfo[mode].name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    Request access
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessSummary;
