import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  createElement
} from "react";
import type { FunctionComponent, ReactNode } from "react";

// User interface
export interface User {
  id: number;
  email: string;
  name: string;
}

// Context type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean,
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Props type
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: FunctionComponent<AuthProviderProps> = function(props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(function() {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
  console.log("Auth state updated", { user, token, isAuthenticated: Boolean(user && token) });
}, [user, token]);

  const login = function(token: string, user: User): void {
    setUser(user);
    setToken(token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = function(): void {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  const contextValue = useMemo(function() {
    return {
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
    };
  }, [user, token]);

  return createElement(
    AuthContext.Provider,
    { value: contextValue },
    props.children
  );
};

