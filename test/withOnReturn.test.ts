import { withOnReturn } from "../src/withOnResult";
import { vi } from "vitest";

describe("withOnReturn", () => {
  it("should return the original function if no event handler is provided", () => {
    const fn = vi.fn();
    const wrapped = withOnReturn(fn);
    expect(wrapped).toBe(fn);
  });

  it("should return a function", () => {
    const onReturn = withOnReturn(() => {});
    expect(onReturn).toBeInstanceOf(Function);
  });

  it("should call the onReturn event handler", () => {
    const onReturn = vi.fn();
    const wrapped = withOnReturn(onReturn);
    wrapped();
    expect(onReturn).toHaveBeenCalled();
  });

  it("should pass the arguments to the onReturn event handler", () => {
    const onReturn = vi.fn(({ result }) => ({ result: result * 2 }));
    const originalFunction = (a: number, b: number, c: number) => a + b + c;
    withOnReturn(originalFunction, onReturn)(1, 2, 3);
    expect(onReturn).toHaveBeenCalledWith({
      callee: originalFunction,
      args: [1, 2, 3],
      result: 6,
      event: "onReturn",
    });
  });

  it("should short circuit the function with the result returned from the onReturn event handler", () => {
    const spy = vi.fn();
    const onReturn = (params) => {
      spy(params);
      return { result: "result" };
    };
    const originalFunction = (p: string) => p;
    const wrapped = withOnReturn(originalFunction, onReturn);
    const result = wrapped("test");
    expect(result).toBe("result");
    expect(spy).toHaveBeenCalledWith({
      callee: originalFunction,
      args: ["test"],
      result: "test",
      event: "onReturn",
    });
  });
});
