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
});