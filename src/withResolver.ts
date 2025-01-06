


const popStackUntilNext = <A extends Array<any>>(chain:A, filterFunction: (entry: A[keyof A]) => boolean) => {
  while (chain.length > 0) {
    if (filterFunction(chain[chain.length - 1])) {
      chain.pop();
    } else {
      break;
    }
  }
  return chain as A;
}
  

//this function tries to execute the then clauses until the end, 
// when it catches it will skip forward to the closest catch clause
//passing the catch clause as the first element of the remaining clauses
//to this function recursively
//if there is no catch clause it will throw the caught error
// the last then clause will return the result of the function
function resolve(
  value: any,
  callchain:Array<Record<"then"|"catch"|"fianlly",Array<any>>> = [] // Array of handler objects
) {
  let result;
  let caught;

  try {

    // interate from the end of the callchain since its a stack
    //check if result is a propise and then apply all remianing handlers to the promise
    //else treat init as a function and apply the value of all then handlers as the parameters
    //pop the last handler and apply it to the result, if the next handler is a catch clause
    // then pop and discard it

    while (callchain.length > 0) {
      const [handler,params]  = Object.entries(callchain.pop() as any)[0] as [string, any];

      if (value instanceof Promise && handler in value) {
          value = (value as any)[handler](...params);
      }
      else {
        value = params(...value);
        callchain = popStackUntilNext(callchain, (entry) => Object.keys(entry)[0] !== "then" );
      } 
    }

  } catch (error) {
    //loop and pop all methods until the catch clause, so that the catch clause is the first element
    //of the remaining clauses. the handlers is a stack so work from the end
    callchain = popStackUntilNext(callchain, (entry) => Object.keys(entry)[0] !== "catch" );
    //if there is no catch clause, throw the error
    if (callchain.length === 0) {
      throw error;
    }
    
    //convert the top of the callchain stafrom a catch to a then clause
    //and apply the error to the catch clause
    const [handler,value]  = Object.entries(callchain.pop() as any)[0] as [string, any];
    result = (handler === "catch") ? (value[0] as Function)(error) : null; 

    return resolve(() => error, callchain);

  }
  return result;
}


function withResolver<F extends (...args: any) => any>(callee: F) {
  const handlers: Array<Record<string|symbol,any>> = [callee]

  function Resolver(this: any, ...args: Parameters<F>) {
    handlers.reverse();
    return resolve(args, handlers);
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
    return {
      catch: () => {
        throw new Error("Cannot chain catch after finally");
      },
      call: this.call.bind(this),
    }
  };

  return Resolver;
}

export { withResolver };
