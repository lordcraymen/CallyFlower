import { withOnCall } from "./withOnCall";
import { withOnResult } from "./withOnResult";
import { withOnCatch } from "./withOnCatch";
import { OnCallHandler, OnResultHandler, OnCatchHandler } from "./types";
import { throwIfNotCallable } from "./utils";

type EventOptions<F extends (...args: any) => any> = {
  onCall?: OnCallHandler<F>;
  onResult?: OnResultHandler<F>;
  onCatch?: OnCatchHandler<F>;
  onEvent?: (eventParams: Object
  ) => void;
};

/**
 * Wraps a function with event handlers, allowing modification of the function's arguments, result or error.
 * The returned function calls the original function and applies the event handlers beforehand.
 * It can be used to modify the arguments before the function is called, or to modify the result or error afterwards.
 * This is useful for validation, logging, memoization or other pre- or post-processing tasks.
 *
 * @template F - The type of the function to wrap.
 * @param {F} callee - The original function to wrap.
 * @param {EventOptions<F>} options - The event handlers invoked before and after the function call.
 * @returns {F} A new function that wraps the original function with the event handlers.
 */
const withEvents = <F extends (...args: any) => any>(
  callee: F,
  options: EventOptions<F>
): F => {
  throwIfNotCallable(callee);
  const { onCall, onResult, onCatch, onEvent } = options;

  const wrappedWithOnCall = withOnCall(callee, (onCallParams) => {
    if (onCall) onCall({...onCallParams, callee} as any);
    if (onEvent) onEvent({...onCallParams, callee});
  });

  const wrappedWithOnResult = withOnResult(
    wrappedWithOnCall,
    (onResultParamters) => {
      if (onResult) onResult({ ...onResultParamters, callee } as any);
      if (onEvent) onEvent({ ...onResultParamters, callee });
    }
  );

  const wrappedWithOnCatch = withOnCatch(
    wrappedWithOnResult,
    (onCatchParams) => {
      if (onCatch) onCatch({ ...onCatchParams, callee } as any);
      if (onEvent) onEvent({ ...onCatchParams, callee });
    }
  );

  return wrappedWithOnCatch as F;
};

export { withEvents };
