import { withResolver } from "../src/withResolver";
import { withSimpleResolver } from "../src/withSimpleresolver";
import { testfunction } from "./testfunction";

const withIterations = (fn: Function) => {
  return function(...args: any[]) {
    for (let i = 0; i < 1000; i++) {
      fn(...args);
    }
    return fn(...args); /*?.*/
  };
};

const testfunctionWithIterations = withIterations(testfunction);
testfunctionWithIterations(1, 200); /*?.*/

//withResolver testcase
const testWithResolver = withIterations(withResolver(testfunction));
testWithResolver(1, 200); /*?.*/

const testWithSimpleResolver = withIterations(withSimpleResolver(testfunction));
testWithSimpleResolver(1,200);  /*?.*/;

