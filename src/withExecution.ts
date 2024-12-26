import { throwIfNotCallable, isSynchronous } from "./utils";

type CallbackEventOptions<F extends (...args: any) => any> = {
  event: string;
  callee: F;
  args: Parameters<F>;
  result?: ReturnType<F>;
  caught?: unknown;
};

const withExecution = <F extends (...args: any) => any>(
  c: F,
  handlers:
    | {
        [handler: "onExecution" | "onCall" | string]: (
          params: CallbackEventOptions<F>
        ) => Partial<CallbackEventOptions<F>> | void;
      }
    | undefined = {}
) => {
  const wrapped = isSynchronous(c) ? function (this: any, ...args: Parameters<F>) {
    const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F;
    try {
      const onExecutionResult = handlers.onExecution?.({
        event: "onExecution",
        callee,
        args,
      });

      // If handler explicitly provides `result`, use it; otherwise, call `callee`
      if (onExecutionResult && "result" in onExecutionResult) {
        return onExecutionResult.result;
      }

      // No explicit `result`, so execute the original callee
      return callee(...args);
    } catch (caughtValue) {
      const { caught, result } = handlers.onCatch?.({
        event: "onCatch",
        callee,
        args,
        caught: caughtValue,
      }) || { caught: caughtValue };
      if (caught) {
        throw caught;
      }
      return result;
    }
  } : async function (this: any, ...args: Parameters<F>) {
    const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F;
    try {
      const onExecutionResult = handlers.onExecution?.({
        event: "onExecution",
        callee,
        args,
      });

      // If handler explicitly provides `result`, use it; otherwise, call `callee`
      if (onExecutionResult && "result" in onExecutionResult) {
        return onExecutionResult.result;
      }

      // No explicit `result`, so execute the original callee
      return await callee(...args);
    } catch (caughtValue) {
      const { caught, result } = handlers.onCatch?.({
        event: "onCatch",
        callee,
        args,
        caught: caughtValue,
      }) || { caught: caughtValue };
      if (caught) {
        throw caught;
      }
      return result;
    }
  }
  Object.assign(wrapped, c);

  //assign the same prototypal chain as the original function
  wrapped.prototype = c.prototype;

  return wrapped as F;
};

export { withExecution };
