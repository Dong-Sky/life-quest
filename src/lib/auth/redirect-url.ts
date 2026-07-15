export function buildMagicLinkRedirectUrl(origin: string) {
  return `${origin.replace(/\\/$/, "")}/auth/callback`;
}
