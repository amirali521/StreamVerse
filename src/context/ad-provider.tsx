
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AdContextType {
  isAdVisible: boolean;
  setAdVisible: (isVisible: boolean) => void;
  incrementClickCount: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const CLICKS_BEFORE_AD = 10; // Show ad every 10 clicks

export function AdProvider({ children }: { children: ReactNode }) {
  const [isAdVisible, setAdVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const incrementClickCount = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= CLICKS_BEFORE_AD) {
      setAdVisible(true);
      setClickCount(0); // Reset after showing ad
    }
  }, [clickCount]);
  
  // This effect adds a global click listener to the document
  useEffect(() => {
    const handleGlobalClick = () => {
      incrementClickCount();
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [incrementClickCount]);


  return (
    <AdContext.Provider value={{ isAdVisible, setAdVisible, incrementClickCount }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAd = (): AdContextType => {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
};
