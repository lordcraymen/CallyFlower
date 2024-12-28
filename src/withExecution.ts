import { throwIfNotCallable, isSynchronous } from "./utils"

type CallbackEventOptions<F extends (...args: any) => any> = {
  callee: F
  args: Parameters<F>
  result?: ReturnType<F>
  caught?: unknown
}

/*

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

*/

const withExecution = <F extends (...args: any) => any>(
  callee: F,
  { onCall, onReturn, onCatch }: {
    onCall?: ({callee,args}:{callee:F, args:Parameters<F>}) => { callee?: F, args?: Parameters<F>, result?: ReturnType<F>} | void;
    onReturn?: ({callee,args,result}:{callee:F, args:Parameters<F>, result:ReturnType<F>}
    ) => { result?: ReturnType<F>} | void;
    onCatch?: ({callee,args,caught}:{callee:F, args:Parameters<F>, caught:unknown}) => {
      result?: ReturnType<F>, caught?: unknown} | void;
  } = {}
) => {
  const wrapped = isSynchronous(callee)
    ? function (this: any, ...args: Parameters<F>) {
        let overload = { result: undefined, caught: undefined, callee, args } as CallbackEventOptions<F>
        try {
          if(onCall) {
            const {callee:onCallCallee, args:onCallArgs} = onCall.bind(this)({callee, args}) || overload
            overload = {...overload, callee:onCallCallee || callee, args:onCallArgs || args}
            if(typeof overload === "object" && "result" in overload) {
              return overload.result
            }
          }
          
          overload.result = overload.callee.apply(this, overload.args);

          if(onReturn) {
            const { result } = onReturn.bind(this)({callee:overload.callee, args:overload.args, result:overload.result!}) || overload
            overload.result = result 
          }
          
          return overload.result;

        } catch (caughtValue) {
          overload.caught = caughtValue
          if(onCatch) {
            const { result, caught } = onCatch.bind(this)({callee:overload.callee, args:overload.args, caught:overload.caught}) || overload
            overload.result = result
            overload.caught = caught
          }
          if(overload.caught) { throw overload.caught }
          
          return overload.result
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
