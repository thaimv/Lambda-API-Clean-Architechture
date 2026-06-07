import 'reflect-metadata';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { InMemoryCacheDatasource } from '@/common/datasources/cache/implements/in-memory.cache.datasource.impl';

describe.concurrent('InMemoryCacheDatasource', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('should return null for missing key', async () => {
    const cache = new InMemoryCacheDatasource();
    const result = await cache.get('missing');
    expect(result).toBeNull();
  });

  test('should set and get a value', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    const result = await cache.get('foo');
    expect(result).toBe('bar');
  });

  test('should return null and delete expired value', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const cache = new InMemoryCacheDatasource();
    await cache.set('expired', 'value', 1);

    vi.setSystemTime(new Date('2025-01-01T00:00:02.000Z'));

    expect(await cache.get('expired')).toBeNull();
    expect(await cache.get('expired')).toBeNull();
  });

  test('should delete a value', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    await cache.delete('foo');
    const result = await cache.get('foo');
    expect(result).toBeNull();
  });

  test('should clear all values', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    await cache.set('baz', 'qux');
    await cache.clear();
    expect(await cache.get('foo')).toBeNull();
    expect(await cache.get('baz')).toBeNull();
  });
});
