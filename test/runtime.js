import { runIsolatedTests, runComparisonTest, memoryTest } from "./runtime.ts";

runIsolatedTests();
runComparisonTest(5000);
memoryTest();