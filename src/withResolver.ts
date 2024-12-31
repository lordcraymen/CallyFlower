function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: {
    then: Array<(result: ReturnType<F>) => any>;
    catch: Array<(error: Error) => any>;
    finally: Array<(r: { result: ReturnType<F>; caught: unknown }) => any>;
  } = { then: [], catch: [], finally: [] };

  function Resolver(this: any, ...args: any) {
    let result = undefined;
    let handledCatch = undefined;
    try {
      result = handlers.then.reduce(
        (acc, handler) => handler(acc),callee(...args));
      if(handlers.finally.length === 0) return result;
    } catch (caught) {
        handledCatch = handlers.catch.reduce(
        (acc, handler) => handler(acc as Error),caught as Error);
        if (handledCatch) { throw handledCatch }
    } finally {
      if(handlers.finally.length === 0) return result;
      const final = handlers.finally.reduce((acc, handler) => handler(acc), {
        result,
        caught: handledCatch,
      });
      return final;
    }
  }

  Resolver.then = function (handler: (result: ReturnType<F>) => any) {
    handlers.then.push(handler);
    return this;
  };

  Resolver.catch = function (handler: (error: Error) => any) {
    handlers.catch.push(handler);
    return this;
  };

  Resolver.finally = function (handler: (r: { result: ReturnType<F>; caught: unknown }) => any) {
    handlers.finally.push(handler);
    return this;
  };

  return Resolver;
}

export { withResolver };
