

import { OnCallHandler } from "./types";
import { asyncMerge, syncMerge, throwIfNotCallable, isSynchronous } from "./utils";


/**
 * Wraps a function with an `onCall` event handler, allowing modification of the function's arguments.
 * The returned function calls the original function and applies the `onCall` event beforehand.
 * It can be used to modify the arguments before the function is called, or to short-circuit the function call.
 * This is useful for validation, logging, memoization or other pre-processing tasks.
 *
 * @template F - The type of the function to wrap.
 * @param {F} callee - The original function to wrap.
 * @param {OnCallHandler<F>} onCall - The handler invoked before the function call to modify the arguments.
 * @returns {F} A new function that wraps the original function with the `onCall` event handler.
 */
const withOnCall = <F extends (...args: any) => any>(
    callee: F,
    onCall?: OnCallHandler<F>
) => {
    throwIfNotCallable(callee);

    return isSynchronous(callee)
        ? (...args: Parameters<F>): ReturnType<F> => {
            const modifiedCall = syncMerge({ callee, args, event: "onCall" }, onCall);
            return modifiedCall.result ?? modifiedCall.callee(...modifiedCall.args);
        }
        : async (...args: Parameters<F>): Promise<ReturnType<F>> => {
            const modifiedCall = await asyncMerge({ callee, args, event: "onCall" }, onCall);
            return modifiedCall.result ?? modifiedCall.callee(...modifiedCall.args);
        };
};

export { withOnCall };