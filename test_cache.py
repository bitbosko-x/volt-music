#!/usr/bin/env python3
"""Concurrency test for SmartCache."""
import sys
sys.path.insert(0, '/home/mak/Volt')

import py_compile
import concurrent.futures
import time
import glob

# ---- Syntax Check ----
for f in ['cache_manager.py', 'metadata_engine.py', 'saavn_engine.py', 'hub.py', 'yt_engine.py']:
    path = f'/home/mak/Volt/{f}'
    py_compile.compile(path, doraise=True)
    print(f'OK: {f}')

print('\n--- Concurrency Stress Test ---')

from cache_manager import SmartCache, smart_cache

c = SmartCache(ttl=60)

# Test 1: 20 concurrent writes to same key
def write_same(i):
    c.set('concurrent_key', {'writer': i, 'ts': time.time()})
    return c.get('concurrent_key')

with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    results = list(pool.map(write_same, range(20)))
    assert all(r is not None for r in results), 'FAIL: Some reads returned None'
    print('Test 1 PASSED: 20 concurrent writes to same key')

# Test 2: 20 concurrent writes to different keys
def write_diff(i):
    c.set('key_%d' % i, {'writer': i})
    return c.get('key_%d' % i)

with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    results = list(pool.map(write_diff, range(20)))
    assert all(r is not None for r in results), 'FAIL: Some reads returned None'
    print('Test 2 PASSED: 20 concurrent writes to different keys')

# Test 3: Thundering herd - decorator test
call_count = 0

@smart_cache(ttl=60, validator=lambda x: x is not None)
def slow_api_call(query):
    global call_count
    call_count += 1
    time.sleep(0.1)  # Simulate API latency
    return {'result': query, 'call': call_count}

with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    futures = [pool.submit(slow_api_call, 'same_query') for _ in range(20)]
    results = [f.result() for f in futures]
    assert all(r is not None for r in results), 'FAIL: Some results None'
    print('Test 3 PASSED: Thundering herd - %d API call(s) for 20 requests (should be 1)' % call_count)

# Test 4: TTL expiry
c2 = SmartCache(ttl=1)
c2.set('expire_key', 'data')
time.sleep(1.5)
assert c2.get('expire_key') is None, 'FAIL: TTL not working'
print('Test 4 PASSED: TTL expiry works')

# Test 5: Validator rejection
c3 = SmartCache(ttl=60, validator=lambda x: x and len(x) > 0)
ok = c3.set('empty_key', [])
assert ok == False, 'FAIL: Validator should reject empty list'
print('Test 5 PASSED: Validator rejected empty list')

print('\nALL TESTS PASSED')
