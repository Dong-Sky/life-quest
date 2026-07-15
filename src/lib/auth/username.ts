const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 24;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  const normalized = normalizeUsername(value);
  return normalized.length >= USERNAME_MIN_LENGTH && normalized.length <= USERNAME_MAX_LENGTH && !/\s/.test(normalized);
}

export function usernameToAuthEmail(username: string) {
  const normalized = normalizeUsername(username);
  const bytes = new TextEncoder().encode(normalized);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `user.${encoded}@users.questline.app`;
}
