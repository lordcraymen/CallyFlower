import { withExecution } from '../src/withExecution';
import { vi } from 'vitest';

describe('withExecution', () => {
  it('should call onExecution handler', async () => {
    const callee = async () => 42;
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const wrapped = withExecution(callee, { onExecution });
    const result = await wrapped();
    expect(result).toBe(42);
    expect(onExecution).toHaveBeenCalled();
  });

  it('should wrap the fetch function', async () => {
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    global.fetch = withExecution(global.fetch, { onExecution });
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const json = await response.json();
    expect(json.userId).toBe(1);
    expect(onExecution).toHaveBeenCalledWith({ 
      event: 'onExecution',
      callee: expect.any(Function),
      args: ['https://jsonplaceholder.typicode.com/todos/1'] });
  });

  it('should monkeypatch a method that relies on the object context', () => {
    const obj = {
      value: 42,
      getValue() {
        return this.value;
      }
    };
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    obj.getValue = withExecution(obj.getValue, { onExecution });
    const result = obj.getValue();
    expect(result).toBe(42);
    expect(onExecution).toHaveBeenCalled();
  });

  it('should monkeypatch an async method that relies on the object context', async () => {
    const obj = {
      value: 42,
      async getValue() {
        return this.value;
      }
    };
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    obj.getValue = withExecution(obj.getValue, { onExecution });
    const result = await obj.getValue();
    expect(result).toBe(42);
    expect(onExecution).toHaveBeenCalled();
  });

  it('should have all the properties of the original function', () => {
    function callee() { return 42; }
    callee["prop"] = 'value';
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const wrapped = withExecution(callee, { onExecution });
    expect(wrapped["prop"]).toBe('value');
  });

  it('should have the same prototype as the original function', () => {
    function callee() { return 42; }
    function Child() { }
    callee.prototype = new Child();
    const onExecution = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const wrapped = withExecution(callee, { onExecution });
    expect(wrapped.prototype).toBeInstanceOf(Child);
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
    const onExecution = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onExecution });
    const result = wrapped();
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