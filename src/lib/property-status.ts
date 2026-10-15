const NEW_LISTING_WINDOW_DAYS = 7;

export function isNewlyAdded(publishedAt: string | null, now = Date.now()): boolean {
  if (!publishedAt) return false;
  const publishedTime = Date.parse(publishedAt);
  if (!Number.isFinite(publishedTime)) return false;

  const age = now - publishedTime;
  const windowMs = NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return age >= 0 && age <= windowMs;
}
