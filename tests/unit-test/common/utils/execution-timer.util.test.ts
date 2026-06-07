import { afterEach, describe, expect, test, vi } from 'vitest';

import { ExecutionTimer } from '@/common/utils/execution-timer.util';

describe('ExecutionTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('isWithinTimeLimit reflects elapsed time', () => {
    vi.useFakeTimers();
    const timer = new ExecutionTimer(1000);

    expect(timer.isWithinTimeLimit()).toBe(true);

    vi.advanceTimersByTime(1001);

    expect(timer.isWithinTimeLimit()).toBe(false);
  });
});
