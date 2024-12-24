/**
 * Check if a value is a function
 * @param value - The value to check
 * @returns {value is (...args: any) => any} - True if the value is a function
 */
const isCallable = (value: any): value is (...args: any) => any => value?.call === Function.prototype.call;

/**
 * Check if a function is synchronous
 * @param func - The function to check
 * @returns {boolean} - True if the function is synchronous
 */
const isSynchronous = <F extends (...args: any) => any>(func: F): boolean => isCallable(func) && func.constructor.name === "Function";

/**
 * throw an error if the value is not a function
 * @param func - The function to check
 * @throws {Error} - If the value is not a function
 */
const throwIfNotCallable = <F extends Function>(func: F): F  => {
    if (!isCallable(func)) {
        throw new Error(`Expected a function, but got ${func}`);
    }
    return func;
}


/**
 * Merge options with am optional transformer function
 * @template H - The type of the transformer function
 * @param options {any} - The options to merge
 * @param transformer {H} - The transformer function 
 * @returns {any} - The merged options, either synchronously or asynchronously. if the transformer function returns a promise, the result will be a promise
 */
function baseMerge<H extends (params: any) => any>(
    options: Parameters<H>[0],
    transformer?: H
): Parameters<H>[0] | Promise<Parameters<H>[0]> {
    if (!transformer) return options;
    const maybePromise = transformer(options);
    return Promise.resolve(maybePromise).then(res => ({ ...options, ...(res || {}) }));
}

/**
 * Merge options with am optional transformer function synchronously
 * @template H - The type of the transformer function
 * @param options {any} - The options to merge
 * @param transformer {H} - The transformer function 
 * @returns {any} - The merged options
 */
const syncMerge = <H extends (params: any) => any>(
    options: Parameters<H>[0],
    transformer?: H
): Parameters<H>[0] => {
    const result = transformer ? transformer(options) : null;
    return { ...options, ...(result || {}) };
};

/**
 * Merge options with am optional transformer function asynchronously
 * @template H - The type of the transformer function
 * @param options {any} - The options to merge
 * @param transformer {H} - The transformer function 
 * @returns {Promise<any>} - The merged options
 */
const asyncMerge = async <H extends (params: any) => any>(
    options: Parameters<H>[0],
    transformer?: H
): Promise<Parameters<H>[0]> => {
    return baseMerge(options, transformer) as Promise<Parameters<H>[0]>;
};

export { isCallable, isSynchronous, throwIfNotCallable, baseMerge, syncMerge, asyncMerge };