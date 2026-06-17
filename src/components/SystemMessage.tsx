import React from 'react';
import { Info } from 'lucide-react';

interface SystemMessageProps {
  content: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  return (
    <div className="flex justify-center my-4">
      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm border border-blue-200">
        <Info className="h-4 w-4" />
        <span>{content}</span>
      </div>
    </div>
  );
};

export default SystemMessage;