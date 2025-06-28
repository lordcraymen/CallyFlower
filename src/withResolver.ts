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
  handlerChain: HandlerChain = [],
  context: any
) {
  try { 
   let index = 0;
   //for (const [type, handler] of handlerChain) { 
    while (index < handlerChain.length) {
      const [type, handler] = handlerChain[index]; /*?.*/
      if (type === "catch") { continue } 
      if (type === "finally") { handler.apply(context); continue }
      value = handler.apply(context, value); /*?.*/
      if (value instanceof Promise) {
        return handlerChain.splice(index).reduce((acc, [t,h]) =>  (acc as any)[t](h.bind(context)), value );
      }
      value = [value];
      index++;
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], handlerChain, context); 
  }

  handlerChain.length = 0;
  return value[0]; /*?.*/
}

function withResolver<F extends (...args: any) => any>(callee: F) {

  const handlers: HandlerChain = [["then", callee]];

  function Resolver(this: any, ...args: Parameters<F>) {
    return resolve(args, handlers, this) as ReturnType<F>; /*?.*/
  }

  Resolver.then = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlers.push(["then", handler]);
    return this as any as ResolverType<F,T>;
  };

  Resolver.catch = function <T>(handler: (result: ReturnType<F>) => T): ResolverType<F,T> {
    handlers.push(["catch", handler]);
    return this as any as ResolverType<F,T>;
  };

  Resolver.finally = function (handler: () => void) {
    handlers.push(["finally", handler]);
    return this;
  };

  return Resolver;
}

const simpleResolve = (value:Array<any>, handlerChain:Array<[string, Function]>,context:any) => {
  try { 
   let index = 0;
   //for (const [type, handler] of handlerChain) { 
    while (index < handlerChain.length) {
      const [type, handler] = handlerChain[index]; /*?.*/
      if (type === "catch") { continue } 
      if (type === "finally") { handler.apply(context); continue }
      value = handler.apply(context, value); /*?.*/
      if (value instanceof Promise) {
        return handlerChain.splice(index).reduce((acc, [t,h]) =>  (acc as any)[t](h.bind(context)), value );
      }
      value = [value];
      index++;
    }
  } catch (error) {
    const index = handlerChain.findIndex(([t]) => t === "catch");
    if (index === -1) { throw error; }
    handlerChain.splice(0, index);
    handlerChain[0][0] = "then";
    return resolve([error], handlerChain as any, context); 
  }

  handlerChain.length = 0;
  return value[0]; /*?.*/
}

const withSimpleResolver = (callee: Function): Function => { 
  const handlers: any = [["then", callee]];
  const Resolver = (...args:any[]) => simpleResolve(args, handlers, this);

  Resolver.then = (handler: Function) => {
    handlers.push(["then", handler]);
    return Resolver;
  };
  Resolver.catch = (handler: Function) => {
    handlers.push(["catch", handler]);
    return Resolver;
  };
  Resolver.finally = (handler: Function) => {
    handlers.push(["finally", handler]);
    return Resolver;
  };

  return Resolver;
}

const testfunction = (a:number, b:number) => a + b;

const withIterations = (fn: Function) => {
  return function(...args: any[]) {
    for (let i = 0; i < 10; i++) {
      fn(...args);
    }
    return fn(...args); /*?.*/
  };
};

const testfunctionWithIterations = withIterations(testfunction);
testfunctionWithIterations(1, 200); /*?.*/

const testWithSimpleResolver = withIterations(withSimpleResolver(testfunction));

testWithSimpleResolver(1,200);  /*?.*/;

//withResolver testcase
const test = withIterations(withResolver(testfunction));
test(1, 200); /*?.*/


export { withResolver, type ResolverType };
