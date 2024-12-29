/**
 * Check if a value is a function
 * @param value - The value to check
 * @returns {value is (...args: any) => any} - True if the value is a function
 */
const isCallable = (value: any): value is (...args: any) => any => value?.call === Function.prototype.call;


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

export { isCallable, throwIfNotCallable };