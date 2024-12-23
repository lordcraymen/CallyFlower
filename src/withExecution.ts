import { throwIfNotCallable, isSynchronous } from "./utils";

type CallbackEventOptions<F extends (...args: any) => any> = {
    event: string;
    callee: F;
    args: Parameters<F>;
    result?: ReturnType<F>;
    caught?: unknown;
  };
  
  const _callback = (
    parameters: CallbackEventOptions<any>,
    callbacks: {
      [name: string]: (
        params: CallbackEventOptions<any>
      ) => Partial<CallbackEventOptions<any>>;
    }
  ) => {
    const { event, callee, args, result, caught } = parameters;
    if (event === "onExecution") {
      // this should handle the cases for onCall (short circuiting) and onExecution
      // if on Call is present, it should be called with the arguments, and the result should be passed to
      // onExecution short circuiting the execution of the function
      // or it should pass the modified callee and/or args to the onExecution handler
      return callbacks.onExecution?.({
        event: "onReturn",
        callee,
        args,
        result,
        caught,
        ...(callbacks.onCall
          ? callbacks.onCall({ event: "onCall", callee, args })
          : {}),
      });
    }
    if (event === "onCatch") {
      // this should handle the cases for onCatch
      // if onCatch is present, it should be called with the caught value,
      // so that the onCatch handler can suppress errors and return a value instead
      // or if it is not present, it should return the caught value
      return callbacks.onCatch
        ? callbacks.onCatch({ event: "onCatch", callee, args, result, caught })
        : { caught };
    }
    return { callee, args, result, caught };
  };
  
  const withExecution = <F extends (...args: any) => any>(
    callee: F,
    callback: (
      params: CallbackEventOptions<F>
    ) => CallbackEventOptions<F>
  ) => {
    throwIfNotCallable(callee);
    return isSynchronous(callee)
      ? (...args: Parameters<F>): ReturnType<F> | undefined => {
          try {
            return callback({ event: "onExecution", callee, args }).result;
          } catch (error) {
            const { caught, result } = callback({
              event: "onCatch",
              callee,
              args,
              caught: error,
            });
            if (caught) {
              throw caught;
            } else {
              return result;
            }
          }
        }
      : async (...args: Parameters<F>): Promise<ReturnType<F> | undefined> => {
          return new Promise((resolve, reject) => {
            try {
              resolve(callback({ event: "onExecution", callee, args }).result);
            } catch (error) {
              const { caught, result } = callback({
                event: "onCatch",
                callee,
                args,
                caught: error,
              });
              if (caught) {
                reject(caught);
              } else {
                resolve(result);
              }
            }
          });
        };
  };
  
  export { withExecution };