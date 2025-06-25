import { throwIfNotCallable } from "./utils"
import { withResolver } from "./withResolver"
import { Hooks } from "./types"

const EMPTY_HOOKS = Object.freeze({});

/**
 * Wrap a function with execution hooks
 * @param callee - The function to wrap
 * @param hooks - The hooks to apply
 * @returns The wrapped function
 */
const withExecution = <F extends (...args: any) => any>(
  originalCallee: F,
  hooks: Hooks<F> = EMPTY_HOOKS
) => {
  throwIfNotCallable(originalCallee)

  if(hooks === EMPTY_HOOKS) return originalCallee

  function wrapped(this:any,...args:Parameters<F>) {

    const { onCall, onCatch, onResult, onCleanup } = hooks;

    return ((context,args) => { 
      let caught : unknown;
      const callee = (...args:any[]) => originalCallee.apply(context,args) as ReturnType<F>;

      const wrapped = withResolver(onCall ? () => onCall({ event: "onCall", callee , args, }) : callee as typeof callee)
      //onCall && wrapped.then(() => onCall({ event: "onCall", callee, args }))
      onCatch && wrapped.catch((e:unknown) => (caught = e, onCatch({ event:"onCatch", callee, args, caught})))
      onResult && wrapped.then((r) => onResult({ event: "onResult", callee, args, result: r as any, caught }))
      onCleanup && wrapped.finally(() => onCleanup({ event:"onCleanup", callee, args, caught}))

      return wrapped.apply(context,args);

    })(this, args); 
  }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(originalCallee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(originalCallee))

  return wrapped
}

export { withExecution }
