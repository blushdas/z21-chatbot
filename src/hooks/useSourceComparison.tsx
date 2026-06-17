
import React, { createContext, useContext, useState } from 'react';
import { SourceData } from '@/data/mockSourceData';
import SourceComparisonModal from '@/components/SourceComparisonModal';

interface SourceComparisonContextType {
  openSourceComparison: (sources: SourceData[]) => void;
  closeSourceComparison: () => void;
  isOpen: boolean;
}

const SourceComparisonContext = createContext<SourceComparisonContextType | undefined>(undefined);

export const SourceComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<SourceData[]>([]);

  const openSourceComparison = (sourcesToCompare: SourceData[]) => {
    setSources(sourcesToCompare);
    setIsOpen(true);
  };

  const closeSourceComparison = () => {
    setIsOpen(false);
  };

  return (
    <SourceComparisonContext.Provider value={{ openSourceComparison, closeSourceComparison, isOpen }}>
      {children}
      <SourceComparisonModal
        open={isOpen}
        onOpenChange={setIsOpen}
        sources={sources}
      />
    </SourceComparisonContext.Provider>
  );
};

export const useSourceComparison = () => {
  const context = useContext(SourceComparisonContext);
  
  if (context === undefined) {
    return { comparisonMode: false, primarySource: null, secondarySource: null, toggleComparison: ()=>{}, setPrimary: ()=>{}, setSecondary: ()=>{}, clearComparison: ()=>{} };
  }
  
  return context;
};
