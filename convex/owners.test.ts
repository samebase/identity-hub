import { describe, expect, test } from "vitest";
import { mayRegister, parseOwners } from "./owners";

describe("HUB_OWNERS", () => {
  test("any lets every owner register", () => {
    expect(parseOwners(" any ")).toBe("any");
    expect(mayRegister("any", "583231")).toBe(true);
  });

  test("a list lets only its owners register", () => {
    const owners = parseOwners("583231, 9919");
    expect(owners).toEqual(["583231", "9919"]);
    expect(mayRegister(owners, "9919")).toBe(true);
    expect(mayRegister(owners, "1")).toBe(false);
  });

  test.each(["", " ", "Any", "octocat", "583231,", "583231,,9919", "-1", "0", "1e3"])(
    "%j stops the deploy",
    (value) => {
      expect(() => parseOwners(value)).toThrow("HUB_OWNERS");
    },
  );
});
