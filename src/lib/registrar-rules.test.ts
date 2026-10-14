import { describe, expect, it } from "vitest";
import { canGrantRole, canUseRegistrar, formatMatric } from "./registrar-rules";

describe("registrar rules", () => {
  it("formats matric numbers as ZC/2026/0001", () => {
    expect(formatMatric("ZC", "/", 2026, 1, 4)).toBe("ZC/2026/0001");
    expect(formatMatric("ZC", "/", 2026, 125, 4)).toBe("ZC/2026/0125");
  });
  it("only registrar-level roles open the dashboard", () => {
    expect(canUseRegistrar(["registrar"])).toBe(true);
    expect(canUseRegistrar(["provost"])).toBe(true);
    expect(canUseRegistrar(["lecturer", "hod"])).toBe(false);
  });
  it("registrar can grant lecturer but not provost", () => {
    expect(canGrantRole(["registrar"], "lecturer")).toBe(true);
    expect(canGrantRole(["registrar"], "provost")).toBe(false);
    expect(canGrantRole(["super_admin"], "provost")).toBe(true);
  });
});
