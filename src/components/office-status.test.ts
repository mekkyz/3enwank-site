import { describe, expect, it } from "vitest";
import { statusOf, type Hours } from "./office-status";

const t: Hours = { open: "Open now", closedToday: "opens at 9 today", closedTomorrow: "back tomorrow", closedWeekend: "back Sunday" };

describe("the office badge", () => {
  it("is open inside Sunday to Thursday, 9 to 18", () => {
    expect(statusOf({ day: "Sun", hour: 9 }, t)).toEqual({ open: true, text: t.open });
    expect(statusOf({ day: "Thu", hour: 17 }, t)).toEqual({ open: true, text: t.open });
  });

  it("closes at 18:00, not after it", () => {
    expect(statusOf({ day: "Mon", hour: 18 }, t)!.open).toBe(false);
    expect(statusOf({ day: "Mon", hour: 17 }, t)!.open).toBe(true);
  });

  it("says today before opening and tomorrow after closing", () => {
    expect(statusOf({ day: "Mon", hour: 7 }, t)!.text).toBe(t.closedToday);
    expect(statusOf({ day: "Mon", hour: 20 }, t)!.text).toBe(t.closedTomorrow);
  });

  it("points at Sunday from Thursday evening right through the weekend", () => {
    // The one an evening visitor on Thursday actually needs: not "tomorrow", which is Friday.
    expect(statusOf({ day: "Thu", hour: 19 }, t)!.text).toBe(t.closedWeekend);
    expect(statusOf({ day: "Fri", hour: 11 }, t)!.text).toBe(t.closedWeekend);
    expect(statusOf({ day: "Sat", hour: 11 }, t)!.text).toBe(t.closedWeekend);
    // Saturday before nine is still the weekend, not "opens at 9 today".
    expect(statusOf({ day: "Sat", hour: 7 }, t)!.text).toBe(t.closedWeekend);
  });

  it("says nothing when the browser cannot tell us the time in Cairo", () => {
    expect(statusOf(null, t)).toBeNull();
  });
});
