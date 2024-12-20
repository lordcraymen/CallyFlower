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
  it("should return the original result if the event handler does not return a result", () => {
    const result = syncMerge({ callee: () => {}, args: [], caught: undefined, event: "onCatch" }, undefined);
    expect(result).toBe(undefined);
  });

  it("should return the result from the event handler", () => {
    const result = syncMerge({ callee: () => {}, args: [], caught: undefined, event: "onCatch" }, () => "result");
    expect(result).toBe("result");
  });

  it("should throw the error from the event handler", () => {
    expect(() => syncMerge({ callee: () => {}, args: [], caught: undefined, event: "onCatch" }, () => { throw new Error("error") })).toThrow();
  });
});