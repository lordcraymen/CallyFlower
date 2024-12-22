import { OnReturnHandler } from "./types";
import { asyncMerge, syncMerge, throwIfNotCallable, isSynchronous } from "./utils";

/**
 * this handler is called when the function returns, regardless of wether it returns undefined or not
 * it is called with the result of the function.
 * it is the foundation of the onResult handler, that is called only when the function returns a value (not undefined)
 * @param callee 
 * @param onReturn 
 */
const withOnReturn = <F extends (...args: any) => any>(
    callee: F,
    onReturn?: OnReturnHandler<F>
) => {
    throwIfNotCallable(callee);

    return !onReturn
        ? callee
        : isSynchronous(callee)
            ? (...args: Parameters<F>): ReturnType<F> => {
                const result = callee(...args);
                return syncMerge({ callee, args, result, event: "onReturn" }, onReturn).result;
            }
            : async (...args: Parameters<F>): Promise<ReturnType<F> | undefined> => {
                const result = await callee(...args);
                return (await asyncMerge({ callee, args, result, event: "onReturn" }, onReturn)).result;
            };
}


export { withOnReturn };