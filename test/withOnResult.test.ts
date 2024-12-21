import { withOnResult } from "../src/withOnResult";
import { vi } from "vitest";

describe("withOnResult", () => {
  it("should return the original function if no event handler is provided", () => {
    const fn = vi.fn();
    const wrapped = withOnResult(fn);
    expect(wrapped).toBe(fn);
  });

  it("should return a function", () => {
    const onResult = withOnResult(() => {});
    expect(onResult).toBeInstanceOf(Function);
  });

  it("should call the onResult event handler", () => {
    const onResult = vi.fn();
    const wrapped = withOnResult(onResult);
    wrapped();
    expect(onResult).toHaveBeenCalled();
  });

  it("should pass the arguments to the onResult event handler", () => {
    const onResult = vi.fn(({result})=>({ result: result*2}));
    const originalFunction = (a:number,b:number,c:number)=> a+b+c
    withOnResult(originalFunction, onResult)(1,2,3);
    expect(onResult).toHaveBeenCalledWith(
        {
            callee: originalFunction,
            args:[1,2,3],
            result: 6,
            event: "onResult"
        }
    )
  });

  it("should short circuit the function with the result returned from the onResult event handler", () => {
    const spy = vi.fn();
    const onResult = (params) => {
      spy(params);
      return { result: "result" };
    };
    const originalFunction = (p:string) => p;
    const wrapped = withOnResult(originalFunction, onResult);
    const result = wrapped("test");
    expect(result).toBe("result");
    expect(spy).toHaveBeenCalledWith({
      callee: originalFunction,
      args: ["test"],
      result: "test",
      event: "onResult",
    });
  });
});
