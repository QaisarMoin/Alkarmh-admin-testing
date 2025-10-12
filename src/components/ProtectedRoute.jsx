import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole, requiredRoles, render }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check multiple role requirements
  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // Block workers from accessing super admin routes
  if (user?.role === 'worker' && location.pathname.startsWith('/super')) {
    return <Navigate to="/" replace />;
  }

  if (render) {
    return render({ user, isAuthenticated });
  }
  
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
