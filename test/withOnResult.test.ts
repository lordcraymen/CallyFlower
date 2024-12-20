import { withOnResult } from '../src/withOnResult';
import { vi } from 'vitest';

describe('withOnResult', () => {
    
    it('should return the original function if no event handler is provided', () => {
        const fn = vi.fn();
        const wrapped = withOnResult(fn);
        expect(wrapped).toBe(fn);
    });
    
    it('should return a function', () => {
        const onResult = withOnResult(() => { });
        expect(onResult).toBeInstanceOf(Function);
    });

    it('should call the onResult event handler', () => {
        const onResult = vi.fn();
        const wrapped = withOnResult(onResult);
        wrapped();
        expect(onResult).toHaveBeenCalled();
    });

    it('should pass the arguments to the onResult event handler', () => {
        const onResult = vi.fn();
        const wrapped = withOnResult(onResult);
        wrapped(1, 2, 3);
        expect(onResult).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should short circuit the function with the result returned from the onResult event handler', () => {
        const onResult = vi.fn(() => 'result');
        const wrapped = withOnResult(onResult);
        const result = wrapped();
        expect(result).toBe('result');
    });
});