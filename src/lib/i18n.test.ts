import { describe, expect, it } from "vitest";
import { alternatesFor, anchorFor, catalogueLocale, dirFor, langTag, languageLinks, localeParams, pathFor } from "./i18n";

describe("i18n paths", () => {
  it("puts English at the root and the Arabic locales under their prefixes", () => {
    expect(pathFor("home", "en")).toBe("/");
    expect(pathFor("home", "ar")).toBe("/ar/");
    expect(pathFor("home", "ar-eg")).toBe("/ar-eg/");
    expect(pathFor("hosting", "en")).toBe("/hosting/");
    expect(pathFor("hosting", "ar")).toBe("/ar/hosting/");
    expect(pathFor("hosting", "ar-eg")).toBe("/ar-eg/hosting/");
  });

  it("links sections of the home page with the locale prefix", () => {
    expect(anchorFor("contact", "en")).toBe("/#contact");
    expect(anchorFor("about", "ar")).toBe("/ar/#about");
    expect(anchorFor("domains", "ar-eg")).toBe("/ar-eg/#domains");
  });

  it("lists every language for the menu, marking the current one, on the same page", () => {
    const links = languageLinks("care", "ar");
    expect(links.map((l) => [l.code, l.path, l.current])).toEqual([
      ["en", "/care/", false],
      ["ar", "/ar/care/", true],
      ["ar-eg", "/ar-eg/care/", false],
    ]);
    expect(links.map((l) => l.name)).toEqual(["English", "العربية", "مصري"]);
  });

  it("gives each locale its direction, language tag and catalogue copy", () => {
    expect([dirFor("en"), dirFor("ar"), dirFor("ar-eg")]).toEqual(["ltr", "rtl", "rtl"]);
    expect([langTag("en"), langTag("ar"), langTag("ar-eg")]).toEqual(["en", "ar", "ar-EG"]);
    expect([catalogueLocale("en"), catalogueLocale("ar"), catalogueLocale("ar-eg")]).toEqual(["en", "ar", "ar"]);
  });

  it("generates static params for the prefixed locales only", () => {
    expect(localeParams()).toEqual([{ locale: "ar" }, { locale: "ar-eg" }]);
  });

  it("builds hreflang alternates with an x-default", () => {
    expect(alternatesFor("domains", "https://3enwank.com")).toEqual({
      en: "https://3enwank.com/domains/",
      ar: "https://3enwank.com/ar/domains/",
      "ar-EG": "https://3enwank.com/ar-eg/domains/",
      "x-default": "https://3enwank.com/domains/",
    });
  });
});
