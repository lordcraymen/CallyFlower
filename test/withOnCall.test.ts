import { OnCallHandler } from "../src/types";
import { withOnCall }  from "../src/withOnCall";
import { vi } from "vitest";

describe("withOnCall", () => {

  it("should return a function", () => {
    const onCall = withOnCall(() => {});
    expect(onCall).toBeInstanceOf(Function);
  });

  it("should return the original function if no event handler is provided", () => {
    const fn = () => {};
    const wrapped = withOnCall(fn);
    expect(wrapped).toBe(fn);
  });

  it("should throw an error if the callee is not a function", () => {
    expect(() => withOnCall(1 as any)).toThrow();
  });

  it("should call the onCall event handler", () => {
    const onCall = vi.fn();
    const wrapped = withOnCall((p)=>p,onCall);
    wrapped("test");
    expect(onCall).toHaveBeenCalledWith(
      {
        callee: expect.any(Function),
        args: ["test"],
        event: "onCall"
      }
    );
  });

  it("should pass the arguments to the onCall event handler", () => {
    const spy = vi.fn();
    const originalFunction = vi.fn();
    const wrapped = withOnCall(originalFunction, spy);
    wrapped("test");
    expect(spy).toHaveBeenCalledWith({callee: originalFunction, args: ["test"], event: "onCall"});
  });

  it("should short circuit the function with the result returned from the onCall event handler", () => {
    const onCall = () => ({result: "result"});
    const originalFunction = vi.fn();
    const wrapped = withOnCall(originalFunction, onCall);
    const result = wrapped("test");
    expect(result).toBe("result");
  });
});