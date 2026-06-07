import { describe, it, expect, vi } from 'vitest';

import { TIMEZONE_REGEX } from '@/common/constants/app.const';
import { extractTimezoneOffset, getCurrentTimeInTimezone } from '@/common/utils/timezone.util';

// Mock the dayjs module with fixed time
vi.mock('@/common/utils/dayjs.util', () => ({
  dayjsWithPlugins: vi.fn(() => ({
    utc: vi.fn(() => ({
      add: vi.fn((offset: number, unit: string) => ({
        format: vi.fn((format: string) => {
          // Fixed mock time: 2025-09-26T01:30:00.000Z
          const mockTime = new Date('2025-09-26T01:30:00.000Z');
          const adjustedTime = new Date(mockTime.getTime() + offset * 60000); // Add offset in minutes

          if (format === 'YYYY-MM-DD') {
            return adjustedTime.toISOString().split('T')[0];
          }
          if (format === 'HHmmss') {
            const hours = adjustedTime.getUTCHours().toString().padStart(2, '0');
            const minutes = adjustedTime.getUTCMinutes().toString().padStart(2, '0');
            const seconds = adjustedTime.getUTCSeconds().toString().padStart(2, '0');
            return `${hours}${minutes}${seconds}`;
          }
          return adjustedTime.toISOString();
        }),
      })),
    })),
  })),
}));

describe('timezone.util', () => {
  describe('extractTimezoneOffset', () => {
    it('should extract positive timezone offset correctly', () => {
      const timestamp = '2025-05-26T11:55:31.878+09:00';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(540); // 9 * 60 = 540 minutes
    });

    it('should extract negative timezone offset correctly', () => {
      const timestamp = '2025-05-26T11:55:31.878-05:00';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(-300); // -5 * 60 = -300 minutes
    });

    it('should handle UTC timezone (Z)', () => {
      const timestamp = '2025-05-26T11:55:31.878Z';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(0);
    });

    it('should handle timezone with minutes offset', () => {
      const timestamp = '2025-05-26T11:55:31.878+09:30';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(570); // 9 * 60 + 30 = 570 minutes
    });

    it('should handle negative timezone with minutes offset', () => {
      const timestamp = '2025-05-26T11:55:31.878-05:30';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(-330); // -5 * 60 - 30 = -330 minutes
    });

    it('should return 0 for timestamp without timezone', () => {
      const timestamp = '2025-05-26T11:55:31.878';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(0);
    });

    it('should return 0 for invalid timezone format', () => {
      const timestamp = '2025-05-26T11:55:31.878+9:00'; // Missing leading zero
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(0);
    });

    it('should return 0 when offset components cannot be parsed', () => {
      const timestamp = '2025-05-26T11:55:31.878+09:00';
      const matchSpy = vi.spyOn(String.prototype, 'match').mockImplementation(function (
        this: string,
        regex: RegExp,
      ) {
        if (regex === TIMEZONE_REGEX.OFFSET_COMPONENTS) {
          return null;
        }

        return RegExp.prototype.exec.call(regex, this)?.slice() as RegExpMatchArray | null;
      });

      expect(extractTimezoneOffset(timestamp)).toBe(0);
      matchSpy.mockRestore();
    });

    it('should handle edge case with +00:00', () => {
      const timestamp = '2025-05-26T11:55:31.878+00:00';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(0);
    });

    it('should handle edge case with -00:00', () => {
      const timestamp = '2025-05-26T11:55:31.878-00:00';
      const result = extractTimezoneOffset(timestamp);
      expect(result).toBe(0);
    });
  });

  describe('getCurrentTimeInTimezone', () => {
    it('should return current time in UTC timezone (offset 0)', () => {
      const result = getCurrentTimeInTimezone(0);
      expect(result.format).toBeDefined();

      // Test format methods
      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-26');
      expect(time).toBe('013000'); // 01:30:00 UTC
    });

    it('should return current time in +09:00 timezone', () => {
      const result = getCurrentTimeInTimezone(540); // +9 hours
      expect(result.format).toBeDefined();

      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-26');
      expect(time).toBe('103000'); // 10:30:00 (+9 hours from UTC)
    });

    it('should return current time in -05:00 timezone', () => {
      const result = getCurrentTimeInTimezone(-300); // -5 hours
      expect(result.format).toBeDefined();

      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-25'); // Previous day due to negative offset
      expect(time).toBe('203000'); // 20:30:00 (-5 hours from UTC)
    });

    it('should handle fractional hour timezone', () => {
      const result = getCurrentTimeInTimezone(570); // +9:30 hours
      expect(result.format).toBeDefined();

      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-26');
      expect(time).toBe('110000'); // 11:00:00 (+9:30 hours from UTC)
    });

    it('should handle large positive offset', () => {
      const result = getCurrentTimeInTimezone(720); // +12 hours
      expect(result.format).toBeDefined();

      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-26');
      expect(time).toBe('133000'); // 13:30:00 (+12 hours from UTC)
    });

    it('should handle large negative offset', () => {
      const result = getCurrentTimeInTimezone(-720); // -12 hours
      expect(result.format).toBeDefined();

      const date = result.format('YYYY-MM-DD');
      const time = result.format('HHmmss');

      expect(date).toBe('2025-09-25'); // Previous day
      expect(time).toBe('133000'); // 13:30:00 (-12 hours from UTC)
    });
  });

  describe('integration tests', () => {
    it('should work together for a complete timezone conversion', () => {
      const timestamp = '2025-05-26T11:55:31.878+09:00';
      const offset = extractTimezoneOffset(timestamp);
      const currentTime = getCurrentTimeInTimezone(offset);

      expect(offset).toBe(540);
      expect(currentTime.format).toBeDefined();

      const date = currentTime.format('YYYY-MM-DD');
      const time = currentTime.format('HHmmss');

      expect(date).toBe('2025-09-26');
      expect(time).toBe('103000'); // Current time in +09:00 timezone
    });

    it('should handle multiple timezone formats', () => {
      const testCases = [
        { timestamp: '2025-05-26T11:55:31.878+09:00', expectedOffset: 540 },
        { timestamp: '2025-05-26T11:55:31.878-05:00', expectedOffset: -300 },
        { timestamp: '2025-05-26T11:55:31.878Z', expectedOffset: 0 },
        { timestamp: '2025-05-26T11:55:31.878+00:00', expectedOffset: 0 },
        { timestamp: '2025-05-26T11:55:31.878+09:30', expectedOffset: 570 },
        { timestamp: '2025-05-26T11:55:31.878-05:30', expectedOffset: -330 },
      ];

      testCases.forEach(({ timestamp, expectedOffset }) => {
        const offset = extractTimezoneOffset(timestamp);
        expect(offset).toBe(expectedOffset);

        const currentTime = getCurrentTimeInTimezone(offset);
        expect(currentTime.format).toBeDefined();
      });
    });
  });
});
