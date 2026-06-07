import { afterEach, describe, expect, it, vi } from 'vitest';

import { SENSITIVE_FIELDS } from '@/common/constants/app.const';
import { CryptoUtil } from '@/common/utils/crypto.util';
import { hashValue, jsonReplacerFn, maskValue } from '@/common/utils/sensitive-data.util';

// eslint-disable-next-line max-lines-per-function
describe('sensitive-data.util', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('maskValue', () => {
    it('should return asterisks with same length as input string', () => {
      expect(maskValue('JohnDoe')).toBe('*******');
    });

    it('should mask number values converted to string', () => {
      expect(maskValue(12345)).toBe('*****');
    });

    it('should return null for null input', () => {
      expect(maskValue(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(maskValue(undefined)).toBeUndefined();
    });

    it('should return empty string for empty string input', () => {
      expect(maskValue('')).toBe('');
    });
  });

  describe('hashValue', () => {
    it('should hash a valid ID using SHA-256', () => {
      const id = 'test-resource-id';
      const result = hashValue(id);

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]+$/);
      expect(result).toBe(CryptoUtil.hashString(id, ''));
    });

    it('should return null for null input', () => {
      expect(hashValue(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(hashValue(undefined)).toBeUndefined();
    });

    it('should return empty string for empty string input', () => {
      expect(hashValue('')).toBe('');
    });

    it('should hash zero value (0 is not skipped)', () => {
      const result = hashValue(0);
      expect(result).toBe(CryptoUtil.hashString('0', ''));
      expect(result).toHaveLength(64);
    });

    it('should hash false value (false is not skipped)', () => {
      expect(hashValue(false)).toBe(CryptoUtil.hashString('false', ''));
    });

    it('should hash number values converted to string', () => {
      expect(hashValue(12345)).toBe(CryptoUtil.hashString('12345', ''));
    });
  });

  describe('jsonReplacerFn', () => {
    it('should hash fields in SENSITIVE_FIELDS.hash (snake_case)', () => {
      const result = jsonReplacerFn('cognito_sub', 'test-value-123');

      expect(result).toHaveLength(64);
      expect(result).not.toBe('test-value-123');
    });

    it('should hash camelCase fields by converting them to snake_case', () => {
      const value = 'test-value-123';
      const camelResult = jsonReplacerFn('cognitoSub', value);
      const snakeResult = jsonReplacerFn('cognito_sub', value);

      expect(camelResult).toBe(snakeResult);
      expect(camelResult).toHaveLength(64);
      expect(camelResult).not.toBe(value);
    });

    it('should mask fields in SENSITIVE_FIELDS.mask', () => {
      SENSITIVE_FIELDS.mask.forEach((field) => {
        const value = 'SensitiveNickname';
        expect(jsonReplacerFn(field, value)).toBe('*'.repeat(value.length));
      });
    });

    it('should return unchanged value for non-sensitive fields', () => {
      expect(jsonReplacerFn('normalField', 'normalValue')).toBe('normalValue');
    });

    it('should preserve null values for sensitive fields', () => {
      expect(jsonReplacerFn('cognito_sub', null)).toBeNull();
    });

    it('should preserve undefined values for sensitive fields', () => {
      expect(jsonReplacerFn('cognito_sub', undefined)).toBeUndefined();
    });

    it('should hash all defined sensitive hash fields', () => {
      const testValue = 'test-sensitive-value';

      SENSITIVE_FIELDS.hash.forEach((field) => {
        const result = jsonReplacerFn(field, testValue);
        expect(result).toBe(CryptoUtil.hashString(testValue, ''));
        expect(result).toHaveLength(64);
      });
    });

    it('should preserve objects and arrays unchanged (JSON.stringify handles recursion)', () => {
      const nestedObj = { inner: 'data' };
      expect(jsonReplacerFn('someObject', nestedObj)).toEqual(nestedObj);
    });

    it('should handle numeric keys (as strings)', () => {
      expect(jsonReplacerFn('0', 'value')).toBe('value');
    });

    it('should parse JSON body in SQS message objects', () => {
      const sqsMessage = {
        messageId: 'msg-1',
        receiptHandle: 'handle-1',
        body: JSON.stringify({ userId: '123' }),
      };

      const result = jsonReplacerFn('messages', sqsMessage) as typeof sqsMessage & {
        body: { userId: string };
      };

      expect(result.body).toEqual({ userId: '123' });
    });

    it('should keep SQS message body unchanged when body is not JSON', () => {
      const sqsMessage = {
        messageId: 'msg-1',
        receiptHandle: 'handle-1',
        body: 'plain-text-body',
      };

      expect(jsonReplacerFn('messages', sqsMessage)).toEqual(sqsMessage);
    });

    it('should hash Cognito subs embedded in containing-sensitive field values', () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const value = `/files/${cognitoSub}/report.csv`;
      const result = jsonReplacerFn('file_path', value) as string;

      expect(result).not.toContain(cognitoSub);
      expect(result).toMatch(/^\/files\/[a-f0-9]{64}\/report\.csv$/);
    });

    it('should keep original Cognito sub when hash result is not a string', () => {
      const cognitoSub = '550e8400-e29b-41d4-a716-446655440000';
      const value = `/files/${cognitoSub}/report.csv`;
      vi.spyOn(CryptoUtil, 'hashString').mockReturnValue(null as unknown as string);

      expect(jsonReplacerFn('file_path', value)).toBe(value);
    });

    it('should skip snake_case conversion for non-string keys', () => {
      const symbolKey = Symbol('field');
      expect(jsonReplacerFn(symbolKey as unknown as string, 'plain-value')).toBe('plain-value');
    });

    it('should mask fields configured in SENSITIVE_FIELDS.mask', () => {
      SENSITIVE_FIELDS.mask.push('user_nickname');

      try {
        expect(jsonReplacerFn('user_nickname', 'SecretName')).toBe('**********');
        expect(jsonReplacerFn('userNickname', 'SecretName')).toBe('**********');
      } finally {
        SENSITIVE_FIELDS.mask.pop();
      }
    });
  });

  describe('jsonReplacerFn integration with JSON.stringify', () => {
    it('should sanitize sensitive fields when used with JSON.stringify', () => {
      const data = {
        cognito_sub: 'user-123',
        vin_code: 'VIN456',
        normalField: 'unchanged',
        nested: {
          ccu_id: 'ccu-789',
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      expect(result.cognito_sub).toHaveLength(64);
      expect(result.vin_code).toBe('VIN456');
      expect(result.nested.ccu_id).toBe('ccu-789');
      expect(result.normalField).toBe('unchanged');
    });

    it('should sanitize camelCase sensitive fields by converting to snake_case', () => {
      const data = {
        cognitoSub: 'user-123',
        vinCode: 'VIN456',
        normalField: 'unchanged',
        nested: {
          ccuId: 'ccu-789',
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      expect(result.cognitoSub).toHaveLength(64);
      expect(result.vinCode).toBe('VIN456');
      expect(result.nested.ccuId).toBe('ccu-789');
      expect(result.normalField).toBe('unchanged');
    });

    it('should sanitize arrays of objects', () => {
      const data = [{ du_serial: 'serial-1' }, { du_serial: 'serial-2' }];
      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));

      expect(result[0].du_serial).toBe('serial-1');
      expect(result[1].du_serial).toBe('serial-2');
    });

    it('should handle deeply nested sensitive fields', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              cognito_sub: 'deep-uuid',
            },
          },
        },
      };

      const result = JSON.parse(JSON.stringify(data, jsonReplacerFn));
      expect(result.level1.level2.level3.cognito_sub).toHaveLength(64);
    });
  });
});
