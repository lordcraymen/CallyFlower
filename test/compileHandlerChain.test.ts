import { compileHandlerChain, TypeChain} from '../src/compileHandlerChain';

describe('compileHandlerChain', () => {
      it('should handle an empty handler chain', () => {
        const typechain:TypeChain = [];
        const handlerChain: Array<Function> = [];

        const expected = 
        `{
            return args;
        }`;
        const result = compileHandlerChain(typechain, handlerChain);
        expect(result).toBe(expected);
    });
    it('should compile a simple handler chain with then', () => {
        const typechain:TypeChain = [0];
        const handlerChain = [() => 'result'];

        const expected = 
        `{
            let v;
            v = handlerChain[0].apply(context, args);
            return v;
        }`;

        const result = compileHandlerChain(typechain, handlerChain);

        expect(result).toBe(expected);
    });

    it('should compile a handler chain with then and catch', () => {
        const typechain:TypeChain = [0, 1];
        const handlerChain = [
            (arg) => `then: ${arg}`,
            (error) => `catch: ${error}`
        ];

        const expected = 
        `{
            let v; 
            try {
                v = handlerChain[0].apply(context, args);
            } catch (e) {
                return handlerChain[1].call(context, e);
            }
            return v;
        }`
        const result = compileHandlerChain(typechain, handlerChain);
        expect(result).toBe(expected);
    });

    it('should compile a handler chain with then, catch, and finally', () => {
        const typechain:TypeChain = [0, 1, 2];
        const handlerChain = [
            (arg) => `then: ${arg}`,
            (error) => error,
            () => {console.log('finally')}
        ];

        const expected = 
        `{
            let v; 
            try {
                v = handlerChain[0].apply(context, args);
                if (v instanceof Promise)  return v;
            } catch (e) {
                return handlerChain[1].call(context, e);
            } finally {
                handlerChain[2]();
            }
            return v;
        }`;

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });

    it('should compile a handler chain with then and finally', () => {
        const typechain:TypeChain = [0, 2];
        const handlerChain = [
            (arg) => `then: ${arg}`,
            () => {console.log('finally')}
        ];

        const expected = function (handlerChain,args,context) {
            let v; 
            v = handlerChain[0].apply(context, args);
            if (v instanceof Promise)  return v;
            handlerChain[1]();
            return v;
        }

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });

    it('should compile a handler chain with only finally', () => {
        const typechain:TypeChain = [2];
        const handlerChain = [
            () => {console.log('finally')}
        ];

        const expected = function (handlerChain,args,context) {
            handlerChain[0]();
        }

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });

    it('should compile a handler chain with multiple then handlers', () => {
        const typechain:TypeChain = [0, 0];
        const handlerChain = [
            (arg) => `then1: ${arg}`,
            (arg) => `then2: ${arg}`
        ];

        const expected = function (handlerChain,args,context) {
            let v; 
            v = handlerChain[0].apply(context, args);
            if (v instanceof Promise)  return v;
            v = handlerChain[1].call(context, v);
            return v;
        }

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });

    it('should compile a handler chain with then, catch, and multiple finally handlers', () => {
        const typechain:TypeChain = [0, 1, 2, 2];
        const handlerChain = [
            (arg) => `then: ${arg}`,
            (error) => `catch: ${error}`,
            () => {console.log('finally1')},
            () => {console.log('finally2')}
        ];

        const expected = function (handlerChain,args,context) {
            let v; 
            try {
                v = handlerChain[0].apply(context, args);
                if (v instanceof Promise)  return v;
            } catch (e) {
                return handlerChain[1].call(context, e);
            } finally {
                handlerChain[2]();
                handlerChain[3]();
            }
            return v;
        }

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });

    it('should compile a handler chain with multiple alternating then and catch handlers', () => {
        const typechain:TypeChain = [0, 1, 0, 1];
        const handlerChain = [
            (arg) => `then1: ${arg}`,
            (error) => `catch1: ${error}`,
            (arg) => `then2: ${arg}`,
            (error) => `catch2: ${error}`
        ];

        const expected = function (handlerChain,args,context) {
            let v; 
            try {
                v = handlerChain[0].apply(context, args);
                if (v instanceof Promise)  return v; 
            } catch (e) {
                return handlerChain[1].call(context, e);
            }
            try {
                v = handlerChain[2].call(context, v);
                if (v instanceof Promise)  return v;
            } catch (e) {
                return handlerChain[3].call(context, e);
            }
            return v;
        }

        const expectedBody = extractFunctionBody(expected).replace(/\s+/g, ' ').trim();
        const result = compileHandlerChain(typechain, handlerChain).replace(/\s+/g, ' ').trim();
        expect(result).toBe(expectedBody);
    });
  
});