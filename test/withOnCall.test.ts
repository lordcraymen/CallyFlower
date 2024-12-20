import { withOnCall }  from "../src/withOnCall";
import { vi } from "vitest";

describe("withOnCall", () => {

  it("should return the original function if no event handler is provided", () => {
    const fn = vi.fn();
    const wrapped = withOnCall(fn);
    expect(wrapped).toBe(fn);
  });

  it("should return a function", () => {
    const onCall = withOnCall(() => {});
    expect(onCall).toBeInstanceOf(Function);
  });

  it("should throw an error if the callee is not a function", () => {
    expect(() => withOnCall(1 as any)).toThrow();
  });

  it("should call the onCall event handler", () => {
    const onCall = vi.fn();
    const wrapped = withOnCall(onCall);
    wrapped();
    expect(onCall).toHaveBeenCalled();
  });

  it("should pass the arguments to the onCall event handler", () => {
    const onCall = vi.fn();
    const wrapped = withOnCall(onCall);
    wrapped(1, 2, 3);
    expect(onCall).toHaveBeenCalledWith(1, 2, 3);
  });

  it("should short circuit the function with the result returned from the onCall event handler", () => {
    const onCall = vi.fn(() => "result");
    const wrapped = withOnCall(onCall);
    const result = wrapped();
    expect(result).toBe("result");
  });
});