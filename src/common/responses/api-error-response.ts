import { HttpStatusCode } from '@/common/constants/rest-api.const';
import type { BaseError } from '@/common/errors/base-error';
import { ApiGWResponse } from '@/common/responses/api-response';
import type { ErrorResponseBody, ErrorResponseInput } from '@/common/types/response.type';

/**
 * Standardized error response for API Gateway
 * The error response format is as follows:
 * {
 *   result: {
 *     code: string;
 *     message: string;
 *   };
 *   error: {
 *     error_message: string;
 *     error_detail: T;
 *   };
 * }
 */
export class ErrorResponse<T> extends ApiGWResponse<ErrorResponseBody<T>> {
  constructor({
    code,
    message,
    detail,
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  }: ErrorResponseInput<T>) {
    super(statusCode, {
      result: {
        code,
        message,
      },
      error: {
        error_message: message,
        error_detail: detail,
      },
    });
  }

  static fromError<T>(error: BaseError) {
    return new ErrorResponse<T>({
      code: error.code,
      message: error.message,
      detail: error.details as T,
      statusCode: error.statusCode,
    });
  }
}
