import React, { useState, useRef, useEffect } from 'react';
import type { View } from '../types';
import { ICONS } from '../constants';

type FontSize = 'sm' | 'base' | 'lg';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  theme: string;
  onToggleTheme: () => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  onRequestResetData: () => void;
  installPromptEvent: Event | null;
  onInstallRequest: () => void;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}> = ({ label, icon, isActive, onClick, isMobile = false }) => {
  const baseClasses = isMobile 
    ? "flex items-center space-x-3 px-4 py-2.5 text-base w-full" 
    : "flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors duration-200";
  
  const activeClasses = isMobile 
    ? "bg-brand-primary text-text-on-color font-semibold"
    : "bg-brand-primary text-text-on-color font-semibold";

  const inactiveClasses = isMobile
    ? "text-text-primary dark:text-slate-200 hover:bg-surface-hover dark:hover:bg-slate-700"
    : "text-text-secondary dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-700 hover:text-text-primary dark:hover:text-slate-100";

  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

const SunIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentView, setView, theme, onToggleTheme, fontSize, onFontSizeChange, onRequestResetData, installPromptEvent, onInstallRequest }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const navItems: { label: string, icon: React.ReactNode, view: View }[] = [
      { label: 'Dashboard', icon: ICONS.calendar, view: 'dashboard'},
      { label: 'Enrollment', icon: ICONS.enrollment, view: 'enrollment'},
      { label: 'Teachers', icon: ICONS.teachers, view: 'teachers'},
      { label: 'Students', icon: ICONS.users, view: 'students'},
      { label: 'Billing', icon: ICONS.billing, view: 'billing'},
  ];

  const fontSizeOptions = [
    { size: 'sm', label: 'Small' },
    { size: 'base', label: 'Normal' },
    { size: 'lg', label: 'Large' },
  ] as const;

  return (
    <>
      <header className="bg-surface-header/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-surface-border dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl">
                <span className="font-light text-text-primary dark:text-slate-100">Grey</span><span className="font-extrabold text-brand-secondary-deep-dark dark:text-brand-secondary">Harmonics</span>
              </h1>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center md:space-x-1 lg:space-x-2">
              {navItems.map(item => (
                 <NavButton
                    key={item.view}
                    label={item.label}
                    icon={item.icon}
                    isActive={currentView === item.view}
                    onClick={() => setView(item.view)}
                 />
              ))}
               <div className="border-l border-surface-border dark:border-slate-700 h-6 mx-2"></div>
               <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                  className={`p-2 rounded-full transition-colors text-text-secondary dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-700 hover:text-text-primary dark:hover:text-slate-100 ${isSettingsOpen ? 'bg-surface-hover dark:bg-slate-700' : ''}`}
                  aria-label="Open settings menu"
                  aria-haspopup="true"
                  aria-expanded={isSettingsOpen}
                >
                    {React.cloneElement<React.SVGProps<SVGSVGElement>>(ICONS.settings as React.ReactElement, { className: 'h-5 w-5' })}
                </button>
                {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-lg z-40 py-1 origin-top-right animate-[scale-in_100ms_ease-out]">
                        <ul>
                            {installPromptEvent && (
                                <>
                                    <li>
                                        <button
                                            onClick={() => {
                                                onInstallRequest();
                                                setIsSettingsOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-text-primary dark:text-slate-200 bg-brand-primary-light dark:bg-brand-primary/20 hover:bg-brand-primary/30 transition-colors flex items-center space-x-3"
                                        >
                                            {React.cloneElement<React.SVGProps<SVGSVGElement>>(ICONS.install as React.ReactElement, { className: 'h-4 w-4' })}
                                            <span>Install App</span>
                                        </button>
                                    </li>
                                    <li role="separator" className="border-b border-surface-border dark:border-slate-700 my-1"></li>
                                </>
                            )}
                            <li className="px-4 pt-2 pb-1 text-xs font-semibold text-text-tertiary dark:text-slate-500 uppercase tracking-wider">Appearance</li>
                            <li>
                                <button
                                    onClick={onToggleTheme}
                                    className="w-full text-left px-4 py-2 text-text-primary dark:text-slate-200 hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                                >
                                    <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                                    {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
                                </button>
                            </li>
                            <li>
                                <div className="px-4 py-2">
                                    <label className="text-sm font-medium text-text-primary dark:text-slate-200">Font Size</label>
                                    <div className="mt-2 flex bg-surface-input dark:bg-slate-900 rounded-md p-1 space-x-1">
                                    {fontSizeOptions.map(item => (
                                        <button 
                                            key={item.size}
                                            onClick={() => onFontSizeChange(item.size)} 
                                            className={`w-full text-center text-xs p-1 rounded-md transition-colors ${fontSize === item.size ? 'bg-brand-primary text-text-on-color font-semibold shadow' : 'text-text-secondary dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-700'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                    </div>
                                </div>
                            </li>
                             <li role="separator" className="border-b border-surface-border dark:border-slate-700 my-1"></li>
                             <li className="px-4 pt-2 pb-1 text-xs font-semibold text-text-tertiary dark:text-slate-500 uppercase tracking-wider">Data</li>
                             <li>
                                <button
                                    onClick={() => {
                                        setView('trash');
                                        setIsSettingsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-text-primary dark:text-slate-200 hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
                                >
                                    {React.cloneElement<React.SVGProps<SVGSVGElement>>(ICONS.trash as React.ReactElement, { className: 'h-4 w-4' })}
                                    <span>View Trash</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        onRequestResetData();
                                        setIsSettingsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-status-red hover:bg-status-red-light dark:hover:bg-status-red/20 transition-colors flex items-center space-x-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.01-1.742 3.01H4.42c-1.53 0-2.493-1.676-1.743-3.01l5.58-9.92zM10 5a1 1 0 011 1v3a1 1 0 01-2 0V6a1 1 0 011-1zm1 5a1 1 0 10-2 0v.01a1 1 0 102 0V10z" clipRule="evenodd" /></svg>
                                    <span>Reset Application Data</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
            </nav>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary dark:text-slate-300 hover:text-text-primary dark:hover:text-slate-100 hover:bg-surface-hover dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                   <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30" id="mobile-menu">
             <div className="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" onClick={() => setIsMenuOpen(false)}></div>
             <div className="fixed top-16 left-0 right-0 bg-surface-header dark:bg-slate-800 shadow-lg border-t border-surface-border dark:border-slate-700">
                <div className="pt-2 pb-3 space-y-1">
                 {navItems.map(item => (
                   <NavButton
                      key={item.view}
                      label={item.label}
                      icon={item.icon}
                      isActive={currentView === item.view}
                      onClick={() => {
                        setView(item.view);
                        setIsMenuOpen(false);
                      }}
                      isMobile={true}
                   />
                ))}
                {installPromptEvent && (
                    <button
                        onClick={() => {
                            onInstallRequest();
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 text-base w-full text-text-primary dark:text-slate-200 bg-brand-primary-light dark:bg-brand-primary/20 hover:bg-black/5 dark:hover:bg-brand-primary/30 rounded-md"
                    >
                        {React.cloneElement<React.SVGProps<SVGSVGElement>>(ICONS.install as React.ReactElement, { className: 'h-6 w-6' })}
                        <span>Install App</span>
                    </button>
                )}
                <div className="pt-2">
                    <div className="px-4 pb-1 text-sm font-semibold text-text-tertiary dark:text-slate-500 uppercase tracking-wider">Appearance</div>
                    <button 
                        onClick={() => onToggleTheme()} 
                        className="flex items-center justify-between space-x-3 px-4 py-2.5 text-base w-full text-text-primary dark:text-slate-200 hover:bg-surface-hover dark:hover:bg-slate-700"
                        >
                        <div className="flex items-center space-x-3">
                            {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
                            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                        </div>
                    </button>
                    <div className="px-4 py-2">
                        <div className="flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-primary dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16M8 4v16M16 4v16" /></svg>
                            <span className="text-base text-text-primary dark:text-slate-200">Font Size</span>
                        </div>
                        <div className="mt-2 flex bg-surface-input dark:bg-slate-900 rounded-lg p-1 space-x-1">
                            {fontSizeOptions.map(item => (
                                <button 
                                    key={item.size}
                                    onClick={() => onFontSizeChange(item.size)} 
                                    className={`w-full text-center text-sm p-2 rounded-md transition-colors ${fontSize === item.size ? 'bg-brand-primary text-text-on-color font-semibold shadow' : 'text-text-secondary dark:text-slate-300'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div role="separator" className="border-t border-surface-border dark:border-slate-700 my-2 mx-4"></div>
                     <div className="px-4 pb-1 text-sm font-semibold text-text-tertiary dark:text-slate-500 uppercase tracking-wider">Data</div>
                    <NavButton
                        label="View Trash"
                        icon={ICONS.trash}
                        isActive={currentView === 'trash'}
                        onClick={() => {
                            setView('trash');
                            setIsMenuOpen(false);
                        }}
                        isMobile={true}
                    />
                     <button
                        onClick={() => {
                            onRequestResetData();
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 text-base w-full text-status-red hover:bg-status-red-light/50 dark:hover:bg-status-red/20 rounded-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.01-1.742 3.01H4.42c-1.53 0-2.493-1.676-1.743-3.01l5.58-9.92zM10 5a1 1 0 011 1v3a1 1 0 01-2 0V6a1 1 0 011-1zm1 5a1 1 0 10-2 0v.01a1 1 0 102 0V10z" clipRule="evenodd" /></svg>
                        <span>Reset Data</span>
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
       <style>{`
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-\\[scale-in_100ms_ease-out\\] {
            animation: scale-in 100ms ease-out;
        }
       `}</style>
    </>
  );
};