import { withResolver } from '../src/withResolver';
import { vi } from 'vitest';

describe('withResolver', () => {
    
  it('should run normally if no handler is provided', () => {
    const callee = p => p;
    const wrapped = withResolver(callee).then(p => p);
    const result =  wrapped(42);
    expect(result).toBe(42);
  });

  it('should run normally for an async function if no handler is provided', async () => {
    const callee = async () => 42;
    const wrapped = withResolver(callee);
    const result = await wrapped();
    expect(result).toBe(42);
  });

  it('should call then handler', () => {
    const callee = () => 42;
    const then = vi.fn((result) => result);
    const wrapped = withResolver(callee).then(then);
    const result =  wrapped();
    expect(result).toBe(42);
    expect(then).toHaveBeenCalled();
  });

  it('should call then for an async function', async () => {
    const callee = async (v:number) => v;
    const then = vi.fn((result) => 43);
    const secondThen = vi.fn((result) => {throw new Error('should not be called')}); 
    const result = await withResolver(callee).then(then).then(secondThen).catch(e => 43)(42);
    expect(result).toBe(43);
    expect(then).toHaveBeenCalled();
    expect(secondThen).toHaveBeenCalledWith(43);
  });

  it('should call catch handler', () => {
    const callee = () => { throw new Error('error') };
    const catchFn = vi.fn((error) => error);
    const wrapped = withResolver(callee).catch(catchFn);
    const result =  wrapped(42);
    expect(result).toBeInstanceOf(Error);
    expect(catchFn).toHaveBeenCalled();
  });

  it('should call catch for an async function', async () => {
    const callee = async () => { throw new Error('error') };
    const catchFn = vi.fn((error) => {error.message = 'overloaded error'; return error});
    const wrapped = withResolver(callee).catch(catchFn);
    const result = await wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('overloaded error');
    expect(catchFn).toHaveBeenCalled();
  });

  /*
  it('should call finally handler', () => {
    const callee = (_p:number) => 42;
    const finallyFn = vi.fn(({result}) => result);
    const wrapped = withResolver(callee).finally(finallyFn);
    const result =  wrapped(42);
    expect(result).toBe(42);
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call finally for an async function', async () => {
    const callee = async () => 42;
    const finallyFn = vi.fn(({result}) => result);
    const wrapped = withResolver(callee).finally(finallyFn);
    const result = await wrapped();
    expect(result).toBe(42);
    expect(finallyFn).toHaveBeenCalled();
    });
    */
});
