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
        [handler: "onCall" | "onReturn" | "onCatch" | string]: (
          params: CallbackEventOptions<F>
        ) => Partial<CallbackEventOptions<F>> | void;
      }
    | undefined = {}
) => {
  const wrapped = isSynchronous(c)
    ? function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F;
        let result;
        try {
          const onCallResult = handlers.onCall?.({
            event: "onCall",
            callee,
            args,
          });

          // If handler explicitly provides `result`, use it; otherwise, call `callee`
          if (onCallResult && "result" in onCallResult) {
            result = onCallResult.result;
          } else {
            result = callee(...args);
          }

          return (
            handlers.onReturn?.({ event: "onReturn", callee, args, result })
              ?.result ?? result
          );
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
    : async function (this: any, ...args: Parameters<F>) {
        const callee = ((...args: Parameters<F>) => c.apply(this, args)) as F;
        return Promise.resolve(
          handlers.onCall?.({ event: "onCall", callee, args })?.result ??
            callee(...args)
        )
          .then(
            (result) =>
              handlers.onReturn?.({ event: "onReturn", callee, args, result })
                ?.result ?? result
          )
          .catch((caughtValue) => {
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
          });
      };

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(c));
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(c));

  return wrapped as F;
};

export { withExecution };
