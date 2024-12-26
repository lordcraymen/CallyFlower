import { throwIfNotCallable, isSynchronous } from "./utils";

type CallbackEventOptions<F extends (...args: any) => any> = {
  event: string;
  callee: F;
  args: Parameters<F>;
  result?: ReturnType<F>;
  caught?: unknown;
};
/*
const withExecution = <F extends (...args: any) => any>(
  callee: F,
  handlers: { 
    [handler: "onExecution" | "onCall" | string]: 
    (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> 
  } | undefined = {}
) => {
  throwIfNotCallable(callee);
  const wrapped = function (this: any, ...args: Parameters<F>) {
    try {
      const executionResult = handlers.onExecution?.({ 
        event: "onExecution", 
        callee, 
        args 
      });

      // Call the original function with the correct `this` context
      const result = executionResult?.result ?? callee.apply(this, args);
      return result;
    } catch (exception) {
      const { caught, result } = handlers.onCatch?.({
        event: "onCatch",
        callee,
        args,
        caught: exception,
      }) || { caught: exception };
      if (caught) {
        throw caught;
      } else {
        return result;
      }
    }
  } as F;

  return wrapped;
};
*/

const withExecution = <F extends (...args: any) => any>(
  c: F,
  handlers: {
    [handler: "onExecution" | "onCall" | string]: 
    (params: CallbackEventOptions<F>) => Partial<CallbackEventOptions<F>> | void;
  } | undefined = {}
) => {
  return async function (this: any, ...args: Parameters<F>) {
    const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F;

    try {
      const executionResult = handlers.onExecution?.({ 
        event: "onExecution", 
        callee, 
        args 
      });

      // If handler explicitly provides `result`, use it; otherwise, call `callee`
      if (executionResult && "result" in executionResult) {
        return executionResult.result;
      }

      // No explicit `result`, so execute the original callee
      return callee(...args);
    } catch (error) {
      throw error; // Pass through any errors
    }
  } as F;
};

  
export { withExecution };