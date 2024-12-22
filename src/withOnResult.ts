import { OnResultHandler } from "./types";
import { asyncMerge, syncMerge, throwIfNotCallable, isSynchronous } from "./utils";

/**
 * Wraps a function with an `onResult` event handler, allowing modification of the function's result.
 * The returned function calls the original function and applies the `onResult` event afterward.
 *
 * @template F - The type of the function to wrap.
 * @param {F} callee - The original function to wrap.
 * @param {OnResultHandler<F>} onCall - The handler invoked before the function call to modify the arguments.
 * @returns {F} A new function that wraps the original function with the `onResult` event handler.
 */
const withOnResult = <F extends (...args: any) => any>(
    callee: F,
    onResult?: OnResultHandler<F>
) => {
    throwIfNotCallable(callee);

    return !onResult
        ? callee
        : isSynchronous(callee)
            ? (...args: Parameters<F>): ReturnType<F> => {
                const result = callee(...args);
                const { result: modifiedResult } = result
                    ? syncMerge({ callee, args, result, event: "onResult" }, onResult)
                    : { result };
                return modifiedResult;
            }
            : async (...args: Parameters<F>): Promise<ReturnType<F>> => {
                const result = await callee(...args);
                const { result: modifiedResult } = result
                    ? await asyncMerge({ callee, args, result, event: "onResult" }, onResult)
                    : { result };
                return modifiedResult;
            };
};


export { withOnResult };