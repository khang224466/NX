import { runBrowserTestSuite } from '../src/services/realtimeBrowserTestSuite.js';

console.log('--- TESTING REALTIME BROWSER TEST SUITE ---');
const res = runBrowserTestSuite(1);
console.log(`Summary: ${res.passCount}/${res.totalTests} PASS (${res.passRate}%) in ${res.totalDurationMs}ms`);

if (res.failCount > 0) {
  console.error('Failed tests:');
  res.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.error(`- ${t.id} (${t.title}): Expected ${t.expected}, got ${t.actual}`);
  });
  process.exit(1);
} else {
  console.log('🎉 ALL ASSERTIONS IN BROWSER TEST SUITE PASSED 100%!');
}
