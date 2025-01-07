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
    params: { event: "onReturn", callee: F, args: Parameters<F>, result: ReturnType<F>, caught:unknown }) => {
    result?: ReturnType<F>, caught?:unknown } | void
  
  type onCatch<F extends (...args: any) => any> = (
    params: { event: "onCatch", callee: F, args: Parameters<F>, caught: unknown }) => {
    caught?: unknown
    result?: ReturnType<F> | unknown
  } | void
  
  type Hooks<F extends (...args: any) => any> = {
    onCall?: onCall<F>
    onReturn?: onReturn<F>
    onCatch?: onCatch<F>
  }

  export { type Overload, type onCall, type onReturn, type onCatch, type Hooks }