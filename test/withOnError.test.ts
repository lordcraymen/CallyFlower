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
    const error = new Error("error");
    const callee = () => { throw error };
    const onError = vi.fn((params) => ({ caught: null, result: 43 }));
    const wrapped = withOnError(callee, onError as any);
    const result = wrapped();
    expect(result).toBe(43);
    expect(onError).toHaveBeenCalledWith({ event: "onError", callee: expect.any(Function), args: [], caught: error });
  });

  it('should be possible to modify the Error on catch', () => {
    const error = new Error("error");
    const callee = () => { throw error };
    const wrapped = withOnError(callee, ({caught}) => ({ caught: caught.message = "changed error", result: 43 }));
    try {
      wrapped();
    } catch (e) {
      expect(e).toBe("changed error");
    }
  });

});