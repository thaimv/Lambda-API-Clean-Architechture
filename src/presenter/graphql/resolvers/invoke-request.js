import { util } from '@aws-appsync/utils';

export function request(ctx) {
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
export function response(ctx) {
  const { result } = ctx;
  const payload = result?.json ?? result;

  if (payload?.error?.error_message) {
    util.error(payload.error.error_message, payload.result?.code, null, payload.result?.code);
  }

  return payload?.data ?? payload;
}
