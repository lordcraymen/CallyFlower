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
  value: Array<any>,
  typeChain: Array<0 | 1 | 2>,
  handlerChain: HandlerChain = [],
  context: any
) {
  try {
    let index = 0;
    for (; index < handlerChain.length; index++) {
      const handler = handlerChain[index];
      const type = typeChain[index];

      if (type === CATCH) {
        continue;
      }
      if (type === FINALLY) {
        (handler as () => void)();
        continue;
      }
      value = handler.apply(context, value);
      if (value instanceof Promise) {
        const remainingHandlers = handlerChain.splice(index + 1);
        const remainingTypes = typeChain.splice(index + 1);

        return remainingHandlers.reduce((acc, h, i) => {
          const typeString = TYPEMAP[remainingTypes[i]];
          return (acc as any)[typeString](h.bind(context));
        }, value);
      }
      value = [value];
    }
  } catch (error) {
    const catchIndex = typeChain.findIndex(t => t === CATCH);
    if (catchIndex === -1) { throw error; }
    handlerChain.splice(0, catchIndex);
    typeChain.splice(0, catchIndex);
    typeChain[0] = THEN;
    return resolve([error], typeChain, handlerChain, context);
  }

  handlerChain.length = 0;
  typeChain.length = 0;
  return value[0];
}

function withResolver<F extends (...args: any) => any>(callee: F) {
  const typeChain: Array<0 | 1 | 2> = [THEN];
  const handlerChain: HandlerChain = [callee];

  function Resolver(this: any, ...args: Parameters<F>) {
    return handlerChain.length === 1 ? callee.apply(this, args) : resolve(args, typeChain, handlerChain, this) as ReturnType<F>;
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