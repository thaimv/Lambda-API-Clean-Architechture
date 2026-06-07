import { describe, expect, test } from 'vitest';

import { APP_CONST } from '@/common/constants/app.const';
import { getAccessTokenFromRequest } from '@/common/utils/access-token.util';

describe('getAccessTokenFromRequest', () => {
  test('reads token from cookie header', () => {
    const token = 'jwt-header.jwt-payload.jwt-sign';

    const result = getAccessTokenFromRequest({
      headers: {
        Cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}`,
      },
    });

    expect(result).toBe(token);
  });

  test('reads token from Authorization bearer header when cookie is absent', () => {
    const token = 'bearer-token';

    const result = getAccessTokenFromRequest({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(result).toBe(token);
  });

  test('prefers cookie over Authorization header', () => {
    const cookieToken = 'from-cookie';
    const bearerToken = 'from-bearer';

    const result = getAccessTokenFromRequest({
      headers: {
        Cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${cookieToken}`,
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(result).toBe(cookieToken);
  });

  test('returns empty string when no token is present', () => {
    expect(getAccessTokenFromRequest({ headers: {} })).toBe('');
  });

  test('returns empty string when headers are null', () => {
    expect(getAccessTokenFromRequest({ headers: null, multiValueHeaders: null })).toBe('');
  });

  test('reads token from case-insensitive header names', () => {
    const token = 'case-insensitive-token';

    const result = getAccessTokenFromRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(result).toBe(token);
  });

  test('reads token from multiValueHeaders when headers are absent', () => {
    const token = 'multi-value-token';

    const result = getAccessTokenFromRequest({
      multiValueHeaders: {
        Authorization: [`Bearer ${token}`],
      },
    });

    expect(result).toBe(token);
  });

  test('reads token from case-insensitive multiValueHeaders key', () => {
    const token = 'multi-value-case-token';

    const result = getAccessTokenFromRequest({
      multiValueHeaders: {
        authorization: [`Bearer ${token}`],
      },
    });

    expect(result).toBe(token);
  });

  test('reads cookie token from lowercase cookie header via case-insensitive match', () => {
    const token = 'cookie-case-token';

    const result = getAccessTokenFromRequest({
      headers: {
        cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}`,
      },
    });

    expect(result).toBe(token);
  });

  test('reads token when headers use a different key casing than requested names', () => {
    const token = 'mixed-case-header-token';

    const result = getAccessTokenFromRequest({
      headers: {
        COOKIE: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}`,
      },
    });

    expect(result).toBe(token);
  });

  test('reads token from multiValueHeaders when direct key casing differs', () => {
    const token = 'multi-mixed-case-token';

    const result = getAccessTokenFromRequest({
      headers: {},
      multiValueHeaders: {
        AUTHORIZATION: [`Bearer ${token}`],
      },
    });

    expect(result).toBe(token);
  });
});
