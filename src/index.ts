import { withExecution } from "./withExecution";
import { onCall, onCatch, onResult, Overload } from "./types";

const withOnCall = <F extends (...args: any) => any>(
    callee: F,
    onCall?: onCall<F>
  ) => withExecution(callee, { onCall });

const withOnCatch = <F extends (...args: any) => any>(
  callee: F,
  onCatch?: onCatch<F>
) => withExecution(callee, { onCatch });

const withOnError = <F extends (...args: any) => any>(
    callee: F,
    onError?: (params: { event: "onError", callee: F, args: Parameters<F>, caught: Error}) => { caught?: Error, result?: ReturnType<F>} | void
    ) => withExecution(callee, { onCatch: (p) => onError && p.caught instanceof Error ? {...p, ...(onError({...p as any, event: "onError"})||{})} : p });

const withOnReturn = <F extends (...args: any) => any>(
  callee: F,
  onResult?: onResult<F>
) => withExecution(callee, { onResult });

const withOnCleanup = <F extends (...args: any) => any>(
  callee: F,
  onCleanup?: (params: { event: "onCleanup", callee: F, args: Parameters<F>, caught: any }) => void
) => withExecution(callee, { onCleanup });


export { withExecution, withOnCall, withOnCatch, withOnReturn, withOnError, withOnCleanup };
