import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRole, normalizeStoredRole } from './access.js';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = normalizeStoredRole(localStorage.getItem('userRole'));

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessRole(requiredRole, userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
