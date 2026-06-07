import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ZodError } from 'zod';

import { APP_CONST } from '@/common/constants/app.const';
import { BadRequestError } from '@/common/errors/bad-request-error';
import { ValidationError } from '@/common/errors/validation-error';
import { AuthRestController } from '@/modules/auth/controllers/auth.rest.controller';
import { GetIdentityTokenRequestSchema } from '@/modules/auth/dtos/requests/get-identity-token.request.dto';
import type { IGetIdentityTokenUseCase } from '@/modules/auth/usecases/get-identity-token.uc';

const buildJwt = (payload: Record<string, unknown>) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `header.${encodedPayload}.signature`;
};

describe('AuthRestController', () => {
  const mockUseCase: IGetIdentityTokenUseCase = {
    execute: vi.fn(),
  };

  let controller: AuthRestController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthRestController(mockUseCase);
  });

  test('postCredential returns identity token from use case', async () => {
    const token = buildJwt({ sub: 'user-1' });
    const expected = { identityId: 'ap-northeast-1:abc', token };
    vi.mocked(mockUseCase.execute).mockResolvedValue(expected);

    const result = await controller.postCredential({
      headers: {
        Cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}`,
      },
    } as never);

    expect(mockUseCase.execute).toHaveBeenCalledWith(token);
    expect(result).toEqual(expected);
  });

  test('postCredential throws BadRequestError when token is missing', async () => {
    await expect(controller.postCredential({ headers: {} } as never)).rejects.toThrow(
      BadRequestError,
    );
    await expect(controller.postCredential({ headers: {} } as never)).rejects.toThrow(
      'Missing access token',
    );
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  test('postCredential throws BadRequestError when jwt payload is invalid', async () => {
    const token = 'not-a-jwt';

    await expect(
      controller.postCredential({
        headers: { Authorization: `Bearer ${token}` },
      } as never),
    ).rejects.toThrow(BadRequestError);
    await expect(
      controller.postCredential({
        headers: { Authorization: `Bearer ${token}` },
      } as never),
    ).rejects.toThrow('Invalid access token');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  test('postCredential propagates use case errors', async () => {
    const token = buildJwt({ sub: 'user-1' });
    vi.mocked(mockUseCase.execute).mockRejectedValue(new Error('Cognito error'));

    await expect(
      controller.postCredential({
        headers: { Cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}` },
      } as never),
    ).rejects.toThrow('Cognito error');
  });

  test('postCredential throws ValidationError when request schema validation fails', async () => {
    const token = buildJwt({ sub: 'user-1' });
    const schemaError = new ZodError([]);
    vi.spyOn(GetIdentityTokenRequestSchema, 'safeParse').mockReturnValue({
      success: false,
      error: schemaError,
    });

    await expect(
      controller.postCredential({
        headers: { Cookie: `${APP_CONST.COOKIE.ACCESS_TOKEN_NAME}=${token}` },
      } as never),
    ).rejects.toThrow(ValidationError);
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});
