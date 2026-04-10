import {
  Briefcase,
  Calendar,
  GraduationCap,
  Home,
  MessageSquare,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Book,
} from 'lucide-react';

import { isAdminRole, resolveNextRoute } from '../auth/access.js';

const workspaceLinks = [
  { path: '/ai-learning', label: 'Learning Workspace', icon: Sparkles, featured: true },
  { path: '/modules', label: 'Modules', icon: Book },
  { path: '/browse-skills', label: 'Skills', icon: Search },
  { path: '/courses', label: 'Courses', icon: Play },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/teach', label: 'Teach', icon: GraduationCap },
];

const publicDiscoveryLinks = [
  { path: '/competitions', label: 'Competitions', icon: Trophy },
  { path: '/career', label: 'Career', icon: Briefcase },
];

export function buildMainNavLinks({ isPremium, isSuperAdmin, userRole }) {
  const adminSession = isAdminRole(userRole);
  const links = adminSession
    ? [
        {
          path: '/admin',
          label: isSuperAdmin ? 'Super Access' : 'Admin Console',
          icon: ShieldCheck,
          admin: true,
        },
      ]
    : [{ path: '/dashboard', label: 'Dashboard', icon: Home }];

  links.push(...workspaceLinks);

  if (!adminSession && isPremium === false) {
    links.push({ path: '/get-premium', label: 'Get Premium', icon: Trophy, premium: true });
  }

  return links;
}

export function resolveMainNavbarHomePath({ isGuest, userRole }) {
  if (isGuest) {
    return '/';
  }

  return resolveNextRoute(undefined, userRole);
}

export function resolveAdminWebsiteRoute() {
  return '/';
}

export function buildPublicDiscoveryLinks() {
  return publicDiscoveryLinks;
}

export function resolvePublicWebsiteEntry({ hasSession, userRole, isSuperAdmin }) {
  if (!hasSession) {
    return {
      path: '/signup',
      label: 'Get started',
    };
  }

  if (isAdminRole(userRole)) {
    return isSuperAdmin
      ? {
          path: '/browse-skills',
          label: 'Open learning site',
        }
      : {
          path: '/admin',
          label: 'Return to admin console',
        };
  }

  return {
    path: '/dashboard',
    label: 'Open dashboard',
  };
}
