import { OnResultHandler } from "./types";
import { throwIfNotCallable } from "./utils";
import { withOnCompletion } from "./withOnCompletion";

/**
 * Wraps a function with an `onResult` event handler, allowing modification of the function's result.
 * The returned function calls the original function and applies the `onResult` event afterward.
 * internally it uses the withOnCompletion function to wrap the original function, but hilters our results that are not "undefined".
 * @template F - The type of the function to wrap.
 * @param {F} callee - The original function to wrap.
 * @param {OnResultHandler<F>} onCall - The handler invoked before the function call to modify the arguments.
 * @returns {F} A new function that wraps the original function with the `onResult` event handler.
 */
const withOnResult = <F extends (...args: any) => any>(
    callee: F,
    onResult?: OnResultHandler<F>
) => {
    return withOnCompletion(callee, onResult ? ({ result, ...params }) => {
        if (result !== undefined) {
            return onResult({ result, ...params, callee, event: "onResult" }) as void | { result: ReturnType<F> };
        }
    }: undefined);
};


export { withOnResult };