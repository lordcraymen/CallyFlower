import { withExecution } from '../src/withExecution';
import { vi } from 'vitest';

describe('withExecution', () => {

  it('should run normally if no handler is provided', () => {
    const callee = () => 42;
    const wrapped = withExecution(callee);
    const result =  wrapped();
    expect(result).toBe(42);
  });

  it('should run normally for an async function if no handler is provided', async () => {
    const callee = async () => 42;
    const wrapped = withExecution(callee);
    const result = await wrapped();
    expect(result).toBe(42);
  });

  it('should call onCall handler', () => {
    const callee = () => 42;
    const onCall = vi.fn();
    const wrapped = withExecution(callee, { onCall });
    const result =  wrapped();
    expect(result).toBe(42);
    expect(onCall).toHaveBeenCalled();
  });

  it('should call onCall for an async function', async () => {
    const callee = async () => 42;
    const spy = vi.fn();
    const wrapped = withExecution(callee, { onCall: ({callee,args}) => (spy(),callee(...args)) });
    const result = await wrapped();
    expect(result).toBe(42);
    expect(spy).toHaveBeenCalled();
  });

  it('should be possible to modify the result on call', () => {
    const callee = vi.fn(() => 42);
    const onCall = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onCall });
    const result = wrapped();
    expect(result).toBe(43);
    expect(onCall).toHaveBeenCalled();
  });

  it('should be possible to modify the result on call of an async function', async () => {
    const callee = vi.fn(async () => 42);
    const onCall = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onCall } as any);
    const result = await wrapped();
    expect(result).toBe(43);
    expect(onCall).toHaveBeenCalled();
  });

  it('should be possible to modify the arguments on call', () => {
    const callee = vi.fn((a:number, b:number) => a + b);
    const onCall = vi.fn(({args}:{args:[number,number]}) => ({ args: [args[0] * 2, args[1] * 2] }));
    const wrapped = withExecution(callee, { onCall} as any);
    const result = wrapped(2, 3);
    expect(result).toBe(10);
    expect(onCall).toHaveBeenCalled();
  });

  it('should be possible to modify the arguments on call of an async function', async () => {
    const callee = vi.fn(async (a:number, b:number) => a + b);
    const onCall = vi.fn(({args}:{args:[number,number]}) => ({ args: [args[0] * 2, args[1] * 2] }));
    const wrapped = withExecution(callee, { onCall} as any);
    const result = await wrapped(2, 3);
    expect(result).toBe(10);
    expect(onCall).toHaveBeenCalled();
  });

  it('should be possible to modify the result on return', () => {
    const callee = vi.fn(() => 42);
    const onReturn = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onReturn });
    const result = wrapped();
    expect(result).toBe(43);
    expect(onReturn).toHaveBeenCalled();
  });

  it('should be possible to modify the result on return of an async function', async () => {
    const callee = vi.fn(async () => 42);
    const onReturn = vi.fn((_) => ({ result: 43 }));
    const wrapped = withExecution(callee, { onReturn } as any);
    const result = await wrapped();
    expect(result).toBe(43);
    expect(onReturn).toHaveBeenCalled();
  });

  it('should call onCall and onCatch handler', () => {
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
    const onCatch = vi.fn((p) => ({ caught: null, result: 43 }));
    const wrapped = withExecution(callee, { onCatch });
    const result =  wrapped();
    expect(result).toBe(43);
    expect(onCatch).toHaveBeenCalled();
  });

  it('should be possible to suprress an error in an async function', async () => {  
    const callee = vi.fn(async () => { throw new Error('error') });
    const onCatch = vi.fn((p) => ({ caught: null, result: 43 }));
    const wrapped = withExecution(callee, { onCatch });
    const result = await wrapped();
    expect(result).toBe(43);
    expect(onCatch).toHaveBeenCalled();
  });

  it('should be possible to supress an error on an async function', () => {
    const callee = vi.fn(() => { throw new Error('error') });
    const onError = vi.fn((p) => ({ caught: undefined }));
    const onCatch = vi.fn((p) => p.caught instanceof Error ? onError?.(p) : p);
    const wrapped = withExecution(callee, { onCatch });
    const result =  wrapped();
    expect(result).toBeUndefined();
    expect(onCatch).toHaveBeenCalled();
  });

  it('should supress only errors', () => {
    const callee = vi.fn(() => { throw "hallo" });
    const onCatch = vi.fn((p) => p.caught instanceof Error ? ({ caught: undefined }) : p);
    const wrapped = withExecution(callee, { onCatch });
    try {
      wrapped();
    } catch (error) {
      expect(error).toBe("hallo");
    }
    expect(onCatch).toHaveBeenCalled();
  });

  it('should be possible to hook into an asynchronous function', async () => {
    const callee = vi.fn(async () => 41);
    const wrapped = withExecution(callee, { onReturn: ({result}) => ({ result: result.then(r => r+1) }) });
    const result = await wrapped();
    expect(result).toBe(42);
  });

  it('should return the original value if eventhndlers return void', () => {
    const callee = vi.fn(() => 42);
    const wrapped = withExecution(callee, { onCall: console.log, onReturn: console.log });
    const result = wrapped();
    expect(result).toBe(42);
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
      event: "onCall",
      callee: expect.any(Function),
      args: [5]
    });
    expect(testChild.age).toBe(10);
  });

  it('should monkeypatch a method that relies on the object context', () => {
    const obj = {
      value: 42,
      getValue() {
        return this.value;
      }
    };
    const onReturn = vi.fn(({result}) => ({ result: result + 1 }));
    obj.getValue = withExecution(obj.getValue, { onReturn });
    const result = obj.getValue();
    expect(result).toBe(43);
    expect(onReturn).toHaveBeenCalled();
  });

  it('should monkeypatch an async method that relies on the object context to return a different value', async () => {
    const obj = {
      value: 42,
      async getValue() {
        return this.value;
      }
    };
    const onReturn = vi.fn(({result}) => ({ result: result.then(r => r+1) }));
    obj.getValue = withExecution(obj.getValue, { onReturn });
    const result = await obj.getValue();
    expect(result).toBe(43);
    expect(onReturn).toHaveBeenCalled();
  }
  );

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