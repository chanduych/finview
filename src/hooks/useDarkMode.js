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
      // Set color-scheme for iOS Safari - this tells the browser to use dark system UI
      document.documentElement.style.colorScheme = 'dark';
      // Also set on body for broader support
      document.body.style.backgroundColor = '#0F172A';
    } else {
      document.documentElement.classList.remove('dark');
      // Set color-scheme to light - this overrides iOS system dark mode
      document.documentElement.style.colorScheme = 'light';
      // Reset body background
      document.body.style.backgroundColor = '#FFFFFF';
    }
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDarkMode ? '#0F172A' : '#0D9488');
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
