// src/components/RedirectIfAuth.tsx
import { Navigate } from "react-router-dom";

interface RedirectIfAuthProps {
  children: React.ReactNode;
}

export const RedirectIfAuth: React.FC<RedirectIfAuthProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Already logged in → redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};
