/* 
    this function takes a typechain and a handlerChain
    typechain is an array of numbers that represent the type of handler in the chain.
    0: THEN, 1: CATCH, 2: FINALLY
    handlerChain is an array of functions that represent the handlers in the chain.
    it compiles the typechain and handlerChain into a string representation of the handler chain.
    then and catch handlers can use a context, so they are called with apply(context, args).
    finally handlers are called without context, so they are called with handler() instead of handler.apply
    if there is no catch present, thre is no need to wrap the "then" handler in a try/catch block.
    if there is a catch present, the "then" handler must be wrapped in a try/catch block.
    if there is a finally present, the "finally" handler must be called after the "then" handler.
    if thre is no catch but finally present, then the "finally" handler must be called after the "then" handler.
    each handler except the finally handlers sttores their reslut and passes it to the next handler.
*/

type TypeChain = Array<0 | 1 | 2>; // 0: THEN, 1: CATCH, 2: FINALLY

const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

const CHAINTYPES = ["then", "catch", "finally"];


function compileHandlerChain(typechain:TypeChain,handlerChain: Array<Function>): string {
    let functionString = '';
    let index = 0;

    if (typechain.length === 1 && typechain[0] === THEN) {
        functionString = `return ${handlerChain[0].name}.apply(context,args);`;
        return functionString;
    }
    functionString = 'let value = args;';
    for (; index < handlerChain.length; index++) {
        const type = typechain[index];
        const handler = handlerChain[index];
        if (type === CATCH) {
            continue; // Skip catch handlers in the string
        }
        if (type === FINALLY) {
            functionString += `${handler.name}(); `;
            continue;
        }
        functionString += `value = ${handler.name}(...value); `;
        if (index < handlerChain.length - 1) {
            functionString += `if (value instanceof Promise) { return value } `;
        }
    }
    return functionString;
}

export { compileHandlerChain, type TypeChain };