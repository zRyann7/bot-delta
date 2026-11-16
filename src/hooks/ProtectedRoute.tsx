import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("user_token");

  if (!token) {
    // Se não tem token, manda para o login
    return <Navigate to="/login" replace />;
  }

  return children;
};