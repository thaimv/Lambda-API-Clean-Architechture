import { afterEach, describe, expect, test, vi } from 'vitest';

import { wait } from '@/common/utils/process.util';

describe('process.util', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('wait resolves after the specified delay', async () => {
    vi.useFakeTimers();
    const promise = wait(250);

    vi.advanceTimersByTime(250);

    await expect(promise).resolves.toBeUndefined();
  });
});
