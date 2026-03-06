import { useEffect, useState } from 'react';
import { ThemeContext } from './theme-context.js';

function getInitialDarkMode() {
  const savedTheme = localStorage.getItem('isDarkMode');
  if (savedTheme !== null) {
    return JSON.parse(savedTheme);
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode: () => setIsDarkMode((currentMode) => !currentMode),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
