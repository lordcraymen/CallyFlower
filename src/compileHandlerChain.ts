export type TypeChain = Array<0 | 1 | 2>; // 0=THEN, 1=CATCH, 2=FINALLY

const THEN = 0;
const CATCH = 1;
const FINALLY = 2;

export function compileHandlerChain(typeChain: TypeChain, handlerChain: Array<Function>): string {
  if (typeChain.length === 0) {
    return "return args;";
  }

  let code = "";
  
  // Handle special case: only finally handlers
  if (typeChain.every(type => type === FINALLY)) {
    for (let i = 0; i < typeChain.length; i++) {
      code += `handlerChain[${i}]();`;
      if (i < typeChain.length - 1) code += "\n";
    }
    return code;
  }

  code += "let v;\n";
  
  let i = 0;
  let inTryBlock = false;
  let hasCatch = false;
  let finallyHandlers: number[] = [];
  
  // Collect finally handlers for the finally block
  for (let j = 0; j < typeChain.length; j++) {
    if (typeChain[j] === FINALLY) {
      finallyHandlers.push(j);
    }
  }
  
  while (i < typeChain.length) {
    const type = typeChain[i];
    
    if (type === FINALLY) {
      i++;
      continue; // Skip finally handlers in main loop, handle them at the end
    }
    
    if (type === CATCH) {
      i++;
      continue; // Skip catch handlers, they're handled in catch blocks
    }
    
    // Check if we need a try block (if there's a catch handler after this then)
    const nextCatchIndex = findNextCatch(typeChain, i);
    const needsTry = nextCatchIndex !== -1;
    
    if (needsTry && !inTryBlock) {
      code += "try {\n";
      inTryBlock = true;
      hasCatch = true;
    }
    
    // Generate the then handler call
    if (i === 0) {
      // First handler gets the original args
      code += `${inTryBlock ? '    ' : ''}v = handlerChain[${i}].apply(context, args);\n`;
    } else {
      // Subsequent handlers get the single value
      code += `${inTryBlock ? '    ' : ''}v = handlerChain[${i}].call(context, v);\n`;
    }
    
    // Check for Promise return
    if (needsTry) {
      code += `${inTryBlock ? '    ' : ''}if (v instanceof Promise)  return v;\n`;
    }
    
    i++;
    
    // Check if we need to close the try block and add catch
    const nextThenIndex = findNextThen(typeChain, i);
    const shouldCloseTry = inTryBlock && (nextThenIndex === -1 || findNextCatch(typeChain, i) !== nextCatchIndex);
    
    if (shouldCloseTry && inTryBlock) {
      code += "} catch (e) {\n";
      code += `    return handlerChain[${nextCatchIndex}].call(context, e);\n`;
      code += "}";
      
      // Add finally block if we have finally handlers
      if (finallyHandlers.length > 0) {
        code += " finally {\n";
        for (const finallyIndex of finallyHandlers) {
          code += `    handlerChain[${finallyIndex}]();\n`;
        }
        code += "}";
      }
      
      code += "\n";
      inTryBlock = false;
    }
  }
  
  // Handle case where we don't have try/catch but still need Promise check
  if (!hasCatch && typeChain.some(type => type === THEN)) {
    code += "if (v instanceof Promise)  return v;\n";
  }
  
  // Add finally handlers if no try/catch block was used
  if (!hasCatch && finallyHandlers.length > 0) {
    for (const finallyIndex of finallyHandlers) {
      code += `handlerChain[${finallyIndex}]();\n`;
    }
  }
  
  // Return the result
  if (typeChain.some(type => type === THEN)) {
    code += "return v;";
  }
  
  return code.trim();
}

function findNextCatch(typeChain: TypeChain, startIndex: number): number {
  for (let i = startIndex; i < typeChain.length; i++) {
    if (typeChain[i] === CATCH) {
      return i;
    }
  }
  return -1;
}

function findNextThen(typeChain: TypeChain, startIndex: number): number {
  for (let i = startIndex; i < typeChain.length; i++) {
    if (typeChain[i] === THEN) {
      return i;
    }
  }
  return -1;
}