import { describe, expect, it } from "vitest";
import { roundToCents } from "./rounding";

describe("roundToCents", () => {
  it("rounds to the nearest cent", () => {
    expect(roundToCents(893.104)).toBe(893.1);
    expect(roundToCents(41.905)).toBe(41.91);
  });

  it("does not introduce floating point drift", () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });
});
