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
        caught: any;
        event: "onCatch";
    };

type OnResultHandlerOptions<F extends (...args: any) => any> =
    {
        callee: F;
        args: Parameters<F>;
        result: ReturnType<F> | Promise<ReturnType<F>>;
        event: "onResult";
    };

type OnCallHandler<F extends (...args: any) => any> = (params: OnCallHandlerOptions<F>) => { result: ReturnType<F> } | void;
type OnResultHandler<F extends (...args: any) => any> = (params: OnResultHandlerOptions<F>) => { result: ReturnType<F> } | { caught: any } | void;
type OnCatchHandler<F extends (...args: any) => any> = (params: OnCatchHandlerOptions<F>) => Partial<OnCatchHandlerOptions<F>> | void;

export { type OnCallHandler, type OnResultHandler, type OnCatchHandler, type OnCallHandlerOptions, type OnResultHandlerOptions, type OnCatchHandlerOptions };