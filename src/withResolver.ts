


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

//this function tries to execute the then clauses until the end, 
// when it catches it will skip forward to the closest catch clause
//passing the catch clause as the first element of the remaining clauses
//to this function recursively
//if there is no catch clause it will throw the caught error
// the last then clause will return the result of the function
function resolve(
  target: any,
  handlers:Array<Record<string|symbol,any>> // Array of handler objects
) {

  let curentIndex = 0;

  try {
    // Execute the target function with the provided arguments
    let result = target[curentIndex](...handlers);

    //if result is a Promise, apply the remaining handlers to it and return it
    if(result instanceof Promise){
      return applyChainedParams(result, handlers.slice(curentIndex+1));
    }

    curentIndex++;
    // Find the next then handler, if available
    const nextThenIndex = handlers.findIndex(h => h.then);

    if (nextThenIndex === -1) {
      return result; // No then handler left, return the result
    }

    // Isolate the next then handler and call resolve recursively
    const [nextThenHandler, ...remainingHandlers] = handlers.splice(nextThenIndex, 1);
    return resolve([nextThenHandler, ...remainingHandlers], result);
  } catch (error) {
    // Find the next catch handler, if available
    const nextCatchIndex = handlers.findIndex(h => h.catch);

    if (nextCatchIndex === -1) {
      throw error; // No catch handler left, throw the error
    }

    // Isolate the next catch handler and call resolve recursively
    const [nextCatchHandler, ...remainingHandlers] = handlers.splice(nextCatchIndex, 1);
    return resolve([nextCatchHandler, ...remainingHandlers], [error as Error]);
  }
}


function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: Array<Record<string|symbol,any>> = [callee]

  function Resolver(this: any, ...args: Parameters<F>) {
    handlers.reverse();
    return resolve(handlers, args);
  };

  Resolver.then = function (handler: (result: any) => any) {
    handlers.push({"then":handler});
    return this;
  };

  Resolver.catch = function (handler: (caught: unknown) => any) {
    handlers.push({"catch":handler});
    return this;
  };

  Resolver.finally = function (handler: (r: { result: ReturnType<F>; caught: unknown }) => any) {
    handlers.push({"finally":handler});
    //only allow one finally clause
    return (...args:Parameters<F>) => this(...args);
  };

  return Resolver;
}

export { withResolver, applyChainedParams };
