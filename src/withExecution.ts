import { throwIfNotCallable } from "./utils"
import { withResolver } from "./withResolver"
import { Hooks } from "./types"

const throwValue = (error: any) => { throw error }

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

  const getArgs = (...a:any) => (args = a, args)

  const wrapped = withResolver(getArgs)
  
  onCall ? wrapped.then((args) => onCall({ event: "onCall", callee, args })) : wrapped.then((...args) => callee(...args))
  
  onCatch && wrapped.catch((caught) => { 
    const handledCaught = onCatch({ event: "onCatch", callee, args, caught })
    return handledCaught !== undefined ? handledCaught : throwValue(caught) 
  })

  onResult && wrapped.then((result) => { 
    const handleResult = onResult({ event: "onReturn", callee, args, result, caught })
    return handleResult !== undefined ? handleResult : result
 })

  onCleanup && wrapped.finally(() => onCleanup({ event: "onCleanup", callee, args, caught }))

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  return wrapped
}

export { withExecution }
