import { useState, useEffect } from 'react';

export function useDarkMode() {
  // Check initial preference
  const getInitialMode = () => {
    // Check localStorage first
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialMode);

  useEffect(() => {
    // Apply dark class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist preference
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const stored = localStorage.getItem('darkMode');
      // Only auto-switch if user hasn't set a preference
      if (stored === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode, setIsDarkMode };
}

export default useDarkMode;
