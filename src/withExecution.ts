import { throwIfNotCallable } from "./utils"
import { withResolver } from "./withResolver"
import { Hooks } from "./types"


/**
 * Wrap a function with execution hooks
 * @param callee - The function to wrap
 * @param hooks - The hooks to apply
 * @returns The wrapped function
 */
const withExecution = <F extends (...args: any) => any>(
  callee: F,
  { onCall, onResult, onCatch, onCleanup }: Hooks<F> = {}
) => {
  throwIfNotCallable(callee)
  let caught: any
  let args: any
  let result: any

  const getArgs = (...a:any) => {
    args = a
    return a;
  }

  const wrapped = withResolver(getArgs)
  
  if(onCall) { wrapped.then(() => onCall({ event: "onCall", callee, args })) }
  else { wrapped.then(callee) }
  
  onCatch && wrapped.catch((caught) => onCatch({ event: "onCatch", callee, args, caught }));

  onResult && wrapped.then((result) => onResult({ event: "onReturn", callee, args, result, caught }));

  wrapped.then((r) => { result = r; return r; })

  onCleanup && wrapped.finally(() =>  { onCleanup({ event: "onCleanup", callee, args, caught }) });

  function returnFunction (...args: Parameters<F>) {
    return wrapped(...args)
  }

  Object.setPrototypeOf(returnFunction, Object.getPrototypeOf(callee))
  Object.defineProperties(returnFunction, Object.getOwnPropertyDescriptors(callee))

  return returnFunction as F
}

export { withExecution }
