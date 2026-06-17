
import React from 'react';
import { CheckIcon } from 'lucide-react';

export const VerifiedMark: React.FC = () => {
  return (
    <div className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
      <CheckIcon className="w-2.5 h-2.5 text-white" />
    </div>
  );
};
