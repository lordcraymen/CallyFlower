type Handler =
  | ["then", (...args: any) => any]
  | ["catch", (error: any) => any]
  | ["finally", () => void];

type HandlerChain = Handler[];

function resolve(
  value: Array<any>,
  handlerChain: HandlerChain = [] // Array of handler objects
) {
  try {
    while (handlerChain.length > 0) {
      const [handlertype, handler] = handlerChain.pop()!;
      if (handlertype === "catch") { continue }
      value = (handler as any)(...value);
      if (value instanceof Promise) {
        return handlerChain.reduce((acc, handler) =>  (acc as any)[handler[0]](handler[1]), value);
      }
      value = [value];
    }
  } catch (error) {
    //pop until next catch
    while (handlerChain.length > 0) {
      if (handlerChain[handlerChain.length-1][0] !== "catch") {
        handlerChain.pop();
      }
    }

    if (handlerChain.length === 0) {
      throw error;
    }

    handlerChain[handlerChain.length][0] = "then";

    return resolve([error], handlerChain);
  }
  return value[0];
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    handlers.reverse();
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
