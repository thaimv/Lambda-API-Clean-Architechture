import { describe, expect, it, test } from 'vitest';

import { ObjectUtil, mapObjectName, toSnakeCase } from '@/common/utils/object.util';

describe('ObjectUtil', () => {
  it('isNil', () => {
    expect(ObjectUtil.isNil(null)).toBe(true);
    expect(ObjectUtil.isNil(undefined)).toBe(true);
    expect(ObjectUtil.isNil(0)).toBe(false);
    expect(ObjectUtil.isNil('')).toBe(false);
    expect(ObjectUtil.isNil({})).toBe(false);
    expect(ObjectUtil.isNil([])).toBe(false);
  });
});

describe('toSnakeCase', () => {
  test('should convert camelCase keys to snake_case', () => {
    const input = {
      camelCaseKey: 'value',
      anotherCamelCaseKey: 'anotherValue',
    };

    const expectedOutput = {
      camel_case_key: 'value',
      another_camel_case_key: 'anotherValue',
    };

    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });

  test('should handle empty objects', () => {
    const input = {};
    const expectedOutput = {};

    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });

  test('should handle objects with no camelCase keys', () => {
    const input = {
      snake_case_key: 'value',
      another_snake_case_key: 'anotherValue',
    };

    const expectedOutput = {
      snake_case_key: 'value',
      another_snake_case_key: 'anotherValue',
    };

    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });

  test('should handle mixed case keys', () => {
    const input = {
      camelCaseKey: 'value',
      snake_case_key: 'anotherValue',
    };

    const expectedOutput = {
      camel_case_key: 'value',
      snake_case_key: 'anotherValue',
    };

    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });
});

describe('mapObjectName', () => {
  test('should rename keys using callback', () => {
    const input = { firstName: 'John', lastName: 'Doe' };

    const result = mapObjectName(input, (key) => key.toUpperCase());

    expect(result).toEqual({
      FIRSTNAME: 'John',
      LASTNAME: 'Doe',
    });
  });
});
