import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ allowedRoles }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to respective dashboard if role is not allowed
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'GUARD') return <Navigate to="/guard" replace />;
    if (user?.role === 'OCCUPIER') return <Navigate to="/occupier" replace />;
    
    // Fallback if role is unrecognized
    return <Navigate to="/login" replace />;
  }

  // If authenticated and role is allowed, render the children (Outlet for nested routes)
  return <Outlet />;
};

export default ProtectedRoute;
