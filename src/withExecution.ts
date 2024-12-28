import { throwIfNotCallable, isSynchronous } from "./utils"

type CallbackEventOptions<F extends (...args: any) => any> = {
  callee: F
  args: Parameters<F>
  result?: ReturnType<F>
  caught?: unknown
}

const _handleEvent = <F extends (...args: any) => any>(
  { handler, callee, args, result }: CallbackEventOptions<F> & {
    handler?: (
      params: CallbackEventOptions<F>
    ) => Partial<CallbackEventOptions<F>> | void | undefined;
  }
) => {
  const handlerResult = handler?.({callee, args, result });
  return handlerResult && typeof handlerResult === "object" && "result" in handlerResult
    ? handlerResult.result
    : result ?? callee(...args);
};



const _handleCatch = <F extends (...args: any) => any>(
  { handler, callee, args, caughtValue }:
  {
  handler?: (params: CallbackEventOptions<F>) => {result?: ReturnType<F>, caught?: unknown} | void,
  callee: F,
  args: Parameters<F>,
  caughtValue: unknown}
) => {
  const { caught, result } = handler?.({ callee, args, caught: caughtValue}) || { caught: caughtValue }
  if (caught) { throw caught}
  return result
}

const withExecution = <F extends (...args: any) => any>(
  c: F,
  { onCall, onReturn, onCatch }: {
    onCall?: (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> | void;
    onReturn?: (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> | void;
    onCatch?: (params: CallbackEventOptions<F>) => {result?: ReturnType<F>, caught?: unknown} | void;
  }
) => {
  const wrapped = isSynchronous(c)
    ? function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F
        try {
          const onCallResult = _handleEvent({ callee, args, handler: onCall }) || {};
          return _handleEvent({ callee, args, handler: onReturn, ...onCallResult }).result;
        } catch (caughtValue) {
          return _handleCatch({ handler: onCatch, callee, args, caughtValue });
        }
      }
    : async function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F
        return Promise.resolve(_handleEvent({handler: onCall, callee, args}).result)
        .then(result => _handleEvent({handler: onReturn, callee, args, result}).result)
        .catch(caughtValue => _handleCatch({handler: onCatch, callee, args, caughtValue}))
      }

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(c))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(c))

  return wrapped as F
}

export { withExecution }
