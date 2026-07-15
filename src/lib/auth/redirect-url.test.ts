import { describe, expect, it } from "vitest";
import { buildMagicLinkRedirectUrl } from "@/src/lib/auth/redirect-url";

describe("buildMagicLinkRedirectUrl", () => {
  it("adds the callback path to an origin", () => {
    expect(buildMagicLinkRedirectUrl("https://questline.example")).toBe("https://questline.example/auth/callback");
  });

  it("does not create a double slash for a trailing slash", () => {
    expect(buildMagicLinkRedirectUrl("https://questline.example/")).toBe("https://questline.example/auth/callback");
  });
});
