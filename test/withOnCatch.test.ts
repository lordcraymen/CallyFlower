import { withOnCatch } from "../src/withOnCatch";
import { vi } from "vitest";

describe("withOnCatch", () => {

  it("should return a function", () => {
    const onCatch = withOnCatch(() => {});
    expect(onCatch).toBeInstanceOf(Function);
  });

  it("should return the original function if no event handler is provided", () => {
    const fn = () => {};
    const wrapped = withOnCatch(fn);
    expect(wrapped).toBe(fn);
  });

  it("should throw an error if the callee is not a function", () => {
    expect(() => withOnCatch(1 as any)).toThrow();
  });

  it("should call the onCatch event handler", () => {
    const onCatch = vi.fn();
    const wrapped = withOnCatch(onCatch);
    wrapped();
    expect(onCatch).toHaveBeenCalled();
  });

  it("should modify the caught error with the onCatch event handler", async () => {
    const onCatch = ({ caught }) => ({
      caught: new Error("modified " + caught.message),
    });
    const wrapped = withOnCatch(() => {
      throw new Error("error");
    }, onCatch as any);
    try {
      await wrapped();
    } catch (error) {
      expect(error.message).toBe("modified error");
    }
  });

  it("should supress an error and return a value for an async function", async () => {
    const func = async () => {
      throw new Error("test");
    };
    const onCatch = () => ({ result: "caught" });
    const wrapped = withOnCatch(func, onCatch as any);
    const result = await wrapped();
    expect(result).toBe("caught");
  });

  it("should supress an error and return a value for a sync function", () => {
    const func = () => {
      throw new Error("test");
    };
    const onCatch = () => ({ result: "caught" });
    const wrapped = withOnCatch(func, onCatch as any);
    const result = wrapped();
    expect(result).toBe("caught");
  });
});
