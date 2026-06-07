import { RESULT_CODE, STATUS_CODE } from '@/common/constants/response.const';
import { BaseError } from '@/common/errors/base-error';

export class ExistedError extends BaseError {
  constructor(message: string) {
    super(message, RESULT_CODE.EXISTED, STATUS_CODE.BAD_REQUEST);
  }
}
