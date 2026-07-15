import { describe, expect, it } from "vitest";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "./username";

describe("username authentication helpers", () => {
  it("normalizes a username before creating its internal identifier", () => {
    expect(normalizeUsername("  Sky_One  ")).toBe("sky_one");
    expect(usernameToAuthEmail("Sky_One")).toBe(usernameToAuthEmail("sky_one"));
  });

  it("creates a valid internal auth address without exposing a real email", () => {
    expect(usernameToAuthEmail("小东")).toMatch(/^user\.[a-zA-Z0-9_-]+@users\.questline\.app$/);
  });

  it("requires a short, non-space username", () => {
    expect(isValidUsername("东东")).toBe(true);
    expect(isValidUsername("a")).toBe(false);
    expect(isValidUsername("two words")).toBe(false);
  });
});
