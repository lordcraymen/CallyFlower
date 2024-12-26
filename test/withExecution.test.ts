import { withExecution } from '../src/withExecution';
import { vi } from 'vitest';

describe('withExecution', () => {
  it('should call onExecution handler', () => {
    const callee = vi.fn(() => 42);
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const wrapped = withExecution(callee, { onExecution });
    const result = wrapped();
    expect(result).toBe(42);
    expect(onExecution).toHaveBeenCalled();
  });

  it('should call onCatch handler', () => {
    const callee = vi.fn(() => { throw new Error('error') });
    const onCatch = vi.fn((params) => ({ caught: params.caught }));
    const wrapped = withExecution(callee, { onCatch });
    try {
        wrapped();
    } catch (error) {
      expect(error.message).toBe('error');
      expect(onCatch).toHaveBeenCalled();
    }
  });

  it('should call onExecution and onCatch handler', () => {
    const callee = vi.fn(() => { throw new Error('error') });
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const onCatch = vi.fn((params) => ({ caught: params.caught }));
    const wrapped = withExecution(callee, { onExecution, onCatch });
    try {
       wrapped();
    } catch (error) {
      expect(error.message).toBe('error');
      expect(onExecution).toHaveBeenCalled();
      expect(onCatch).toHaveBeenCalled();
    }
  });

  it('should be possible to supress an error', () => {
    const callee = vi.fn(() => { throw new Error('error') });
    const onCatch = vi.fn(() => ({ caught: undefined }));
    const wrapped = withExecution(callee, { onCatch });
    const result =  wrapped();
    expect(result).toBeUndefined();
    expect(onCatch).toHaveBeenCalled();
  });

  it('should be possible to modify the result', () => {
    const callee = vi.fn(() => 42);
    const onExecution = vi.fn((params) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onExecution });
    const result =  wrapped();
    expect(result).toBe(43);
    expect(onExecution).toHaveBeenCalled();
  });

  it('should be possible to overload the set method on a map with logging', () => {
    const map = new Map();
    const onExecution = vi.fn((params) => {
        console.log(`setting ${params.args[0]} to ${params.args[1]}`);
        return { result: params.callee(...params.args) };
    });
    map.set = withExecution(map.set);
    map.set('key', 'value');
    expect(map.get('key')).toBe('value');
  });

});