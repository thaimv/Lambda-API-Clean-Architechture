import type { Context, LambdaRequest } from '@aws-appsync/utils';
import { util } from '@aws-appsync/utils';

export function request(ctx: Context): LambdaRequest {
  return {
    operation: 'Invoke',
    payload: {
      field: ctx.info.fieldName,
      arguments: ctx.args,
      source: ctx.source,
      parentTypeName: ctx.info.parentTypeName,
      variables: ctx.info.variables,
      selectionSetList: ctx.info.selectionSetList,
      selectionSetGraphQL: ctx.info.selectionSetGraphQL,
      identity: ctx.identity,
      request: ctx.request,
    },
  };
}

export function response(ctx: Context): unknown {
  const { result } = ctx;
  const payload = (result as { json?: Record<string, unknown> })?.json ?? result;

  const errorBody = payload as {
    result?: { code?: string };
    error?: { error_message?: string };
    data?: unknown;
  };

  if (errorBody?.error?.error_message) {
    util.error(errorBody.error.error_message, errorBody.result?.code, null, errorBody.result?.code);
  }

  return errorBody?.data ?? payload;
}
