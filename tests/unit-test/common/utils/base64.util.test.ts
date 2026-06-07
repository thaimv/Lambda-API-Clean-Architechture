import { describe, expect, test } from 'vitest';

import { getBinarySizeFromBase64 } from '@/common/utils/base64.util';

describe('getBinarySizeFromBase64', () => {
  test('should return 0 for an empty Base64 string', () => {
    expect(getBinarySizeFromBase64('')).toBe(0);
  });

  test('should return the correct size for a Base64 string without padding', () => {
    expect(getBinarySizeFromBase64('TWFu')).toBe(3);
  });

  test('should return the correct size for a Base64 string with one padding character', () => {
    expect(getBinarySizeFromBase64('TWE=')).toBe(2);
  });

  test('should return the correct size for a Base64 string with two padding characters', () => {
    expect(getBinarySizeFromBase64('TQ==')).toBe(1);
  });

  test('should return the correct size for a longer Base64 string', () => {
    const binary = 'This is a larger payload used to verify the byte size calculation.';
    const base64 = Buffer.from(binary).toString('base64');

    expect(getBinarySizeFromBase64(base64)).toBe(Buffer.byteLength(binary));
  });
});
