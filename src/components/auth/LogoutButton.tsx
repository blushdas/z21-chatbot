
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/SupabaseAuthContext';
import { LogOut } from 'lucide-react';

const LogoutButton: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={signOut}
      className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)] dark:hover:text-gray-100"
    >
      <LogOut className="h-4 w-4 mr-2" />
      <span className="hidden md:inline">Logout</span>
    </Button>
  );
};

export default LogoutButton;
