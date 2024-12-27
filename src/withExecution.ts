import { throwIfNotCallable, isSynchronous } from "./utils"

type CallbackEventOptions<F extends (...args: any) => any> = {
  event: string
  callee: F
  args: Parameters<F>
  result?: ReturnType<F>
  caught?: unknown
}

const _handleEvent = <F extends (...args: any) => any>({handler, event, callee, args, result} : CallbackEventOptions<F> & { handler?: (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> | void | undefined }) => 
  handler?.({ event, callee, args, result })?.result ?? (result || callee(...args))

const _handleCatch = <F extends (...args: any) => any>(
  onCatch: (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> | void | undefined,
  callee: F,
  args: Parameters<F>,
  caughtValue: unknown
) => {
  const { caught, result } = onCatch?.({
    event: "onCatch",
    callee,
    args,
    caught: caughtValue,
  }) || { caught: caughtValue }
  if (caught) { throw caught}
  return result
}

const withExecution = <F extends (...args: any) => any>(
  c: F,
  handlers:
    | {
        [handler: "onCall" | "onReturn" | "onCatch" | string]: (
          params: CallbackEventOptions<F>
        ) => Partial<CallbackEventOptions<F>> | void
      }
    | undefined = {}
) => {
  const wrapped = isSynchronous(c)
    ? function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F
        try {
          return _handleEvent({event: "onReturn", callee, args, handler: handlers.onReturn,
            ...(_handleEvent({event: "onCall", callee, args, handler: handlers.onCall}))
          }).result
        } catch (caughtValue) {
          return _handleCatch(handlers.onCatch, callee, args, caughtValue)
        }
      }
    : async function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F
        return Promise.resolve(_handleEvent({handler: handlers.onCall, event: "onCall", callee, args}).result)
        .then(result => _handleEvent({handler: handlers.onReturn, event: "onReturn", callee, args, result}).result)
        .catch(caughtValue => _handleCatch(handlers.onCatch, callee, args, caughtValue))
      }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(c))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(c))

  return wrapped as F
}

export { withExecution }
