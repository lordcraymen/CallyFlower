import { compilehc, TypeChain } from '../src/compileHandlerChain';



//vriable names are not important, just need to be unique:
// a = args
// aw = async mapping
// hc = handler chain
// r = result

// In compileHandlerChain.test.ts hinzufügen:
function normalize(code: string): string {
    return code
        // Alle Zeilenumbrüche und Tabs entfernen
        .replace(/[\r\n\t]/g, '')
        // Mehrfache Leerzeichen zu einem
        .replace(/\s+/g, ' ')
        // Leerzeichen um Klammern, Semikolons, etc. entfernen
        .replace(/\s*([{}();,])\s*/g, '$1')
        // Leerzeichen um Operatoren normalisieren
        .replace(/\s*(===|!==|==|!=|<=|>=|<|>|\|\||&&)\s*/g, ' $1 ')
        .replace(/\s*([=+\-*/])\s*/g, ' $1 ')
        // return, var, try, catch, etc. mit einem Leerzeichen
        .replace(/\b(return|var|try|catch|finally|if|instanceof)\s+/g, '$1 ')
        .trim();
}

describe('compilehc', () => {
    it('should handle an empty handler chain', () => {
        const typechain: TypeChain = [];
        const hc: Array<Function> = [];

        const expected = `{return a;}`;
        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with only catch handlers (it should simply ignore the catch handlers)', () => {
        const typechain: TypeChain = [1, 1];
        const hc = [
            (error) => `catch1: ${error}`,
            (error) => `catch2: ${error}`
        ];

        const expected = `{return a;}`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });
    it('should compile a simple handler chain with then', () => {
        const typechain: TypeChain = [0];
        const hc = [() => 'result'];

        const expected = "{var r;r = hc[0].apply(c,a);return r;}";

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

     it('should compile a handler chain with only finallys', () => {
        const typechain: TypeChain = [2,2,2];
        const hc = [
            () => { console.log('finally') },
            () => { console.log('finally2') },
            () => { console.log('finally3') }
        ];

        const expected = "{hc[0]();hc[1]();hc[2]();return a;}";

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with multiple then handlers', () => {
        const typechain: TypeChain = [0, 0];
        const hc = [
            (arg) => `then1: ${arg}`,
            (arg) => `then2: ${arg}`
        ];

        //if the last handler is a then, there is no need to check for a Promise
        // because there is no catch or finally handler after it that would require it
        const expected =
            `{
            var r; 
            r = hc[0].apply(c, a);
            if (r instanceof Promise) return aw(r,hc,1);
            r = hc[1].call(c,r);
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with then and catch', () => {
        const typechain: TypeChain = [0, 1];
        const hc = [
            (arg) => `then: ${arg}`,
            (error) => `catch: ${error}`
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e1) {
                return hc[1].call(c,e1);
            }
            return r;
        }`;
        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with then, catch, and finally', () => {
        const typechain: TypeChain = [0, 1, 2];
        const hc = [
            (arg) => `then: ${arg}`,
            (error) => error,
            () => { console.log('finally') }
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e1) {
                return hc[1].call(c, e1);
            } finally {
                hc[2]();
            }
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with then and finally', () => {
        const typechain: TypeChain = [0, 2];
        const hc = [
            (arg) => `then: ${arg}`,
            () => { console.log('finally') }
        ];

        const expected = "{var r;try{r = hc[0].apply(c,a);if(r instanceof Promise)return aw(r,hc,1);}finally{hc[1]();}return r;}";

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

   

    it('should compile a handler chain with multiple then handlers', () => {
        const typechain: TypeChain = [0, 0];
        const hc = [
            (arg) => `then1: ${arg}`,
            (arg) => `then2: ${arg}`
        ];

        //if the last handler is a then, there is no need to check for a Promise
        // because there is no catch or finally handler after it that would require it
        const expected =
            `{
            var r; 
            r = hc[0].apply(c, a);
            if (r instanceof Promise) return aw(r,hc,1);
            r = hc[1].call(c,r);
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with then, catch, and multiple finally handlers', () => {
        const typechain: TypeChain = [0, 1, 2, 2];
        const hc = [
            (arg) => `then: ${arg}`,
            (error) => `catch: ${error}`,
            () => { console.log('finally1') },
            () => { console.log('finally2') }
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e) {
                return hc[1].call(c, e);
            } finally {
                hc[2]();
                hc[3]();
            }
            return r;
        }`;


        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with multiple alternating then and catch handlers', () => {
        const typechain: TypeChain = [0, 1, 0, 1];
        const hc = [
            (arg) => `then1: ${arg}`,
            (error) => `catch1: ${error}`,
            (arg) => `then2: ${arg}`,
            (error) => `catch2: ${error}`
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e) {
                return hc[1].call(c, e);
            }
            try {
                r = hc[2].call(c, r);
                if (r instanceof Promise) return aw(r,hc,3);
            } catch (e) {
                return hc[3].call(c, e);
            }
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(result).toBe(expected);
    });

    it('should compile a handler with a then and multiple catch handlers (the n+1 catch catches the nth)', () => {
        const typechain: TypeChain = [0, 1, 1];
        const hc = [
            (arg) => `then: ${arg}`,
            (error) => `catch1: ${error}`,
            (error) => `catch2: ${error}`
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e1) {
                try {
                    return hc[1].call(c, e1);
                } catch (e2) {
                    return hc[2].call(c, e2);
                }
            }
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

    it('should compile a handler chain with multiple catch handlers (the n+1th catches the nth) and multiple finally handlers', () => {
        const typechain: TypeChain = [0, 1, 1, 1, 2, 2];
        const hc = [
            (arg) => `then: ${arg}`,
            (error) => `catch1: ${error}`,
            (error) => `catch2: ${error}`,
            (error) => `catch3: ${error}`,
            () => { console.log('finally1') },
            () => { console.log('finally2') }
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
            } catch (e1) {
                try {
                    return hc[1].call(c, e1);
                } catch (e2) {
                    try {
                        return hc[2].call(c, e2);
                    } catch (e3) {
                        return hc[3].call(c, e3);
                    }
                }
            } finally {
                hc[4]();
                hc[5]();
            }
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });



    it('should compile a handler chain with then-finally-catch pattern', () => {
        const typechain: TypeChain = [0, 2, 1];
        const hc = [
            (arg) => `then: ${arg}`,
            () => { console.log('finally') },
            (error) => `catch: ${error}`
        ];

        const expected =
            `{
            var r; 
            try {
                r = hc[0].apply(c, a);
                if (r instanceof Promise) return aw(r,hc,1);
                hc[1]();
            } catch (e) {
                return hc[2].call(c, e);
            }
            return r;
        }`;

        const result = compilehc(typechain, hc);
        expect(normalize(result)).toBe(normalize(expected));
    });

});