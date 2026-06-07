import { RESULT_CODE } from '@/common/constants/response.const';
import { HttpStatusCode } from '@/common/constants/rest-api.const';
import { ApiGWResponse } from '@/common/responses/api-response';
import type { SuccessResponseInput, SuccessResponseBody } from '@/common/types/response.type';

/**
 * Standardized success response for API Gateway
 * The response format is as follows:
 * {
 *   result: {
 *     code: string;
 *     message: string;
 *   };
 *   data: T;
 * }
 */
export class SuccessResponse<T> extends ApiGWResponse<SuccessResponseBody<T>> {
  constructor({
    data,
    code = RESULT_CODE.SUCCESS,
    message = 'Success',
    statusCode = HttpStatusCode.OK,
  }: SuccessResponseInput<T>) {
    super(statusCode, {
      result: {
        code,
        message,
      },
      data,
    });
  }

  static create<T>(data: T) {
    return new SuccessResponse<T>({ data, code: RESULT_CODE.SUCCESS });
  }
}
