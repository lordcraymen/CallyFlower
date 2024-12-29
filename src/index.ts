import { withExecution } from "./withExecution";
import { onCall, onCatch, onReturn } from "./types";

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
    onError?: onCatch<F>
    ) => withExecution(callee, onError && { onCatch: (p) => p.caught instanceof Error ? ((p.event = "onError" as any),onError(p)) : p });

const withOnReturn = <F extends (...args: any) => any>(
  callee: F,
  onReturn?: onReturn<F>
) => withExecution(callee, { onReturn });

const withOnResult = <F extends (...args: any) => any>(
  callee: F,
  onResult?: onReturn<F>
) => withExecution(callee, onResult && { onReturn: (p) => p.result && onResult(p) });



export { withExecution, withOnCall, withOnCatch, withOnReturn, withOnError, withOnResult };
