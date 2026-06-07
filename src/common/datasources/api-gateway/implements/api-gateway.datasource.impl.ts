import { injectable } from 'inversify';

import { API_GATEWAY_RESPONSE_FORMAT } from '@/common/constants/format.const';
import type { IApiGatewayDatasource } from '@/common/datasources/api-gateway/api-gateway.datasource';
import { BadRequestError } from '@/common/errors/bad-request-error';
import { logger } from '@/common/logger';
import type {
  ApiGatewayDatasourceResponseOptions,
  ApiGatewayRequestOptions,
} from '@/common/types/datasources/api-gateway.type';

@injectable()
export class ApiGatewayDatasource implements IApiGatewayDatasource {
  async invoke<T>(
    url: string,
    method: string,
    reqOpts?: ApiGatewayRequestOptions,
    resOpts?: ApiGatewayDatasourceResponseOptions,
  ): Promise<T> {
    const body =
      typeof reqOpts?.body === 'string'
        ? reqOpts.body
        : reqOpts?.body
          ? JSON.stringify(reqOpts.body)
          : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(reqOpts?.headers || {}),
      },
      body,
    });

    const resRaw = await response.text();

    const isJsonFormat = !resOpts || resOpts.format === API_GATEWAY_RESPONSE_FORMAT.JSON;

    if (!response.ok) {
      logger.error(`call-api-gateway-failed`, {
        method: method,
        url: url,
        status: response.status,
        response: isJsonFormat ? JSON.parse(resRaw) : resRaw,
      });
      throw new BadRequestError(`call-api-gateway-failed: ${response.status}`, resRaw);
    }

    logger.info(`call-api-gateway-success`, {
      method: method,
      url: url,
      status: response.status,
      response: isJsonFormat ? JSON.parse(resRaw) : resRaw,
    });

    if (isJsonFormat) {
      return JSON.parse(resRaw) as T;
    }

    return resRaw as T;
  }
}

/** @deprecated Use ApiGatewayDatasource */
export const ApiGateway = ApiGatewayDatasource;
