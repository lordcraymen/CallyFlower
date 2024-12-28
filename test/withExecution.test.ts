import { withExecution } from '../src/withExecution';
import { vi } from 'vitest';

describe('withExecution', () => {
  it('should call onCall handler', () => {
    const callee = () => 42;
    const onCall = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const wrapped = withExecution(callee, { onCall });
    const result =  wrapped();
    expect(result).toBe(42);
    expect(onCall).toHaveBeenCalled();
  });

  it('should wrap the fetch function', async () => {
    const onCall = vi.fn((params) => ({ result: params.callee(...params.args) }));
    global.fetch = withExecution(global.fetch, { onCall });
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const json = await response.json();
    expect(json.userId).toBe(1);
    expect(onCall).toHaveBeenCalledWith({ 
      event: 'onCall',
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
    const onCall = vi.fn((params) => ({ result: params.callee(...params.args) }));
    obj.getValue = withExecution(obj.getValue, { onCall });
    const result = obj.getValue();
    expect(result).toBe(42);
    expect(onCall).toHaveBeenCalled();
  });

  it('should monkeypatch an async method that relies on the object context', async () => {
    const obj = {
      value: 42,
      async getValue() {
        return this.value;
      }
    };
    const onCall = vi.fn((params) => ({ result: params.callee(...params.args) }));
    obj.getValue = withExecution(obj.getValue, { onCall });
    const result = await obj.getValue();
    expect(result).toBe(42);
    expect(onCall).toHaveBeenCalled();
  });

  it('should have all the properties of the original function', () => {
    function callee() { return 42; }
    callee["prop"] = 'value';
    const wrapped = withExecution(callee);
    expect(wrapped["prop"]).toBe('value');
  });

  it('should have the same prototype as the original function', () => {
    function Child(age:Number) {
      this.age = age;
    }
    const onCall = vi.fn((params) => ({ result: params.callee(params.args * 2) }));
    const ChildWithExecution = withExecution(Child, { onCall });
    const testChild = new ChildWithExecution(5);
    expect(testChild).toBeInstanceOf(Child);
    expect(onCall).toHaveBeenCalledWith({
      event: 'onCall',
      callee: expect.any(Function),
      args: [5]
    });
    expect(testChild.age).toBe(10);
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
    const onCall = vi.fn((params) => ({ result: params.callee(...params.args) }));
    const onCatch = vi.fn((params) => ({ caught: params.caught }));
    const wrapped = withExecution(callee, { onCall, onCatch });
    try {
       wrapped();
    } catch (error) {
      expect(error.message).toBe('error');
      expect(onCall).toHaveBeenCalled();
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
    const onReturn = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onReturn });
    const result = wrapped();
    expect(result).toBe(43);
    expect(onReturn).toHaveBeenCalled();
  });

  it('should be possible to overload the set method on a map with logging', () => {
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const map = new Map();
    const onCall = vi.fn((params) => {
        console.log(`setting ${params.args[0]} to ${params.args[1]}`);
        return { result: params.callee(...params.args) };
    });
    map.set = withExecution(map.set, { onCall });
    map.set('key', 'value');
    expect(map.get('key')).toBe('value');
    expect(console.log).toHaveBeenCalledWith('setting key to value');
    consoleMock.mockRestore();
  });

});