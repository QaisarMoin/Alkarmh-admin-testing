import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  // Prevent redirect loop to /login
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If super_admin tries to access shop_admin/customer route, send to /superdashboard
    if (user?.role === 'super_admin' && location.pathname !== "/superdashboard") {
      return <Navigate to="/superdashboard" replace />;
    }
    // If shop_admin/customer tries to access super_admin route, send to /
    if (user?.role !== 'super_admin' && location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
  }

  // Redirect customer to settings if not already there and has no shop
  if (
    user?.role === 'customer' &&
    (!user.managedShops || user.managedShops.length === 0) &&
    location.pathname !== '/settings'
  ) {
    return <Navigate to="/settings" replace />;
  }

  // Redirect shop_admin to settings if not already there and has no shop
  if (
    user?.role === 'shop_admin' &&
    (!user.managedShops || user.managedShops.length === 0) &&
    location.pathname !== '/settings'
  ) {
    return <Navigate to="/settings" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
