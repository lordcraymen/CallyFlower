import { withResolver } from "../src/withResolver";
import { withSimpleResolver } from "../src/withSimpleresolver";
import { testfunction } from "./testfunction";

// Performance-Test ohne Warmup
const performanceTest = (
  name: string,
  fn: Function,
  iterations: number = 10000
) => {
  // Keine Warmup-Runs, direkt messen
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn(1, 200);
  }

  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`${name}:`);
  console.log(`  Total: ${totalTime.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per call`);
  console.log(`  Calls/sec: ${(1000 / avgTime).toFixed(0)}`);
  console.log("");

  return { totalTime, avgTime };
};

// Separate Prozesse für jeden Test (keine Interferenz)
const runIsolatedTests = () => {
  console.log("=== Performance Test (No Warmup) ===\n");

  // Test 1: Original function
  performanceTest("Original testfunction", testfunction);

  // Test 2: withResolver
  const resolverWrapped = withResolver(testfunction);
  performanceTest("withResolver", resolverWrapped);

  // Test 3: withSimpleResolver
  const simpleWrapped = withSimpleResolver(testfunction);
  performanceTest("withSimpleResolver", simpleWrapped);
};

// Vergleichstest mit mehreren Durchläufen
const runComparisonTest = (iterations: number = 1000) => {
  console.log(`=== Comparison Test (${iterations} iterations) ===\n`);

  const results: { [key: string]: number[] } = {
    original: [],
    resolver: [],
    simple: [],
  };

  const runs = 5;

  for (let run = 0; run < runs; run++) {
    console.log(`Run ${run + 1}/${runs}:`);

    // Fresh wrapping für jeden Run
    const resolverWrapped = withResolver(testfunction);
    const simpleWrapped = withSimpleResolver(testfunction);

    results.original.push(
      performanceTest("Original", testfunction, iterations).avgTime
    );
    results.resolver.push(
      performanceTest("Resolver", resolverWrapped, iterations).avgTime
    );
    results.simple.push(
      performanceTest("Simple", simpleWrapped, iterations).avgTime
    );
  }

  // Statistiken
  console.log("=== Statistics ===");
  Object.entries(results).forEach(([name, times]) => {
    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const variance =
      times.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) /
      times.length;
    const stdDev = Math.sqrt(variance);

    console.log(`${name}:`);
    console.log(`  Average: ${avg.toFixed(4)}ms`);
    console.log(`  Min: ${min.toFixed(4)}ms`);
    console.log(`  Max: ${max.toFixed(4)}ms`);
    console.log(`  Std Dev: ${stdDev.toFixed(4)}ms`);
    console.log("");
  });
};

// Memory usage test
const runMemoryTest = () => {
  console.log("=== Memory Test ===");

  const testMemory = (name: string, createFn: () => Function) => {
    const initial = (process as any).memoryUsage?.()?.heapUsed || 0;

    const functions: Function[] = [];
    for (let i = 0; i < 1000; i++) {
      functions.push(createFn());
    }

    const final = (process as any).memoryUsage?.()?.heapUsed || 0;
    const diff = final - initial;

    console.log(`${name}: ${(diff / 1024).toFixed(2)} KB`);

    // Cleanup
    functions.length = 0;

    return diff;
  };

  testMemory("withResolver", () => withResolver(testfunction));
  testMemory("withSimpleResolver", () => withSimpleResolver(testfunction));
};

export { performanceTest, runIsolatedTests, runComparisonTest, runMemoryTest };
