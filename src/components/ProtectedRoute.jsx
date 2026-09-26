import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { userLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!userLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { userLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (userLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
