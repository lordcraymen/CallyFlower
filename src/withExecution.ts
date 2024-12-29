import { throwIfNotCallable } from "./utils"

type Overload<F extends (...args: any) => any> = {
  callee: F
  args: Parameters<F>
  result?: ReturnType<F>
  caught?: unknown
}

type HandlerParams<F extends (...args: any) => any, E> = Overload<F> & { event: E }

type OnCall<F extends (...args: any) => any> = (
  params: HandlerParams<F,"onCall">
) => Partial<Pick<Overload<F>, "callee" | "args" | "result">> | void;

type OnReturn<F extends (...args: any) => any> = (params: Partial<Omit<HandlerParams<F,"onReturn">, "caught">> 
) => Partial<Pick<Overload<F>, "result">> | void

type OnCatch<F extends (...args: any) => any> = (params: 
  Partial<Omit<HandlerParams<F,"onCatch">, "result">>
) => Partial<Pick<Overload<F>, "result" | "caught">> | void

interface Hooks<F extends (...args: any) => any> {
  onCall?: OnCall<F>
  onReturn?: OnReturn<F>
  onCatch?: OnCatch<F>
}

//This functions checks if the handler is present, if so it calls it and returns the result
//If not, it returns the overload object filtering the "event" property
const _handle = <F extends (...args: any) => any>(
  event: string,
  overload: Overload<F>,
  handler: (Hooks<F>)[keyof Hooks<F>]
): Overload<F> => {
  if (handler) {
    const tmp = handler({
      ...overload,
      event
    });
    if (tmp) return { ...overload, ...tmp };
  }
  return overload;
};

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
