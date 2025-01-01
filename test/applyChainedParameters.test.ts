import { applyChainedParams } from '../src/withResolver';
import { vi } from 'vitest';

describe('applyChainedParameters', () => {
    
  it('should apply a chain to a function', () => {
    const expression = {
      add: (a: number, b: number) => a + b
    };
    const result = applyChainedParams(expression, [{ add: [2, 3] }]);
    expect(result).toBe(5);
  });

  it('should apply multiple chains to a Promise', async () => {
    const result = await applyChainedParams(Promise.resolve(2), [
      { then: [(r: number) => r + 3] },
      { then: [(r: number) => r * 2] }
    ]);
    expect(result).toBe(10);
  });

  it('should apply multiple chains to a function', () => {
    const expression = new Map<string, number>();
    const result = applyChainedParams(expression, [
      { set: ['a', 1] },
      { set: ['b', 2] },
      { get: ['a'] }
    ]);
    expect(result).toBe(1);
  });

  it('should apply then catch finally to a Promise', () => {
    let tempResult = 0;
    let error;
    const result = applyChainedParams(Promise.resolve(2), [
      { then: [(r: number) => ((tempResult = r+3),tempResult)] },
      { then: [() => { throw new Error()}] },
      { catch: [(e: Error) => (error = e,error)] },
      { finally: [() => { throw { result: tempResult, error} }] },
      { catch: [(v: unknown) => v] }
    ]);
    result.then((r) => { 
      expect(r.result).toBe(5);
      expect(r.error).toBeInstanceOf(Error);
    } );
  });
});