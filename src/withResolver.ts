type Handler =
  | ["then", (...args: any) => any]
  | ["catch", (error: any) => any]
  | ["finally", () => void];

type HandlerChain = Handler[];

function resolve(
  value: Array<any>,
  handlerChain: HandlerChain = [],
  context?: any
) {
  try {
   let index = 0;
   for (const [type, handler] of handlerChain) {
      if (type === "catch") { continue }
      if (type === "finally") { handler.apply(context); continue }
      value = handler.apply(context, value);
      if (value instanceof Promise) {
        return handlerChain.splice(index).reduce((acc, [t,h]) =>  (acc as any)[t](h.bind(context)), value);
      }
      value = [value];
      index++;
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], handlerChain, context);
  }

  handlerChain.length = 0;
  return value[0];
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    return resolve(args, handlers, this);
  }

  Resolver.then = function (handler: (result: any) => any) {
    handlers.push(["then", handler]);
    return this;
  };

  Resolver.catch = function (handler: (caught: unknown) => any) {
    handlers.push(["catch", handler]);
    return this;
  };

  Resolver.finally = function (handler: () => void) {
    handlers.push(["finally", handler]);
    return this;
  };

  return Resolver;
}

export { withResolver };
