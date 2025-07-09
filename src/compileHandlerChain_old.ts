export type TypeChain = Array<0 | 1 | 2>; // 0=THEN, 1=CATCH, 2=FINALLY

const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

export function compilehc(typeChain: TypeChain, handlerChain: Array<Function>): string {
    // Handle empty chain - just return args
    if (typeChain.length === 0 || hasOnlyCatchHandlers(typeChain)) {
        return "{return a;}";
    }

    // If the first handler is THEN, we can start with a variable declaration
    if (typeChain.length === 1 && typeChain[0] === THEN) {
        return "{return hc[0].apply(c, a);}";
    }
    
    // Handle only finally handlers - execute them and return args
    if (hasOnlyFinallyHandlers(typeChain)) {
        return generateOnlyFinallyChain(typeChain);
    }
    
    // Generate complex handler chain
    return generateComplexChain(typeChain);
}

function hasOnlyCatchHandlers(typeChain: TypeChain): boolean {
    // Check if all handlers are CATCH (1)
    return typeChain.every(type => type === CATCH);
}

function hasOnlyFinallyHandlers(typeChain: TypeChain): boolean {
    // Check if all handlers are FINALLY (2)
    return typeChain.every(type => type === FINALLY);
}

function generateOnlyFinallyChain(typeChain: TypeChain): string {
    // Generate: { hc[0](); hc[1](); ... return a; }
    let code = '{';
    for (let i = 0; i < typeChain.length; i++) {
        code += `hc[${i}]();`;
    }
    code += 'return a;}';
    return code;
}

function generateComplexChain(typeChain: TypeChain): string {
    // Start with variable declaration
    let code = '{var r;';
    
    // Process handlers in groups (try blocks)
    const handlerGroups = groupHandlers(typeChain);
    
    for (const group of handlerGroups) {
        code += generateHandlerGroup(group);
    }

    code += 'return r;}';
    return code;
}

interface HandlerGroup {
    then: number[];
    catch: number[];
    finally: number[];
}

function groupHandlers(typeChain: TypeChain): HandlerGroup[] {
    // Group consecutive handlers that belong in same try block
    // Logic: Group THEN handlers with their following CATCH and FINALLY
    const groups: HandlerGroup[] = [];
    let currentGroup: HandlerGroup = { then: [], catch: [], finally: [] };
    
    for (let i = 0; i < typeChain.length; i++) {
        const type = typeChain[i];
        
        if (type === THEN) {
            // If we have a previous group with content, save it
            if (currentGroup.then.length > 0) {
                groups.push(currentGroup);
                currentGroup = { then: [], catch: [], finally: [] };
            }
            currentGroup.then.push(i);
        } else if (type === CATCH) {
            currentGroup.catch.push(i);
        } else if (type === FINALLY) {
            currentGroup.finally.push(i);
        }
    }
    
    // Add the last group
    if (currentGroup.then.length > 0 || currentGroup.catch.length > 0 || currentGroup.finally.length > 0) {
        groups.push(currentGroup);
    }
    
    return groups;
}

function generateThenHandler(index: number, isFirst: boolean, isLast: boolean, inTryBlock: boolean = true): string {
    let code = '';
    
    if (isFirst) {
        // Nur der allererste Handler in der gesamten Chain bekommt apply mit args
        code += `r = hc[${index}].apply(c, a);`;
    } else {
        // Alle anderen THEN Handler bekommen call mit dem vorherigen Ergebnis
        code += `r = hc[${index}].call(c, r);`;
    }
    
    // Promise check nur hinzufügen wenn es NICHT der letzte Handler ist
    if (!isLast) {
        code += `if (r instanceof Promise) return aw(r,hc,${index + 1});`;
    }

    return code;
}

function generateHandlerGroup(group: HandlerGroup): string {
    let code = '';
    
    const hasCatch = group.catch.length > 0;
    const hasFinally = group.finally.length > 0;
    
    if (hasCatch || hasFinally) {
        code += 'try {';
        
        // Generate THEN handlers
        for (let i = 0; i < group.then.length; i++) {
            const thenIndex = group.then[i];
            const isFirst = thenIndex === 0;
            const isLast = i === group.then.length - 1 && group.catch.length === 0; // Letzter wenn keine catch handler folgen
            code += generateThenHandler(thenIndex, isFirst, isLast);
        }
        
        // Generate FINALLY handlers (falls welche im try block sind)
        for (const finallyIndex of group.finally) {
            code += `hc[${finallyIndex}]();`;
        }
        
        code += '}';
        
        // Generate CATCH handlers (nested)
        if (hasCatch) {
            code += generateCatchBlock(group.catch);
        }
    } else {
        // No try-catch needed, just execute THEN handlers
        for (let i = 0; i < group.then.length; i++) {
            const thenIndex = group.then[i];
            const isFirst = thenIndex === 0;
            const isLast = i === group.then.length - 1; // Definitiv der letzte ohne catch/finally
            code += generateThenHandler(thenIndex, isFirst, isLast, false);
        }
        
        // Execute FINALLY handlers
        for (const finallyIndex of group.finally) {
            code += `hc[${finallyIndex}]();`;
        }
    }
    
    return code;
}

function generateCatchBlock(catchIndices: number[]): string {
    // Generate nested catch blocks: catch (e1) { try { return hc[1]... } catch (e2) { ... } }
    let code = '';
    
    for (let i = 0; i < catchIndices.length; i++) {
        const catchIndex = catchIndices[i];
        const errorVar = `e${i + 1}`;
        
        code += `catch (${errorVar}) {`;
        
        if (i < catchIndices.length - 1) {
            // Not the last catch, wrap in try
            code += `try {`;
            code += `return hc[${catchIndex}].call(c, ${errorVar});`;
            code += `}`;
        } else {
            // Last catch, direct return
            code += `return hc[${catchIndex}].call(c, ${errorVar});`;
            code += '}';
        }
    }
    
    // Close remaining catch blocks
    for (let i = 0; i < catchIndices.length - 1; i++) {
        code += '}';
    }
    
    return code;
}

function generateFinallyBlock(finallyIndices: number[]): string {
    // Generate: finally { hc[2](); hc[3](); }
    let code = ' finally {';
    
    for (const finallyIndex of finallyIndices) {
        code += `hc[${finallyIndex}]();`;
    }

    code += '}';
    return code;
}

