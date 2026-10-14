const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrCreateCookie(name: string, persistent: boolean) {
  const match = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  const existing = match?.split('=')[1];
  if (existing && idPattern.test(existing)) return existing;
  const value = crypto.randomUUID();
  document.cookie = `${name}=${value};${persistent ? ' Max-Age=31536000;' : ''} Path=/; SameSite=Lax`;
  return value;
}

export function getVisitorContext() {
  return {
    visitorId: getOrCreateCookie('atelier_visitor_id', true),
    sessionId: getOrCreateCookie('atelier_session_id', false),
  };
}

export function getVisitorContextFromCookieHeader(cookieHeader: string | null) {
  const cookies = Object.fromEntries((cookieHeader ?? '').split(';').map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [key, value.join('=')];
  }));
  return {
    visitorId: idPattern.test(cookies.atelier_visitor_id ?? '') ? cookies.atelier_visitor_id : null,
    sessionId: idPattern.test(cookies.atelier_session_id ?? '') ? cookies.atelier_session_id : null,
  };
}

export function isVisitorId(value: unknown): value is string {
  return typeof value === 'string' && idPattern.test(value);
}
