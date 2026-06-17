
import React, { createContext, useContext, useState } from 'react';
import SourceDrawer from '@/components/SourceDrawer';

// Define the source data structure to match what comes from Pinecone
interface SourceData {
  id: string;
  title: string;
  url?: string;
  domain?: string;
  subdomain?: string;
  category?: string;
  excerpt?: string;
  type?: 'PDF' | 'Article' | 'Document';
  mediaType?: string;
  externalUrl?: string;
  pdfUrl?: string;
  originalMetadata?: any;
  date?: string;
  page?: string;
}

interface SourceDrawerContextType {
  openSourceDrawer: (sourceData: SourceData, allSources?: SourceData[]) => void;
  closeSourceDrawer: () => void;
  isOpen: boolean;
}

const SourceDrawerContext = createContext<SourceDrawerContextType | undefined>(undefined);

export const SourceDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<SourceData | null>(null);
  const [allSources, setAllSources] = useState<SourceData[]>([]);

  const openSourceDrawer = (sourceData: SourceData, sources?: SourceData[]) => {
    setCurrentSource(sourceData);
    setAllSources(sources || [sourceData]);
    setIsOpen(true);
  };

  const closeSourceDrawer = () => {
    setIsOpen(false);
  };

  return (
    <SourceDrawerContext.Provider value={{ openSourceDrawer, closeSourceDrawer, isOpen }}>
      {children}
      <SourceDrawer 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        sourceData={currentSource} 
        allSources={allSources}
        initialSource={currentSource}
      />
    </SourceDrawerContext.Provider>
  );
};

export const useSourceDrawer = () => {
  const context = useContext(SourceDrawerContext);
  
  if (context === undefined) {
    throw new Error('useSourceDrawer must be used within a SourceDrawerProvider');
  }
  
  return context;
};

export type { SourceData };
