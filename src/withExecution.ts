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
      let result : any;
      let caught : unknown;

      const wrapped = withResolver(callee).then(r => (result = r,r))
      onCatch && wrapped.catch((e:unknown) => (caught = e, onCatch({ event:"onCatch", callee, args, caught})))
      onResult && wrapped.then((r) => onResult({ event: "onResult", callee, args, result: r as any, caught }))
      onCleanup && wrapped.finally(() => onCleanup({ event:"onCleanup", callee, args, caught}))

      wrapped.apply(context,args);
      return result;

    })(this, args); 
  }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  return wrapped
}

export { withExecution }
