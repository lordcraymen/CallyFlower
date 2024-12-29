import { throwIfNotCallable } from "./utils"
import { Hooks, Overload } from "./types"

/**
 * Handle an event
 */
const _handle = <F extends (...args: any) => any>(
  event: string,
  overload: Overload<F>,
  handler: (...args: any) => any
): Overload<F> => {
  if(!handler) return overload
  const { event:e, ...overloaded} = handler ? {...overload, ...handler({ ...overload, event })} : overload
  return overloaded
} 

/**
 * Wrap a function with execution hooks
 * @param callee - The function to wrap
 * @param hooks - The hooks to apply
 * @returns The wrapped function
 */
const withExecution = <F extends (...args: any) => any>(
  callee: F,
  { onCall, onReturn, onCatch }: Hooks<F> = {}
) => {
  throwIfNotCallable(callee)
  const wrapped = function (this: any, ...args: Parameters<F>) {
    let overload: Overload<F> = { callee: callee.bind(this) as F, args}
    
    try {
      
      overload = onCall ? _handle("onCall", overload, onCall.bind(this)) : overload
      if ("result" in overload) return overload.result

      overload.result = overload.callee.apply(this, overload.args)

      overload = onReturn ? _handle("onReturn", overload, onReturn.bind(this)) : overload
      return overload.result

    } catch (caughtValue) {
      overload.caught = caughtValue
      
      overload = onCatch ? _handle("onCatch", overload, onCatch.bind(this)) : overload
      if (overload.caught) throw overload.caught

      return overload.result
    }
  }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  //if calee is an asynchrnous function, we need to wrap wrapped in an async function
  return (callee as any)[Symbol.toStringTag] === "AsyncFunction"
    ? (async function (this: any, ...args: Parameters<F>) {
        return wrapped.bind(this)(...args)
      } as any)
    : (wrapped as F)
}

export { withExecution }
