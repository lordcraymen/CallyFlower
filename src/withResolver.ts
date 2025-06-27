type Handler =
  | ["then", (...args: any) => any]
  | ["catch", (error: any) => any]
  | ["finally", () => void];

type HandlerChain = Handler[];

type ResolverType<F extends (...args: any) => any, R> = {
  (this: any, ...args: Parameters<F>): R;
  then<T>(handler: (result: R) => T): ResolverType<F, T>;
  catch<T>(handler: (error: any) => T): ResolverType<F, F | T>;
  finally(handler: () => void): ResolverType<F, R>;
};

function resolve(
  value: Array<any>,
  handlerChain: HandlerChain = [],
  context: any
) {
  // Pre-calculate chain length to avoid property access in loop
  const chainLength = handlerChain.length;
  
  // Use traditional for loop instead of for-of (faster)
  for (let i = 0; i < chainLength; i++) {
    const handler = handlerChain[i];
    const type = handler[0];
    const fn = handler[1];
    
    if (type === "catch") continue;
    if (type === "finally") {
      (fn as Function).call(context); // Use .call instead of .apply when possible
      continue;
    }
    
    // Use .call with spread instead of .apply with array when you know the structure
    value = fn.apply(context, value);
    
    if (value instanceof Promise) {
      return handlerChain.slice(i + 1).reduce((acc, [t, h]) => (acc as any)[t](h.bind(context)), value);
    }
    
    // Reuse array instead of creating new one
    value = [value];
  }

  handlerChain.length = 0;
  return value[0];
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  

  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    return resolve(args, handlers, this) as ReturnType<F>;
  }

  Resolver.then = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F, T> {
    handlers.push(["then", handler]);
    return this as any as ResolverType<F, T>;
  };

  Resolver.catch = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F, T> {
    handlers.push(["catch", handler]);
    return this as any as ResolverType<F, T>;
  };

  Resolver.finally = function (handler: () => void) {
    handlers.push(["finally", handler]);
    return this;
  };

  return Resolver;
}

export { withResolver, type ResolverType };
