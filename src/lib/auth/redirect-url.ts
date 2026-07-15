export function buildMagicLinkRedirectUrl(origin: string) {
  const baseUrl = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${baseUrl}/auth/callback`;
}
