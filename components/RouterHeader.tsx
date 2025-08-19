import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { ROUTES } from '../constants/routes';

type FontSize = 'sm' | 'base' | 'lg';

interface RouterHeaderProps {
  theme: 'light' | 'dark' | 'comfort' | 'system';
  onToggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'comfort' | 'system') => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  onRequestResetData: () => void;
  installPromptEvent: Event | null;
  onInstallRequest: () => void;
}

// Navigation items configuration
const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: ICONS.calendar },
  { path: ROUTES.ENROLLMENT, label: 'Enrollment', icon: ICONS.enrollment },
  { path: ROUTES.TEACHERS, label: 'Teachers', icon: ICONS.teachers },
  { path: ROUTES.STUDENTS, label: 'Students', icon: ICONS.users },
  { path: ROUTES.BILLING, label: 'Billing', icon: ICONS.billing },
  { path: ROUTES.CHAT, label: 'Chat', icon: ICONS.chat },
  { path: ROUTES.TRASH, label: 'Trash', icon: ICONS.trash },
];

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}> = ({ label, icon, isActive, onClick, isMobile = false }) => {
  const baseClasses = isMobile 
    ? "flex items-center space-x-3 px-4 py-2.5 text-base w-full transition-all duration-200" 
    : "flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200";
  
  const colorClasses = isActive
    ? isMobile
      ? "bg-brand-primary/20 text-brand-primary border-r-2 border-brand-primary"
      : "bg-brand-primary text-white shadow-md"
    : isMobile
      ? "text-text-secondary hover:bg-surface-secondary/60 hover:text-brand-primary"
      : "text-text-secondary hover:bg-surface-secondary hover:text-brand-primary";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorClasses}`}
      aria-pressed={isActive}
      type="button"
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

export const RouterHeader: React.FC<RouterHeaderProps> = ({
  theme,
  onToggleTheme,
  setThemeMode,
  fontSize,
  onFontSizeChange,
  onRequestResetData,
  installPromptEvent,
  onInstallRequest,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Get current path to determine active navigation item
  const getCurrentPath = () => {
    // Handle dynamic routes by checking the base path
    const path = location.pathname;
    if (path.startsWith('/teachers/')) return ROUTES.TEACHERS;
    if (path.startsWith('/students/')) return ROUTES.STUDENTS;
    if (path.startsWith('/chat/')) return ROUTES.CHAT;
    return path;
  };

  const currentPath = getCurrentPath();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-surface-main dark:bg-slate-800 border-b border-border-light dark:border-slate-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">GH</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-text-primary dark:text-slate-200">
                GHSM Admin
              </h1>
              <p className="text-xs text-text-secondary dark:text-slate-400">
                Music School Management
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2" id="primary-nav">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.path}
                label={item.label}
                icon={item.icon}
                isActive={currentPath === item.path}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </nav>

          {/* Settings and Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-md text-text-secondary hover:text-brand-primary hover:bg-surface-secondary transition-colors"
                aria-label="Open settings menu"
                aria-expanded={isSettingsOpen}
                type="button"
              >
                {ICONS.settings}
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-main dark:bg-slate-800 rounded-lg shadow-lg border border-border-light dark:border-slate-700 py-2 z-50">
                  {/* Theme Settings */}
                  <div className="px-4 py-2 border-b border-border-light dark:border-slate-700">
                    <h3 className="text-sm font-medium text-text-primary dark:text-slate-200 mb-2">Theme</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(['light', 'dark', 'comfort', 'system'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setThemeMode(mode)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize ${
                            theme === mode
                              ? 'bg-brand-primary text-white'
                              : 'bg-surface-secondary text-text-secondary hover:bg-brand-primary/20'
                          }`}
                          type="button"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Settings */}
                  <div className="px-4 py-2 border-b border-border-light dark:border-slate-700">
                    <h3 className="text-sm font-medium text-text-primary dark:text-slate-200 mb-2">Font Size</h3>
                    <div className="flex gap-2">
                      {(['sm', 'base', 'lg'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => onFontSizeChange(size)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                            fontSize === size
                              ? 'bg-brand-primary text-white'
                              : 'bg-surface-secondary text-text-secondary hover:bg-brand-primary/20'
                          }`}
                          type="button"
                        >
                          {size === 'sm' ? 'Small' : size === 'base' ? 'Normal' : 'Large'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-2">
                    {installPromptEvent && (
                      <button
                        onClick={onInstallRequest}
                        className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-brand-primary hover:bg-surface-secondary rounded-md transition-colors mb-2"
                        type="button"
                      >
                        📱 Install App
                      </button>
                    )}
                    <button
                      onClick={onRequestResetData}
                      className="w-full text-left px-3 py-2 text-sm text-status-red hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                      type="button"
                    >
                      🗑️ Reset All Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-text-secondary hover:text-brand-primary hover:bg-surface-secondary transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border-light dark:border-slate-700 py-4">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.path}
                  label={item.label}
                  icon={item.icon}
                  isActive={currentPath === item.path}
                  onClick={() => handleNavigation(item.path)}
                  isMobile
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
