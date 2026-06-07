import type { NextFunction } from '@/common/lambda/pipeline';
import { primaryLogger, logger } from '@/common/logger';
import type { ApiExecutionInput, ApiExecutionOutput } from '@/common/types/lambda.type';

/**
 * Pipe that logs the input and output of a REST API execution
 * according to the standardized API log format
 */
export class ApiLoggingPipe {
  async handle(
    passable: ApiExecutionInput,
    next: NextFunction<ApiExecutionInput, ApiExecutionOutput>,
  ): Promise<ApiExecutionOutput> {
    logger.addContext(passable.context);
    primaryLogger.addContext(passable.context);

    const res = await next(passable);
    const apiReq = passable.input;
    const apiRes = res.output.json;

    const resultMessage = apiRes.result?.message || apiRes.data?.message || 'No message';
    primaryLogger.info(resultMessage, {
      apiName: `${apiReq.httpMethod} ${apiReq.path}`,
      result: {
        status: res.error ? 'Failure' : 'Success',
        message: resultMessage,
      },
      input: passable.input,
      output: apiRes.data,
      error: res.error ? { message: res.error.message, trace: res.error.stack } : undefined,
    });

    return res;
  }
}
