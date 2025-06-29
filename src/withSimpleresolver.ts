const simpleResolve = (args:Array<any>, typeChain:Array<string>, handlerChain:Array<Function>, context:any, hasCatch:boolean) => {
  let value = undefined;
  let index = 0;
  try { 
    for (;index < handlerChain.length;index++) {
      const type = typeChain[index];
      const handler = handlerChain[index];
      if (type === "catch") { continue } 
      if (type === "finally") { handler.apply(context); continue }
      value = handler.apply(context, value); /*?.*/
      if (value instanceof Promise) {
        const remainingTypes = typeChain.splice(index);
        const remainingHandlers = handlerChain.splice(index);
        return remainingTypes.reduce((acc, t, idx) => (acc as any)[t](remainingHandlers[idx].bind(context)), value);
      }
      //value = [value];
    }
  } catch (error) {
    const catchIndex = typeChain.indexOf("catch", index);
    if (catchIndex > 0) {
      return simpleResolve([error], typeChain.slice(catchIndex), handlerChain.slice(catchIndex), context, true);
    }
    throw error;
  }

  return value;
}

const withSimpleResolver = (callee: Function): Function => { 
  const types: Array<string> = ["then"];
  const handlers: Array<Function> = [callee];
  let hasCatch = false;
  const Resolver = (...args:any[]) => simpleResolve(args, types, handlers, this, hasCatch);

  Resolver.then = (handler: Function) => {
    types.push("then");
    handlers.push(handler);
    return Resolver;
  };
  Resolver.catch = (handler: Function) => {
    types.push("catch");
    handlers.push(handler);
    hasCatch = true;
    return Resolver;
  };
  Resolver.finally = (handler: Function) => {
    types.push("finally");
    handlers.push(handler);
    return Resolver;
  };

  return Resolver;
}

export { withSimpleResolver };