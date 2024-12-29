import { throwIfNotCallable } from "./utils"

type Overload<F extends (...args: any) => any> = {
  callee: F
  args: Parameters<F>
  result?: ReturnType<F>
  caught?: any
}

type onCall<F extends (...args: any) => any> = (params: { event: "onCall", callee: F, args: Parameters<F> }
) => {
  callee?: F
  args?: Parameters<F>
  result?: ReturnType<F>
} | void;

type onReturn<F extends (...args: any) => any> = (
  params: { event: "onReturn", callee: F, args: Parameters<F>, result: ReturnType<F> }) => {
  result?: ReturnType<F> } | void

type onCatch<F extends (...args: any) => any> = (
  params: { event: "onCatch", callee: F, args: Parameters<F>, caught: unknown }) => {
  caught?: any
  result?: ReturnType<F>
} | void

type Hooks<F extends (...args: any) => any> = {
  onCall?: onCall<F>
  onReturn?: onReturn<F>
  onCatch?: onCatch<F>
}

//This functions checks if the handler is present, if so it calls it and returns the result
//If not, it returns the overload object filtering the "event" property
const _handle = <F extends (...args: any) => any>(
  event: string,
  overload: Overload<F>,
  handler: (...args: any) => any
): Overload<F> => {
  if(!handler) return overload
  const { event:e, ...overloaded} = handler ? {...overload, ...handler({ ...overload, event })} : overload
  return overloaded
} 

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
