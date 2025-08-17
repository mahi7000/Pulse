import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  createElement
} from "react";
import type { FunctionComponent, ReactNode } from "react";

// Context type
export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Custom hook
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Props type
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider component
export const ThemeProvider: FunctionComponent<ThemeProviderProps> = function(props) {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize from localStorage
  useEffect(function() {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
    }
  }, []);

  // Apply theme class to <html>
  useEffect(function() {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = function(): void {
    setDarkMode(prev => !prev);
  };

  const contextValue = useMemo(function() {
    return {
      darkMode,
      toggleDarkMode,
    };
  }, [darkMode]);

  return createElement(
    ThemeContext.Provider,
    { value: contextValue },
    props.children
  );
};
