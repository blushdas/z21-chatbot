import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

interface IdleTimeoutWarningProps {
  /** Whether the warning dialog is open */
  isOpen: boolean;
  /** Remaining seconds until auto-logout */
  remainingTime: number;
  /** Callback to extend the session */
  onExtend: () => void;
  /** Callback to manually log out */
  onLogout: () => void;
}

/**
 * Modal warning displayed before auto-logout due to inactivity
 */
export const IdleTimeoutWarning: React.FC<IdleTimeoutWarningProps> = ({
  isOpen,
  remainingTime,
  onExtend,
  onLogout
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/20 rounded-full">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Your session will expire in{' '}
            <strong className="text-foreground">{remainingTime} seconds</strong>{' '}
            due to inactivity. Would you like to stay signed in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <Button onClick={onExtend} variant="secondary">
            Stay Signed In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IdleTimeoutWarning;
