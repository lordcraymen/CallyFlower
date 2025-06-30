
const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

const handlertypeMap: Array<string> = ["then", "catch", "finally"];

type Handler =
  | ["then", (...args: any) => any]
  | ["catch", (error: any) => any]
  | ["finally", () => void];

type HandlerChain = Handler[];

type ResolverType<F extends (...args: any) => any, R> = {
  (this: any, ...args: Parameters<F>): R;
  then<T>(handler: (result: R) => T): ResolverType<F, T>;
  catch<T>(handler: (error: any) => T): ResolverType<F, F | T>;
  finally(handler: () => void): ResolverType<F, R>;
};

function resolve(
  value: Array<any>,
  typeChain: Array<0|1|2>,
  handlerChain: HandlerChain = [],
  context: any
) {
  try {
    let index = 0;
    for (; index < handlerChain.length; index++) {
      const [type, handler] = handlerChain[index];
      if (type === "catch") {
        continue;
      }
      if (type === "finally") {
        handler.apply(context);
        continue;
      }
      value = handler.apply(context, value);
      if (value instanceof Promise) {
        return handlerChain.splice(index).reduce((acc, [t,h]) =>  (acc as any)[t](h.bind(context)), value );
      }
      value = [value];
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], typeChain, handlerChain, context); 
  }

  handlerChain.length = 0;
  return value[0]; /*?.*/
}

function withResolver<F extends (...args: any) => any>(callee: F) {

  const handlerChain: HandlerChain = [["then", callee]];
  const typeChain: Array<0|1|2> = [THEN];

  function Resolver(this: any, ...args: Parameters<F>) {
    return handlerChain.length === 1 ? callee.apply(this,args) : resolve(args, typeChain, handlerChain, this) as ReturnType<F>; /*?.*/
  }

  Resolver.then = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlerChain.push(["then", handler]);
    typeChain.push(THEN);
    return this as any as ResolverType<F,T>;
  };

  Resolver.catch = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlerChain.push(["catch", handler]);
    typeChain.push(CATCH);
    return this as any as ResolverType<F,T>;
  };

  Resolver.finally = function (handler: () => void) {
    handlerChain.push(["finally", handler]);
    typeChain.push(FINALLY);
    return this;
  };

  return Resolver;
}

export { withResolver, type ResolverType };
