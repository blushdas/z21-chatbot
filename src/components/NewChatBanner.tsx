import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';

const NewChatBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { profile } = useAuth();
  const { brandText } = useBrand();

  // Hide for justin@ (justin admin)
  const isJustin = profile?.name?.toLowerCase().includes('justin') ?? false;

  if (isJustin) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className={`w-full px-4 pt-8 pb-4 relative z-10 transition-all duration-300 ${
      isDismissed ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="max-w-4xl mx-auto bg-blue-50 border-l-4 border-blue-400 px-6 py-4 rounded-r-lg relative shadow-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-blue-100 rounded-full transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={16} className="text-blue-600" />
        </button>
        
        <div className="pr-8">
        <h3 className="text-blue-800 font-semibold text-sm mb-1">
          {brandText('Welcome to the Daryle AI Beta!')}
        </h3>
        <p className="text-blue-700 text-sm">
          {brandText("You're among the first to experience Daryle AI.")} As a beta release, you may encounter occasional bugs or unexpected behavior as we continue to refine the platform. Your feedback is invaluable—please don't hesitate to share your thoughts and report any issues you encounter.
        </p>
        </div>
      </div>
    </div>
  );
};

export default NewChatBanner;