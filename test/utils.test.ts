import { isSynchronous, syncMerge, asyncMerge } from "../src/utils";
import  { vi } from "vitest";

describe("isSynchronous", () => {
  it("should return true for a synchronous function", () => {
    const fn = () => {};
    expect(isSynchronous(fn)).toBe(true);
  });

  it("should return false for an async function", () => {
    const fn = async () => {};
    expect(isSynchronous(fn)).toBe(false);
  });

  it("should return false for a generator function", () => {
    const fn = function* () {};
    expect(isSynchronous(fn)).toBe(false);
  });

  it("should return false for a function that returns a promise", () => {
    const fn = () => Promise.resolve();
    expect(isSynchronous(fn)).toBe(false);
  });

  it("should return false for a function that returns a generator", () => {
    const fn = function* () { yield; };
    expect(isSynchronous(fn)).toBe(false);
  });
});

describe("syncMerge", () => {
  it("should return the original data if the transformer function is nullish", () => {
    const data = { test: "test" };
    const { test } = syncMerge(data, undefined);
    expect(test).toBe(data.test);
  });

  it("should transform input using a transformer", () => {
    const { test } = syncMerge({ test: "test" }, ({ test }) => ({ test: test + "ed" }));
    expect(test).toBe("tested");
  });
});