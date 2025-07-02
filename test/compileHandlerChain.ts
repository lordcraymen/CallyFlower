import { compileHandlerChain, } from '../src/compileHandlerChain';

describe('compileHandlerChain', () => {
    it('should compile a simple handler chain with then', () => {
        const typechain = ["then"];
        const handlerChain = [() => 'result'];
        const result = compileHandlerChain(typechain, handlerChain);
        expect(result).toBe('return result(...args);');
    });

    it('should compile a handler chain with then and finally', () => {
        const typechain = [0, 2];
        const handlerChain = [() => 'result', () => 'finally'];
        const result = compileHandlerChain(typechain, handlerChain);
        expect(result).toBe('let value = args; value = result(...value); finally();');
    });

    it('should compile a handler chain with then, catch, and finally', () => {
        const typechain = [0, 1, 2];
        const handlerChain = [() => 'result', () => 'catch', () => 'finally'];
        const result = compileHandlerChain(typechain, handlerChain);
        expect(result).toBe('let value = args; try { value = result(...value); } catch (e) { catch(e); } finally();');
    });
});