export const USER_ROLE = 'user';
export const ADMIN_ROLE = 'admin';

export function normalizeStoredRole(role) {
  return role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
}

export function isAdminRole(role) {
  return normalizeStoredRole(role) === ADMIN_ROLE;
}

export function resolveNextRoute(fromPathname, userRole) {
  if (fromPathname && !['/login', '/signup'].includes(fromPathname)) {
    if (fromPathname.startsWith('/admin') && !isAdminRole(userRole)) {
      return '/dashboard';
    }

    return fromPathname;
  }

  return isAdminRole(userRole) ? '/admin' : '/dashboard';
}

export function canAccessRole(requiredRole, userRole) {
  return !requiredRole || normalizeStoredRole(userRole) === requiredRole;
}

export function formatAccessLabel(userRole, isSuperAdmin) {
  if (isSuperAdmin) {
    return 'Super Access';
  }

  return isAdminRole(userRole) ? 'Admin Access' : 'Member Access';
}
