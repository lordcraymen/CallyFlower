import { withEvents } from "../src/withEvents";
import { vi } from "vitest";

describe("withEvents", () => {
    
  it("should return the original function if no event handler is provided", () => {
    const fn = vi.fn();
    const wrapped = withEvents(fn, {});
    expect(wrapped).toBe(fn);
  });

  it("should return a function", () => {
    const onCall = withEvents(() => {}, {});
    expect(onCall).toBeInstanceOf(Function);
  });

  it("should throw an error if the callee is not a function", () => {
    expect(() => withEvents(1 as any, {})).toThrow();
  });

  it("should call the onCall event handler", () => {
    const onCall = vi.fn();
    const wrapped = withEvents(vi.fn(), {onCall});
    wrapped();
    expect(onCall).toHaveBeenCalled();
  });

  it("should pass the arguments to the onCall event handler", () => {
    const onCall = vi.fn();
    const wrapped = withEvents(vi.fn(), {onCall});
    wrapped(1, 2, 3);
    expect(onCall).toHaveBeenCalledWith(1, 2, 3);
  });

  it("should short circuit the function with the result returned from the onCall event handler", () => {
    const onCall = vi.fn((params) => ({ result: "result" }));
    const wrapped = withEvents(vi.fn(), {onCall});
    const result = wrapped();
    expect(result).toBe("result");
  });

  it("should call the onResult event handler", () => {
    const onResult = vi.fn();
    const wrapped = withEvents(vi.fn(() => "result"), {onResult});
    wrapped();
    expect(onResult).toHaveBeenCalled();
  });

  it("should pass the result to the onResult event handler", () => {
    const onResult = vi.fn();
    const wrapped = withEvents(vi.fn(() => "result"), {onResult});
    wrapped();
    expect(onResult).toHaveBeenCalledWith({result: "result", callee: expect.any(Function)});
  });

  it("should short circuit the function with the result returned from the onResult event handler", () => {
    const onResult = vi.fn((params) => ({ result: "result" }));
    const wrapped = withEvents(vi.fn(() => "result"), {onResult});
    const result = wrapped();
    expect(result).toBe("result");
  });

  it("should call the onCatch event handler", () => {
    const onCatch = vi.fn();
    const wrapped = withEvents(vi.fn(() => {throw new Error("error")}), {onCatch});
    try {
      wrapped();
    } catch (e) {
      expect(onCatch).toHaveBeenCalled();
    }
    });

    it("should pass the error to the onCatch event handler", () => {
        const onCatch = vi.fn();
        const wrapped = withEvents(vi.fn(() => {throw new Error("error")}), {onCatch});
        try {
            wrapped();
        } catch (e) {
            expect(onCatch).toHaveBeenCalledWith({error: e, callee: expect.any(Function)});
        }
    }   );

});