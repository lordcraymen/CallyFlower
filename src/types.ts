type Overload<F extends (...args: any) => any> = {
    callee: F
    args: Parameters<F>
    result?: ReturnType<F>
    caught?: any
  }
  
  type onCall<F extends (...args: any) => any> = (params: { event: "onCall", callee: F, args: Parameters<F> }
  ) => ReturnType<F>;
  
  type onResult<F extends (...args: any) => any> = (
    params: { event: "onResult", callee: F, args: Parameters<F>, result: Awaited<ReturnType<F>>, caught:unknown }) => 
    ReturnType<F> | Awaited<ReturnType<F>> | unknown | void
  
  type onCatch<F extends (...args: any) => any> = (
    params: { event: "onCatch", callee: F, args: Parameters<F>, caught: unknown }) => ReturnType<F> | unknown | void

  type onCleanup<F extends (...args: any) => any> = (
    params: { event: "onCleanup", callee: F, args: Parameters<F>, caught: unknown }) => void
  
  type Hooks<F extends (...args: any) => any> = {
    onCall?: onCall<F>
    onResult?: onResult<F>
    onCatch?: onCatch<F>
    onCleanup?: onCleanup<F>
  }

  export { type Overload, type onCall, type onResult, type onCatch, type onCleanup, type Hooks }