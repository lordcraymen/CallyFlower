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
  try {
    let index = 0;
    for (; index < handlerChain.length; index++) {
      const [type, handler] = handlerChain[index];
      if (type === "catch") {
        continue;
      }
      if (type === "finally") {
        handler.apply(context);
        continue;
      }
      value = handler.apply(context, value);
      if (value instanceof Promise) {
        return handlerChain.splice(index).reduce((acc, [t,h]) =>  (acc as any)[t](h.bind(context)), value );
      }
      value = [value];
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], handlerChain, context); 
  }

  handlerChain.length = 0;
  return value[0]; /*?.*/
}

function withResolver<F extends (...args: any) => any>(callee: F) {

  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    return resolve(args, handlers, this) as ReturnType<F>; /*?.*/
  }

  Resolver.then = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlers.push(["then", handler]);
    return this as any as ResolverType<F,T>;
  };

  Resolver.catch = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlers.push(["catch", handler]);
    return this as any as ResolverType<F,T>;
  };

  Resolver.finally = function (handler: () => void) {
    handlers.push(["finally", handler]);
    return this;
  };

  return Resolver;
}

export { withResolver, type ResolverType };
