import { withOnError } from '../src';
import { vi } from 'vitest';

describe('withOnError', () => {

  it('should run normally if no handler is provided', () => {
    const callee = () => 42;
    const wrapped = withOnError(callee);
    const result =  wrapped();
    expect(result).toBe(42);
  });

  it('should run normally for an async function if no handler is provided', async () => {
    const callee = async () => 42;
    const wrapped = withOnError(callee);
    const result = await wrapped();
    expect(result).toBe(42);
  });

  it('should call onError handler', () => {
    const callee = () => { throw new Error('test'); };
    const onError = vi.fn((params) => ({ result: params.caught }));
    const wrapped = withOnError(callee, onError);
    const result =  wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
  });

  it('should call onError for an async function', async () => {
    const callee = async () => { throw new Error('test'); };
    const onError = vi.fn((params) => ({ caught: params.caught }));
    const wrapped = withOnError(callee, onError);
    const result = await wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
  });

  it('should be possible to modify the error on call', () => {
    const callee = vi.fn(() => { throw new Error('test'); });
    const onError = vi.fn((params) => ({ caught: new Error('modified') }));
    const wrapped = withOnError(callee, onError);
    const result = wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('modified');
    expect(onError).toHaveBeenCalled();
  });

  it('should be possible to modify the error on call of an async function', async () => {
    const callee = vi.fn(async () => { throw new Error('test'); });
    const onError = vi.fn((params) => ({ caught: new Error('modified') }));
    const wrapped = withOnError(callee, onError);
    const result = await wrapped();
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('modified');
    expect(onError).toHaveBeenCalled();
  });

});