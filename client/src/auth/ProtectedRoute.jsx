import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRole, normalizeStoredRole } from './access.js';
import { hasStoredSession } from '../utils/session.js';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const hasSession = hasStoredSession();
  const storedRole = typeof localStorage === 'undefined' ? null : localStorage.getItem('userRole');
  const userRole = normalizeStoredRole(storedRole);

  if (!hasSession) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessRole(requiredRole, userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
