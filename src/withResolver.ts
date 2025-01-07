type Handler =
  | ["then", (...args: any) => any]
  | ["catch", (error: any) => any]
  | ["finally", () => void];

type HandlerChain = Handler[];

function resolve(
  value: Array<any>,
  handlerChain: HandlerChain = []
) {
  try {
   for (let i = 0; i < handlerChain.length; i++) {
      if (handlerChain[i][0] === "catch") { continue }
      if (handlerChain[i][0] === "finally") { (handlerChain[i][1] as any)(); continue }
      value = (handlerChain[i][1] as any)(...value);
      if (value instanceof Promise) {
        return handlerChain.reduce((acc, h) =>  (acc as any)[h[0]](h[1]), value);
      }
      value = [value];
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], handlerChain);
  }

  handlerChain.length = 0;
  return value[0];
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    return resolve(args, handlers);
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
