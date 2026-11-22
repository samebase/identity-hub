import { describe, expect, test } from "vitest";
import { parseOwners } from "./owners";

describe("HUB_OWNERS", () => {
  test("any lets every owner register", () => {
    expect(parseOwners(" any ")).toBe("any");
  });

  test("a list lets only its owners register", () => {
    expect(parseOwners("583231, 9919")).toEqual([{ ownerId: "583231" }, { ownerId: "9919" }]);
  });

  test.each(["", " ", "Any", "octocat", "583231,", "583231,,9919", "-1", "0", "1e3"])(
    "%j stops the deploy",
    (value) => {
      expect(() => parseOwners(value)).toThrow("HUB_OWNERS");
    },
  );
});
