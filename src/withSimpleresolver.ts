const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

const simpleResolve = (args:Array<any>, typeChain:Array<number>, handlerChain:Array<Function>, context:any) => {
  
  if (typeChain.length == 1 && typeChain[0] === THEN) {
    return handlerChain[0].apply(context, args);
  }
  
  let value = args;
  let index = 0;
  
  try { 
    for (;index < handlerChain.length;index++) {
      const type = typeChain[index];
      const handler = handlerChain[index];
      if (type === CATCH) { continue } 
      if (type === FINALLY) { handler(); continue }
      value = handler.apply(context, value);
      if (value instanceof Promise) {
        const remainingTypes = typeChain.slice(index + 1);
        const remainingHandlers = handlerChain.slice(index + 1);
        return remainingTypes.reduce((acc, t, idx) => {
          const methodName = t === THEN ? "then" : t === CATCH ? "catch" : "finally";
          return (acc as any)[methodName](remainingHandlers[idx].bind(context));
        }, value);
      }
      value = [value];
    }
  } catch (error) {
    const catchIndex = typeChain.indexOf(CATCH, index);
    if (catchIndex > 0) {
      return simpleResolve([error], typeChain.slice(catchIndex), handlerChain.slice(catchIndex), context);
    }
    throw error;
  }

  return value;
}

const withSimpleResolver = (callee: Function): Function => { 
  const types: Array<number> = [];
  const handlers: Array<Function> = [];
  const Resolver = (...args:any[]) => types.length === 0 ? callee.apply(this,args) : simpleResolve(args, types, handlers, this);

  Resolver.then = (handler: Function) => {
    types.push(THEN);
    handlers.push(handler);
    return Resolver;
  };
  Resolver.catch = (handler: Function) => {
    types.push(CATCH);
    handlers.push(handler);
    return Resolver;
  };
  Resolver.finally = (handler: Function) => {
    types.push(FINALLY);
    handlers.push(handler);
    return Resolver;
  };

  return Resolver;
}

export { withSimpleResolver };