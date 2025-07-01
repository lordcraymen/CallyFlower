const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

const TYPEMAP: Array<string> = ["then", "catch", "finally"];

type HandlerChain = Array<(...args: any) => any>; // Simplified to just functions

type ResolverType<F extends (...args: any) => any, R> = {
  (this: any, ...args: Parameters<F>): R;
  then<T>(handler: (result: R) => T): ResolverType<F, T>;
  catch<T>(handler: (error: any) => T): ResolverType<F, F | T>;
  finally(handler: () => void): ResolverType<F, R>;
};

function resolve(
  args: Array<any>,
  typeChain: Array<0 | 1 | 2>,
  handlerChain: HandlerChain = [],
  context: any
) {
  
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
      return resolve([error], typeChain.slice(catchIndex), handlerChain.slice(catchIndex), context);
    }
    throw error;
  }

  return value;
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  const typeChain: Array<0 | 1 | 2> = [THEN];
  const handlerChain: HandlerChain = [callee];

  function Resolver(this: any, ...args: Parameters<F>) {
    return handlerChain.length === 0 ? callee.apply(this, args) : resolve(args, typeChain, handlerChain, this) as ReturnType<F>;
  }

  Resolver.then = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F, T> {
    typeChain.push(THEN);
    handlerChain.push(handler);
    return this as any as ResolverType<F, T>;
  };

  Resolver.catch = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F, T> {
    typeChain.push(CATCH);
    handlerChain.push(handler);
    return this as any as ResolverType<F, T>;
  };

  Resolver.finally = function (handler: () => void) {
    typeChain.push(FINALLY);
    handlerChain.push(handler);
    return this;
  };

  return Resolver;
}

export { withResolver, type ResolverType };