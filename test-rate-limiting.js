#!/usr/bin/env node

// Minimal test to verify rate limiting implementation
const assert = require('assert');

// Inline rate limiter for testing
class RateLimiter {
  constructor() {
    this.records = new Map();
    this.maxMessages = 5;
    this.windowMs = 10000;
  }

  check(walletAddress) {
    const now = Date.now();
    const record = this.records.get(walletAddress) || { timestamps: [] };

    record.timestamps = record.timestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    if (record.timestamps.length >= this.maxMessages) {
      const oldestTimestamp = record.timestamps[0];
      const remainingMs = this.windowMs - (now - oldestTimestamp);
      return { allowed: false, remainingMs };
    }

    record.timestamps.push(now);
    this.records.set(walletAddress, record);
    return { allowed: true };
  }
}

// Run tests
console.log('🧪 Testing Rate Limiter Implementation...\n');

const limiter = new RateLimiter();
const testWallet = 'GABC123TEST';
let passed = 0;
let failed = 0;

// Test 1-5: Should allow first 5 messages
for (let i = 1; i <= 5; i++) {
  const result = limiter.check(testWallet);
  if (result.allowed) {
    console.log(`✅ Test ${i}: Message ${i} allowed`);
    passed++;
  } else {
    console.log(`❌ Test ${i}: Message ${i} should be allowed but was blocked`);
    failed++;
  }
}

// Test 6: Should block 6th message
const result6 = limiter.check(testWallet);
if (!result6.allowed && result6.remainingMs > 0) {
  console.log(`✅ Test 6: Message 6 blocked (wait ${Math.ceil(result6.remainingMs / 1000)}s)`);
  passed++;
} else {
  console.log(`❌ Test 6: Message 6 should be blocked`);
  failed++;
}

// Test 7: Different wallet should work
const result7 = limiter.check('GXYZ789TEST');
if (result7.allowed) {
  console.log(`✅ Test 7: Different wallet allowed`);
  passed++;
} else {
  console.log(`❌ Test 7: Different wallet should be allowed`);
  failed++;
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All rate limiting tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!\n');
  process.exit(1);
}
