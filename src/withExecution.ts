import { throwIfNotCallable } from "./utils";

type Overload<F extends (...args: any) => any> = {
  callee: F;
  args: Parameters<F>;
  result?: ReturnType<F>;
  caught?: unknown;
};

type OnCall<F extends (...args: any) => any> = (params: {
  callee: F;
  args: Parameters<F>;
}) => Partial<Pick<Overload<F>, "callee" | "args" | "result">> | void;

type OnReturn<F extends (...args: any) => any> = (params: {
  callee: F;
  args: Parameters<F>;
  result: ReturnType<F>;
}) => Partial<Pick<Overload<F>, "result">> | void;

type OnCatch<F extends (...args: any) => any> = (params: {
  callee: F;
  args: Parameters<F>;
  caught: unknown;
}) => Partial<Pick<Overload<F>, "result" | "caught">> | void;

interface Hooks<F extends (...args: any) => any> {
  onCall?: OnCall<F>;
  onReturn?: OnReturn<F>;
  onCatch?: OnCatch<F>;
}

const withExecution = <F extends (...args: any) => any>(
  callee: F,
  { onCall, onReturn, onCatch }: Hooks<F> = {}
) => {
  throwIfNotCallable(callee);
  const wrapped = function (this: any, ...args: Parameters<F>) {
    let overload: Overload<F> = {
      callee: callee.bind(this) as F,
      args,
    };
    try {
      if (onCall) {
        const tmp = {
          ...(onCall.bind(this)({
            callee: overload.callee,
            args: overload.args,
          }) || {}),
        };
        if ("result" in tmp) {
          return tmp.result;
        }
        overload = { ...overload, ...tmp };
      }

      console.log(overload.args);

      overload.result = overload.callee.apply(this, overload.args);

      if (onReturn) {
        overload = {
          ...overload,
          ...(onReturn.bind(this)({
            callee: overload.callee,
            args: overload.args,
            result: overload.result!,
          }) || {}),
        };
      }

      return overload.result;
    } catch (caughtValue) {
      overload.caught = caughtValue;
      if (onCatch) {
        const { result, caught } =
          onCatch.bind(this)({
            callee: overload.callee,
            args: overload.args,
            caught: overload.caught,
          }) || overload;
        overload.result = result;
        overload.caught = caught;
      }
      if (overload.caught) {
        throw overload.caught;
      }

      return overload.result;
    }
  };

  Object.setPrototypeOf(wrapped, Object.getPrototypeOf(callee));
  Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(callee));

  //if calee is an asynchrnous function, we need to wrap wrapped in an async function
  return (callee as any)[Symbol.toStringTag] === "AsyncFunction"
    ? (async function (this: any, ...args: Parameters<F>) {
        return wrapped.bind(this)(...args);
      } as any)
    : (wrapped as F);
};

export { withExecution };
