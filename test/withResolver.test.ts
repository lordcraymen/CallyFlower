import { withResolver } from '../src/withResolver';
import { vi } from 'vitest';

describe('withResolver', () => {

  it('should run normally if no handler is provided', () => {
    const callee = p => p;
    const wrapped = withResolver(callee).then(p => p);
    const result = wrapped(42);
    expect(result).toBe(42);
  });

  it('should run normally for an async function if no handler is provided', async () => {
    const callee = async (p) => p;
    const wrapped = withResolver(callee);
    const result = await wrapped(42);
    expect(result).toBe(42);
  });

  it('should call a then chain for an sync function', () => {
    const callee = (v: number) => v;
    const then = vi.fn((r: number) => r);
    const secondThen = vi.fn((r: number) => r * 2);
    const result = withResolver(callee).then(then).then(secondThen)(10);
    expect(result).toBe(20);
    expect(then).toHaveBeenCalled();
    expect(secondThen).toHaveBeenCalledWith(10);
  });

  it('should call a then chain for an async function', async () => {
    const callee = async (v: number) => v;
    const then = vi.fn((p) => p * 2);
    const secondThen = vi.fn((result) => result * 2);
    const result = await withResolver(callee).then(then).then(secondThen)(5);
    expect(result).toBe(20);
    expect(then).toHaveBeenCalledWith(5);
    expect(secondThen).toHaveBeenCalledWith(10);
  });

  it('should call catch handler', () => {
    const callee = (_n: number) => { throw new Error('error') }
    const catchFn = vi.fn((error) => error);
    const wrapped = withResolver(callee).catch(catchFn);
    const result = wrapped(42);
    expect(result).toBeInstanceOf(Error);
    expect(catchFn).toHaveBeenCalled();
  });

  it('should call catch for an async function', async () => {
    const callee = async () => { throw new Error('error') };
    const catchFn = vi.fn((error) => { error.message = 'overloaded error'; return error });
    const wrapped = withResolver(callee).catch(catchFn);
    const result = await wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('overloaded error');
    expect(catchFn).toHaveBeenCalled();
  });

  it('should call finally handler', () => {
    const callee = (_p: number) => 42;
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).finally(finallyFn);
    const result = wrapped(42);
    expect(result).toBe(42);
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call finally for an async function', async () => {
    const callee = async () => 42;
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).finally(finallyFn);
    const result = await wrapped();
    expect(result).toBe(42);
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call all handlers in the correct order', () => {
    const callee = (v: number) => v;
    const then = vi.fn((r: number) => r);
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then).catch(catchFn).finally(finallyFn);
    const result = wrapped(42);
    expect(result).toBe(42);
    expect(then).toHaveBeenCalled();
    expect(catchFn).not.toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call all handlers in the correct order for an async function', async () => {
    const callee = async (v: number) => v;
    const then = vi.fn((r: number) => r);
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then as any).catch(catchFn).finally(finallyFn);
    const result = await wrapped(42);
    expect(result).toBe(42);
    expect(then).toHaveBeenCalled();
    expect(catchFn).not.toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call all handlers in the correct order with an error', () => {
    const callee = (_n: number) => { throw new Error('error') };
    const then = vi.fn((r: number) => r);
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then).catch(catchFn).finally(finallyFn).
    const result = wrapped(42);
    expect(result).toBeInstanceOf(Error);
    expect(then).not.toHaveBeenCalled();
    expect(catchFn).toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should call all handlers in the correct order for an async function with an error', async () => {
    const callee = async (_n: number) => { throw new Error('error') };
    const then = vi.fn((r: number) => r);
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then as any).catch(catchFn).finally(finallyFn);
    const result = await wrapped(42);
    expect(result).toBeInstanceOf(Error);
    expect(then).not.toHaveBeenCalled();
    expect(catchFn).toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should handle sync function with handler that returns promise mid-chain', async () => {
    const callee = (v: number) => v;  // SYNC callee
    const syncHandler = (r: number) => r * 2;  // SYNC handler  
    const asyncHandler = (r: number) => Promise.resolve(r + 10); // ASYNC handler
    const secondSyncHandler = (r => r * 3); // Another SYNC handler

    const wrapped = withResolver(callee)
      .then(syncHandler)
      .then(asyncHandler)    // <- Transition point!
      .then(secondSyncHandler);

    const result = await wrapped(5);
    expect(result).toBe(60); // ((5 * 2) + 10) * 3 = 60
  });

  it('should apply all handlers if at somepoint in the callchain a promise is returned', async () => {
    const callee = async (v: number) => v;
    const then = vi.fn((r: number) => Promise.resolve(r));
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then as any).catch(catchFn).finally(finallyFn);
    const result = await wrapped(42)
    expect(result).toBe(42);
    expect(then).toHaveBeenCalled();
    expect(catchFn).not.toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it('should apply all handlers if at somepoint in the callchain a promise is returned and an error is thrown', async () => {
    const callee = async (v: number) => v;
    const then = vi.fn((r: number) => Promise.reject(new Error('error')));
    const catchFn = vi.fn((error) => error);
    const finallyFn = vi.fn(() => { });
    const wrapped = withResolver(callee).then(then as any).catch(catchFn).finally(finallyFn);
    const result = await wrapped(42);
    expect(result).toBeInstanceOf(Error);
    expect(then).toHaveBeenCalled();
    expect(catchFn).toHaveBeenCalled();
    expect(finallyFn).toHaveBeenCalled();
  });

  it("should be able to monkeypatch a method of an object like Map", () => {
    const map = new Map();
    const set = vi.fn((p) => p);
    map.set = withResolver(map.set).then(set).catch((r) => (console.error(r), r));
    map.set(1, 2);
    expect(map.get(1)).toBe(2);
    expect(set).toHaveBeenCalledWith(map);
  });

});
