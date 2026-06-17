import React, { createContext, useContext, useState } from 'react';

interface CitationVisibilityContextType {
  citationsVisible: boolean;
  toggleCitationsVisibility: () => void;
}

const CitationVisibilityContext = createContext<CitationVisibilityContextType | undefined>(undefined);

export const CitationVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [citationsVisible, setCitationsVisible] = useState(() => {
    const stored = localStorage.getItem('citationsVisible');
    // Default to visible when no preference is set yet.
    return stored === null ? true : stored === 'true';
  });

  const toggleCitationsVisibility = () => {
    setCitationsVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('citationsVisible', String(newValue));
      return newValue;
    });
  };

  return (
    <CitationVisibilityContext.Provider value={{ citationsVisible, toggleCitationsVisibility }}>
      {children}
    </CitationVisibilityContext.Provider>
  );
};

export const useCitationVisibility = () => {
  const context = useContext(CitationVisibilityContext);
  if (context === undefined) {
    throw new Error('useCitationVisibility must be used within a CitationVisibilityProvider');
  }
  return context;
};
