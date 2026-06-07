import { describe, expect, test } from 'vitest';

import { RESULT_CODE } from '@/common/constants/response.const';
import { HttpStatusCode } from '@/common/constants/rest-api.const';
import { SuccessResponse } from '@/common/responses/api-success-response';

describe('SuccessResponse', () => {
  test('builds standardized success body', () => {
    const response = new SuccessResponse({
      data: { id: '123' },
      code: RESULT_CODE.SUCCESS,
      message: 'Created',
      statusCode: HttpStatusCode.CREATED,
    });

    expect(response.statusCode).toBe(HttpStatusCode.CREATED);
    expect(response.json).toEqual({
      result: {
        code: RESULT_CODE.SUCCESS,
        message: 'Created',
      },
      data: { id: '123' },
    });
  });

  test('create factory uses default success code', () => {
    const response = SuccessResponse.create({ ok: true });

    expect(response.json.result.code).toBe(RESULT_CODE.SUCCESS);
    expect(response.json.data).toEqual({ ok: true });
  });
});
