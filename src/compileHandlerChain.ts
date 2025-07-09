const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

export type TypeChain = Array<0 | 1 | 2>;

export function compilehc(typechain: TypeChain, hc: Function[]): string {
    // Edge cases

    // Find first executable handler (then or finally)
    const firstExecutableIndex = typechain.findIndex(t => t !== CATCH);

    // No executable handlers, only catches or empty typechain
    if (firstExecutableIndex === -1) return '{return a;}';
        
    // Keep everything from first executable handler onward
    typechain = typechain.slice(firstExecutableIndex);

    // If all handlers are finally, execute them and return args
    if (typechain.every(t => t === FINALLY)) return `{${typechain.map((_, i) => `hc[${i}]()`).join(';')};return a;}`;
    
    
    //main case, a chain of then or finally handlers followed by optional catch handlers
    //the first then handler has to be called with the context and arguments, 
    //the rest of the then handlers are called with the result of the previous handler
    //finally handlers are just called with (), they have to be void functions)

    // If only then and finally handlers, no ned to build a try catch block, execute them and return result

    //if there are multiple consecutive catch hadlers they should be nested util the next non-catch handler
    //the error argument should have an integer suffix that represents the index of the catch handler in the typechain

    //fallback to a simple return
    return '{return a;}';
}