


//this function should apply the key value pairs in the chainList to the expression
//the chainList is an array of objects with keys and params
//the key is the name of the function to be called on the expression
//the params are the arguments to be passed to the function
//the function should be called on the expression with the params
function applyChainedParams<T extends Record<string | symbol, any>>(
  expression: T,
  chainList: Array<{ [K in keyof T]?: Parameters<T[K]> }>
): ReturnType<T[keyof T]> | undefined {
  return chainList.reduce((acc, chain) => {
    const key = Object.keys(chain)[0] as keyof T;
    const params = chain[key];
      return acc[key](...(params || []));
  }, expression) as ReturnType<T[keyof T]>;
}


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

export { withResolver, applyChainedParams };
