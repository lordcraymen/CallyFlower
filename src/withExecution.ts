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
  { onCall, onReturn, onCatch }: Hooks<F> = {}
) => {
  throwIfNotCallable(callee)
  let caught: any
  let args: any
  const wrapped = withResolver((...params) => {
    args = params
    return onCall ? onCall({ event: "onCall", callee, args }) : callee(...params)
  }).catch((caught) => onCatch ? onCatch({ event: "onCatch", callee, args, caught }) : caught)
  .then((result) => onReturn ? onReturn({ event: "onReturn", callee, args, result, caught }) : result)

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  return wrapped
}

export { withExecution }
