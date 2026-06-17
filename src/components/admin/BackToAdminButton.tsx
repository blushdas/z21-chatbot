import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackToAdminButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  return (
    <div className={`mb-4 ${className}`}>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Dashboard
      </Button>
    </div>
  );
};

export default BackToAdminButton;