import { describe, expect, it } from "vitest";
import { alternatesFor, localeParams, pathFor, switchLocalePath } from "./i18n";

describe("i18n paths", () => {
  it("puts English at the root and Arabic under /ar/", () => {
    expect(pathFor("home", "en")).toBe("/");
    expect(pathFor("home", "ar")).toBe("/ar/");
    expect(pathFor("hosting", "en")).toBe("/hosting/");
    expect(pathFor("hosting", "ar")).toBe("/ar/hosting/");
  });

  it("switches locale on the same page", () => {
    expect(switchLocalePath("care", "en")).toEqual({ locale: "ar", path: "/ar/care/" });
    expect(switchLocalePath("care", "ar")).toEqual({ locale: "en", path: "/care/" });
  });

  it("generates static params for the prefixed locales only", () => {
    expect(localeParams()).toEqual([{ locale: "ar" }]);
  });

  it("builds hreflang alternates with an x-default", () => {
    expect(alternatesFor("domains", "https://3enwank.com")).toEqual({
      en: "https://3enwank.com/domains/",
      "ar-EG": "https://3enwank.com/ar/domains/",
      "x-default": "https://3enwank.com/domains/",
    });
  });
});
