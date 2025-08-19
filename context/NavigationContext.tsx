import { createContext, useContext } from 'react';
import { NavigateFunction } from 'react-router-dom';

interface NavigationContextType {
  navigate: NavigateFunction | null;
}

export const NavigationContext = createContext<NavigationContextType>({
  navigate: null
});

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
