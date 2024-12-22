type OnCallHandlerOptions<F extends (...args: any) => any> = {
    callee: F;
    args: Parameters<F>;
    result?: ReturnType<F> | Promise<ReturnType<F>>;
    event: "onCall";
};

type OnCatchHandlerOptions<F extends (...args: any) => any> =
    {
        callee: F;
        args: Parameters<F>;
        result?: ReturnType<F> | Promise<ReturnType<F>>;
        caught: unknown;
        event: "onCatch";
    };

type OnCompletionHandlerOptions<F extends (...args: any) => any> =
    {
        callee: F;
        args: Parameters<F>;
        result: ReturnType<F> | undefined;
        caught: unknown;
        event: "onCompletion";
    };

type OnResultHandlerOptions<F extends (...args: any) => any> =
    {
        callee: F;
        args: Parameters<F>;
        result: ReturnType<F> | Promise<ReturnType<F>>;
        event: "onResult";
    };

type OnErrorHandlerOptions<F extends (...args: any) => any> =
    {
        callee: F;
        args: Parameters<F>;
        result: ReturnType<F> | Promise<ReturnType<F>>;
        caught: Error;
        event: "onError";
};

type OnCallHandler<F extends (...args: any) => any> = (params: OnCallHandlerOptions<F>) => { result: ReturnType<F> } | void;
type OnCompletionHandler<F extends (...args: any) => any> = (params: OnCompletionHandlerOptions<F>) => { result: ReturnType<F> } | void;
type OnResultHandler<F extends (...args: any) => any> = (params: OnResultHandlerOptions<F>) => { result: ReturnType<F> } | { caught: any } | void;
type OnCatchHandler<F extends (...args: any) => any> = (params: OnCatchHandlerOptions<F>) => Partial<OnCatchHandlerOptions<F>> | void;
type OnErrorHandler<F extends (...args: any) => any> = (params: OnErrorHandlerOptions<F>) => Partial<OnErrorHandlerOptions<F>> | void;
export { type OnCallHandler, type OnCompletionHandler, type OnResultHandler, type OnCatchHandler, type OnErrorHandler, type OnCallHandlerOptions, type OnResultHandlerOptions, type OnCatchHandlerOptions };