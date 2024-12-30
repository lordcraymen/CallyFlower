import { withExecution } from "./withExecution";
import { onCall, onCatch, onReturn, Overload } from "./types";

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
  onReturn?: onReturn<F>
) => withExecution(callee, { onReturn });

const withOnResult = <F extends (...args: any) => any>(
  callee: F,
  onResult?: ((p:Overload<F> & { event: "onResult"}) => { result?: ReturnType<F>})
) => withExecution(callee, { onReturn: (p) => onResult && "result" in p ? {...p, ...(onResult({...p, event: "onResult"})||{})} : p });



export { withExecution, withOnCall, withOnCatch, withOnReturn, withOnError, withOnResult };
