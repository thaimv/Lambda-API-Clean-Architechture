import { describe, expect, test, vi } from 'vitest';

import { DATE_FORMAT } from '@/common/constants/app.const';
import {
  decodeBase64,
  getRelativePath,
  isValidDateFormat,
  replaceTemplateValues,
  snakeToCamelStr,
  StringUtil,
  stripBom,
} from '@/common/utils/string.util';

describe('StringUtil', () => {
  describe('genRandomString', () => {
    test('should generate a random string of the specified length', () => {
      const length = 10;
      const randomString = StringUtil.genRandomString(length);
      expect(randomString).toHaveLength(length);
      expect(typeof randomString).toBe('string');
    });

    test('should generate different random strings on subsequent calls', () => {
      const length = 8;
      const randomString1 = StringUtil.genRandomString(length);
      const randomString2 = StringUtil.genRandomString(length);
      expect(randomString1).not.toEqual(randomString2);
    });
  });

  describe('getCognitoSubFromAuthenticationProvider', () => {
    test('should extract Cognito sub from a User Pool authentication provider string', () => {
      const cognitoAuthProvider =
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000';
      const actualSub = StringUtil.getCognitoSubFromAuthenticationProvider(cognitoAuthProvider);
      expect(actualSub).toEqual('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should extract Cognito sub when provider string contains quotes', () => {
      const cognitoAuthProvider =
        '"cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000"';
      const actualSub = StringUtil.getCognitoSubFromAuthenticationProvider(cognitoAuthProvider);
      expect(actualSub).toEqual('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should return empty string when format is invalid', () => {
      const cognitoAuthProvider = 'invalid-format';
      const actualSub = StringUtil.getCognitoSubFromAuthenticationProvider(cognitoAuthProvider);
      expect(actualSub).toEqual('');
    });

    test('should return empty string when provider is empty', () => {
      expect(StringUtil.getCognitoSubFromAuthenticationProvider('')).toEqual('');
    });

    test('should extract Cognito sub from comma-separated providers', () => {
      const cognitoSub = StringUtil.getCognitoSubFromAuthenticationProvider(
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_test,cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000',
      );

      expect(cognitoSub).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('getUsernameFromIdentityUsername', () => {
    test('should extract username from a valid identity username', () => {
      const identityUsername = 'XROA4XXXXXXYU3:CognitoIdentityCredentials';
      const expectedUsername = 'XROA4XXXXXXYU3';
      const actualUsername = StringUtil.getUsernameFromIdentityUsername(identityUsername);
      expect(actualUsername).toEqual(expectedUsername);
    });

    test('should return an empty string if identity username is null', () => {
      const identityUsername = null;
      const expectedUsername = '';
      const actualUsername = StringUtil.getUsernameFromIdentityUsername(identityUsername as any);
      expect(actualUsername).toEqual(expectedUsername);
    });

    test('should return an empty string if identity username is undefined', () => {
      const identityUsername = undefined;
      const expectedUsername = '';
      const actualUsername = StringUtil.getUsernameFromIdentityUsername(identityUsername as any);
      expect(actualUsername).toEqual(expectedUsername);
    });

    test('should return an empty string if identity username is an empty string', () => {
      const identityUsername = '';
      const expectedUsername = '';
      const actualUsername = StringUtil.getUsernameFromIdentityUsername(identityUsername);
      expect(actualUsername).toEqual(expectedUsername);
    });

    test('should handle identity username without a colon', () => {
      const identityUsername = 'XROA4XXXXXXYU3';
      const expectedUsername = 'XROA4XXXXXXYU3';
      const actualUsername = StringUtil.getUsernameFromIdentityUsername(identityUsername);
      expect(actualUsername).toEqual(expectedUsername);
    });
  });

  describe('getUserIdFromAuthenticationProvider', () => {
    test('should extract Cognito sub from User Pool provider', () => {
      const userId = StringUtil.getUserIdFromAuthenticationProvider(
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000',
      );

      expect(userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should extract gigya user id from provider string', () => {
      const userId = StringUtil.getUserIdFromAuthenticationProvider(
        '"gigya.yta","gigya.yta:eu-west-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd:97b2c826a87a45d89795259c5d9cba45"',
      );

      expect(userId).toBe('97b2c826a87a45d89795259c5d9cba45');
    });

    test('should skip empty and invalid segments before gigya id', () => {
      const userId = StringUtil.getUserIdFromAuthenticationProvider(
        'broken:CognitoSignIn:,"","gigya.yta:eu-west-1:pool-id:abc123def456"',
      );

      expect(userId).toBe('abc123def456');
    });

    test('should return empty string when no valid user id is found', () => {
      expect(StringUtil.getUserIdFromAuthenticationProvider('gigya-provider')).toBe('');
      expect(StringUtil.getUserIdFromAuthenticationProvider('"gigya.yta"')).toBe('');
    });
  });

  describe('getRelativePath', () => {
    test('should return relative path - not startWith /', () => {
      const path = 'https://abc.com/images/logo.png';
      const relativePath = getRelativePath(path);

      expect(relativePath).toEqual('images/logo.png');
    });

    test('should return relative path - startWith /', () => {
      const path = '/images/logo.png';
      const relativePath = getRelativePath(path);

      expect(relativePath).toEqual('images/logo.png');
    });

    test('should return relative path when given an invalid URL', () => {
      const invalidPath = '';
      const result = getRelativePath(invalidPath);
      expect(result).toBe(invalidPath);
    });
  });
});

describe('getRelativePath', () => {
  test('should return the relative path portion of a URL', () => {
    const url = 'https://abc.com/images/logo.png';
    const expectedRelativePath = 'images/logo.png';
    const actualRelativePath = getRelativePath(url);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });

  test('should return the relative path portion of an absolute path', () => {
    const path = '/images/logo.png';
    const expectedRelativePath = 'images/logo.png';
    const actualRelativePath = getRelativePath(path);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });

  test('should return the relative path as is if test is already relative', () => {
    const path = 'images/logo.png';
    const expectedRelativePath = 'images/logo.png';
    const actualRelativePath = getRelativePath(path);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });

  test('should return pathname without stripping when parsed url pathname has no leading slash', () => {
    const originalURL = global.URL;
    global.URL = class MockURL {
      pathname: string;

      constructor(_path: string) {
        this.pathname = 'images/logo.png';
      }
    } as unknown as typeof URL;

    expect(getRelativePath('https://example.com/images/logo.png')).toBe('images/logo.png');

    global.URL = originalURL;
  });

  test('should handle URLs without a path', () => {
    const url = 'https://abc.com';
    const expectedRelativePath = '';
    const actualRelativePath = getRelativePath(url);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });

  test('should handle invalid URLs', () => {
    const invalidUrl = ':/abc.com';
    const expectedRelativePath = ':/abc.com';
    const actualRelativePath = getRelativePath(invalidUrl);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });

  test('should handle empty string input', () => {
    const path = '';
    const expectedRelativePath = '';
    const actualRelativePath = getRelativePath(path);
    expect(actualRelativePath).toEqual(expectedRelativePath);
  });
});

describe('decodeBase64', () => {
  test('should decode a base64 encoded string to a Buffer', () => {
    const base64String = 'SGVsbG8gV29ybGQ=';
    const expectedBuffer = Buffer.from('Hello World');
    const actualBuffer = decodeBase64(base64String);
    expect(actualBuffer).toEqual(expectedBuffer);
  });

  test('should handle empty string input', () => {
    const base64String = '';
    const expectedBuffer = Buffer.from('');
    const actualBuffer = decodeBase64(base64String);
    expect(actualBuffer).toEqual(expectedBuffer);
  });
});

describe('isValidDateFormat', () => {
  test('should return true for a valid date string with default format', () => {
    const dateString = '2023-10-27';
    const isValid = isValidDateFormat(dateString);
    expect(isValid).toBe(true);
  });

  test('should return true for a valid date string with custom format', () => {
    const dateString = '20230203';
    const dateFormat = DATE_FORMAT.YYYYMMDD;
    const isValid = isValidDateFormat(dateString, dateFormat);
    expect(isValid).toBe(true);
  });

  test('should return false for an invalid date string with default format', () => {
    const dateString = '2024_02_03';
    const isValid = isValidDateFormat(dateString);
    expect(isValid).toBe(false);
  });

  test('should return false for an invalid date string with custom format', () => {
    const dateString = '32/10/2023';
    const dateFormat = DATE_FORMAT.YYYYMMDD;
    const isValid = isValidDateFormat(dateString, dateFormat);
    expect(isValid).toBe(false);
  });

  test('should return false for a date string with incorrect format', () => {
    const dateString = '2023';
    const isValid = isValidDateFormat(dateString);
    expect(isValid).toBe(false);
  });

  test('should return false for an empty string input', () => {
    const dateString = '';
    const isValid = isValidDateFormat(dateString);
    expect(isValid).toBe(false);
  });

  test('should return false for null input', () => {
    const dateString = null;
    const isValid = isValidDateFormat(dateString as any);
    expect(isValid).toBe(false);
  });
});

describe('replaceTemplateValues', () => {
  test('should replace placeholders with corresponding values', () => {
    const templateForm = {
      COGNITO_ID: '{cognitoId}',
      RESOURCE_ID: '{resourceId}',
    };
    const templateValues = {
      COGNITO_ID: 'user123',
      RESOURCE_ID: 'resource456',
    };
    const templateString = 'resource_image/{cognitoId}/{resourceId}.webp';
    const expectedString = 'resource_image/user123/resource456.webp';
    const actualString = replaceTemplateValues(templateForm, templateValues, templateString);
    expect(actualString).toEqual(expectedString);
  });

  test('should leave placeholders unchanged if values are not provided', () => {
    const templateForm = {
      COGNITO_ID: '{cognitoId}',
      RESOURCE_ID: '{resourceId}',
    };
    const templateValues = {
      COGNITO_ID: 'user123',
    };
    const templateString = 'resource_image/{cognitoId}/{resourceId}.webp';
    const expectedString = 'resource_image/user123/{resourceId}.webp';
    const actualString = replaceTemplateValues(templateForm, templateValues, templateString);
    expect(actualString).toEqual(expectedString);
  });

  test('should handle empty template values', () => {
    const templateForm = {
      COGNITO_ID: '{cognitoId}',
      RESOURCE_ID: '{resourceId}',
    };
    const templateValues = {};
    const templateString = 'resource_image/{cognitoId}/{resourceId}.webp';
    const expectedString = 'resource_image/{cognitoId}/{resourceId}.webp';
    const actualString = replaceTemplateValues(templateForm, templateValues, templateString);
    expect(actualString).toEqual(expectedString);
  });

  test('should handle empty template string', () => {
    const templateForm = {
      COGNITO_ID: '{cognitoId}',
      RESOURCE_ID: '{resourceId}',
    };
    const templateValues = {
      COGNITO_ID: 'user123',
      RESOURCE_ID: 'resource456',
    };
    const templateString = '';
    const expectedString = '';
    const actualString = replaceTemplateValues(templateForm, templateValues, templateString);
    expect(actualString).toEqual(expectedString);
  });

  test('should replace multiple occurrences of the same placeholder', () => {
    const templateForm = {
      COGNITO_ID: '{cognitoId}',
    };
    const templateValues = {
      COGNITO_ID: 'user123',
    };
    const templateString = '{cognitoId}/{cognitoId}/{cognitoId}';
    const expectedString = 'user123/user123/user123';
    const actualString = replaceTemplateValues(templateForm, templateValues, templateString);
    expect(actualString).toEqual(expectedString);
  });
});

describe('stripBom', () => {
  test('should remove a UTF-8 BOM from the start of the string', () => {
    expect(stripBom('\uFEFF{"data":"value"}')).toBe('{"data":"value"}');
  });

  test('should leave strings without a UTF-8 BOM unchanged', () => {
    expect(stripBom('{"data":"value"}')).toBe('{"data":"value"}');
  });
});

describe('snakeToCamelStr', () => {
  test('should convert snake_case to camelCase', () => {
    expect(snakeToCamelStr('user_id')).toBe('userId');
    expect(snakeToCamelStr('order_item_2')).toBe('orderItem2');
  });
});
