import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [primaryColor, setPrimaryColor] = useLocalStorage('primaryColor', '#FF6B6B');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');
  const [language, setLanguage] = useLocalStorage('language', 'tr');

  // Theme configurations
  const themes = {
    light: {
      name: 'Light',
      primary: '#FF6B6B',
      secondary: '#FF8E53',
      background: '#f5f7fa',
      surface: '#ffffff',
      text: '#2c3e50',
      textSecondary: '#6c757d',
      border: '#e9ecef',
      shadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
    },
    dark: {
      name: 'Dark', 
      primary: '#FF6B6B',
      secondary: '#FF8E53',
      background: '#121212',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      border: '#404040',
      shadow: '0 2px 12px rgba(0, 0, 0, 0.3)'
    },
    blue: {
      name: 'Blue',
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#f8f9fa',
      surface: '#ffffff',
      text: '#2c3e50',
      textSecondary: '#6c757d',
      border: '#e9ecef',
      shadow: '0 2px 12px rgba(0, 123, 255, 0.15)'
    }
  };

  const fontSizes = {
    small: { name: 'Küçük', value: '14px' },
    medium: { name: 'Orta', value: '16px' },
    large: { name: 'Büyük', value: '18px' }
  };

  const colors = [
    { name: 'Acara Red', value: '#FF6B6B' },
    { name: 'Ocean Blue', value: '#007bff' },
    { name: 'Forest Green', value: '#28a745' },
    { name: 'Sunset Orange', value: '#fd7e14' },
    { name: 'Royal Purple', value: '#6f42c1' },
    { name: 'Teal', value: '#20c997' }
  ];

  // Apply theme to document
  useEffect(() => {
    const currentTheme = themes[theme];
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', primaryColor);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-background', currentTheme.background);
    root.style.setProperty('--theme-surface', currentTheme.surface);
    root.style.setProperty('--theme-text', currentTheme.text);
    root.style.setProperty('--theme-text-secondary', currentTheme.textSecondary);
    root.style.setProperty('--theme-border', currentTheme.border);
    root.style.setProperty('--theme-shadow', currentTheme.shadow);
    root.style.setProperty('--theme-font-size', fontSizes[fontSize].value);
    
    // Apply theme class to body
    document.body.className = `theme-${theme} font-${fontSize}`;
    
    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', primaryColor);
    }
  }, [theme, primaryColor, fontSize]);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Change theme to specific theme
  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
    }
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Change primary color
  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  // Change font size
  const changeFontSize = (size) => {
    if (fontSizes[size]) {
      setFontSize(size);
    }
  };

  // Change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  // Reset to default theme
  const resetTheme = () => {
    setTheme('light');
    setPrimaryColor('#FF6B6B');
    setFontSize('medium');
    setSidebarCollapsed(false);
  };

  // Get current theme configuration
  const getCurrentTheme = () => {
    return {
      ...themes[theme],
      primary: primaryColor
    };
  };

  // Check if current theme is dark
  const isDarkMode = () => {
    return theme === 'dark';
  };

  const value = {
    // Current state
    theme,
    primaryColor,
    fontSize,
    language,
    sidebarCollapsed,
    
    // Theme data
    themes,
    fontSizes,
    colors,
    
    // Actions
    toggleTheme,
    changeTheme,
    changePrimaryColor,
    changeFontSize,
    changeLanguage,
    toggleSidebar,
    resetTheme,
    
    // Helpers
    getCurrentTheme,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};