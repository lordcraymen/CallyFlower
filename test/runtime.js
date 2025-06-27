import { withExecution } from '../dist/callyflower.esm.js';


const fn = (a, b) => a + b
const onCall = function (p) { return p.callee(p.args[0], p.args[1]); }
const wrappedFn = withExecution(fn, { onCall })
const iterations = 100000000
// Test the wrapped function

// Test the execution time
console.profile("withExecution")
for (let i = 0; i < iterations; i++) {
    wrappedFn(1, i)
}
console.profileEnd("withExecution")