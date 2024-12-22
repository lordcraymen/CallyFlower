import { OnCompletionHandler } from "./types";
import { asyncMerge, syncMerge, throwIfNotCallable, isSynchronous } from "./utils";

/**
 * this handler is called when the function passed to it completes execution.
 * it is called with the result of the function, and can be uses to modify the result, or a cought value if the function throws a value.
 * it is the foundation of the onResult handler, that is called only when the function returns a value (not undefined)
 * @param callee 
 * @param onReturn 
 */
const withOnCompletion = <F extends (...args: any) => any>(
    callee: F,
    onReturn?: OnCompletionHandler<F>
) => {
    throwIfNotCallable(callee);

    return !onReturn
        ? callee
        : isSynchronous(callee)
            ? (...args: Parameters<F>): ReturnType<F> | undefined => {
                const result = callee(...args);
                return syncMerge({ callee, args, caught:undefined, result, event: "onCompletion" }, onReturn).result;
            }
            : async (...args: Parameters<F>): Promise<ReturnType<F> | undefined> => {
                const result = await callee(...args);
                return (await asyncMerge({ callee, args, result, caught:undefined, event: "onCompletion" }, onReturn)).result;
            };
}


export { withOnCompletion };