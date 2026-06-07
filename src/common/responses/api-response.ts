import type { APIGatewayProxyResult } from 'aws-lambda';

import type { HttpStatusCode } from '@/common/constants/rest-api.const';

/**
 * Format the response for the API Gateway with Lambda Proxy Integration
 */
export class ApiGWResponse<T> implements APIGatewayProxyResult {
  statusCode: HttpStatusCode;
  headers: { [header: string]: boolean | number | string };
  body: string;

  constructor(
    statusCode: number,
    public json: T,
  ) {
    this.statusCode = statusCode;
    this.headers = {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
    };
    this.body = JSON.stringify(json);
  }
}
