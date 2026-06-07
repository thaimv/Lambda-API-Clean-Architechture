import type { APIGatewayProxyEvent } from 'aws-lambda';

export type ApiRequestLogInput = {
  body?: unknown;
  queryStringParameters?: APIGatewayProxyEvent['queryStringParameters'];
  pathParameters?: APIGatewayProxyEvent['pathParameters'];
};

const parseRequestBody = (body: APIGatewayProxyEvent['body']): unknown | undefined => {
  if (body === null || body === undefined || body === '') {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

/**
 * Extracts only user-provided request data for structured API logs.
 */
export const getApiRequestLogInput = (event: APIGatewayProxyEvent): ApiRequestLogInput => {
  const input: ApiRequestLogInput = {};
  const body = parseRequestBody(event.body);

  if (body !== undefined) {
    input.body = body;
  }

  if (event.queryStringParameters) {
    input.queryStringParameters = event.queryStringParameters;
  }

  if (event.pathParameters) {
    input.pathParameters = event.pathParameters;
  }

  return input;
};
