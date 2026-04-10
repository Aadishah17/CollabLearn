import { useEffect, useState } from 'react';
import { requestJson } from '../../services/apiClient';
import { hasStoredSession } from '../../utils/session';
import {
  findPublicItemBySlug,
  normalizePublicCollection,
  normalizePublicRecord,
  pickFallbackPublicItem,
} from './publicContent.js';

const sessionSnapshot = () => ({
  hasSession: hasStoredSession(),
  userRole: typeof localStorage === 'undefined' ? 'user' : localStorage.getItem('userRole'),
  isSuperAdmin:
    typeof localStorage === 'undefined' ? false : localStorage.getItem('isSuperAdmin') === 'true',
});

export function usePublicSession() {
  const [session, setSession] = useState(sessionSnapshot);

  useEffect(() => {
    const sync = () => setSession(sessionSnapshot());
    window.addEventListener('storage', sync);
    window.addEventListener('profileUpdated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profileUpdated', sync);
    };
  }, []);

  return session;
}

export async function loadPublicItems({
  listPath,
  detailPath,
  listKeys,
  detailKeys,
  slug,
  fallbackItems,
}) {
  try {
    const payload = await requestJson(listPath);
    const items = normalizePublicCollection(payload, listKeys);
    const match = findPublicItemBySlug(items, slug);
    if (match) {
      return { item: match, items, source: 'api-list' };
    }

    if (slug && detailPath) {
      const detailPayload = await requestJson(detailPath(slug));
      const detail = normalizePublicRecord(detailPayload, detailKeys);
      if (detail) {
        return { item: detail, items, source: 'api-detail' };
      }
    }

    return {
      item: pickFallbackPublicItem(items.length ? items : fallbackItems, slug),
      items: items.length ? items : fallbackItems,
      source: 'fallback-empty',
    };
  } catch (error) {
    if (slug && detailPath) {
      try {
        const detailPayload = await requestJson(detailPath(slug));
        const detail = normalizePublicRecord(detailPayload, detailKeys);
        if (detail) {
          return { item: detail, items: fallbackItems, source: 'api-detail', warning: error.message };
        }
      } catch {
        // Fall through to fallback content.
      }
    }

    return {
      item: pickFallbackPublicItem(fallbackItems, slug),
      items: fallbackItems,
      source: 'fallback-error',
      warning: error.message,
    };
  }
}

