const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function getPublicAppUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  return trimTrailingSlash(window.location.origin);
}

export function buildPublicAppUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getPublicAppUrl()}${normalizedPath}`;
}
