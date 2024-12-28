import { throwIfNotCallable } from "./utils"

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
  throwIfNotCallable(callee);
  const wrapped = function (this: any, ...args: Parameters<F>) {
        let overload: { result: ReturnType<F> | undefined, caught: unknown | undefined, callee: F, args: Parameters<F> }
         = { result: undefined, caught: undefined, callee: callee.bind(this) as F, args }
        try {
          if(onCall) {
            const {callee:onCallCallee, args:onCallArgs} = onCall.bind(this)({callee:overload.callee, args: overload.args}) || overload
            overload = {...overload, callee:onCallCallee || callee, args:onCallArgs || args}
            if("result" in overload) {
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
    

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee))
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee))

  //if calee is an asynchrnous function, we need to wrap wrapped in an async function
  return (callee as any)[Symbol.toStringTag] === "AsyncFunction" ? (async function(this: any, ...args: Parameters<F>) {
    return wrapped.bind(this)(...args)
  }) as any : wrapped as F
}

export { withExecution }
