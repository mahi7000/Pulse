// src/components/ProtectedRoute.tsx
import { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, user, token } = useAuth();
console.log({ isAuthenticated, user, token });

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
