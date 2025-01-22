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

  function wrapped(this:any,...args:Parameters<F>) {
    return ((context,args) => { 
      let result; 
      let params = onCall ? onCall({ args, callee }) : { callee, args };
      result = withResolver(callee).then(r => (result = r,onResult ? onResult({callee, args}) : {} )).apply(context,args);
      return result; 
    })(this, args); 
  }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  return wrapped
}

export { withExecution }
