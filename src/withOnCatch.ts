import { OnCatchHandler } from "./types";
import { asyncMerge, syncMerge, isSynchronous, throwIfNotCallable } from "./utils";

/** @internal */
const _handleCatch = async <F extends (...args: any) => any>(
  callee: F,
  args: Parameters<F>,
  onCatch?: OnCatchHandler<F>
): Promise<ReturnType<F> | undefined> => {
  const isSync = isSynchronous(callee);
  try {
    return isSync ? callee(...args) : await callee(...args);
  } catch (caught: unknown) {
    const merged = isSync
      ? syncMerge({ callee, args, caught, event: "onCatch" }, onCatch)
      : await asyncMerge({ callee, args, caught, event: "onCatch" }, onCatch);

    if (merged.result) {
      return merged.result;
    } else {
      throw merged.caught;
    }
  }
};


/**
 * Wraps a function with an `onCatch` event handler, allowing modification of the function's caught error.
 * The returned function calls the original function and applies the `onCatch` event if an error is caught.
 * It can be used to modify the error before it is rethrown, or to suppress the error and return a value.
 *
 * @template F - The type of the function to wrap.
 * @param {F} callee - The original function to wrap.
 * @param {OnCatchHandler<F>} onCatch - The handler invoked when an error is caught to modify the error or return a value.
 * @returns {F} A new function that wraps the original function with the `onCatch` event handler.
 */
const withOnCatch = <F extends (...args: any) => any>(
  callee: F,
  onCatch?: OnCatchHandler<F>
) => {
  throwIfNotCallable(callee);

  return !onCatch
    ? callee : isSynchronous(callee)
      ? (...args: Parameters<F>): ReturnType<F> | undefined =>
        _handleCatch(callee, args, onCatch) as ReturnType<F>
      : async (...args: Parameters<F>): Promise<ReturnType<F> | undefined> =>
        _handleCatch(callee, args, onCatch);
};

export { withOnCatch };
