import { describe, expect, it } from 'vitest';

import { getApiRequestLogInput } from '@/common/utils/api-request.util';

describe('getApiRequestLogInput', () => {
  it('should extract parsed body, query, and path parameters', () => {
    const input = getApiRequestLogInput({
      body: JSON.stringify({ name: 'demo' }),
      queryStringParameters: { page: '1' },
      pathParameters: { id: '123' },
    } as any);

    expect(input).toEqual({
      body: { name: 'demo' },
      queryStringParameters: { page: '1' },
      pathParameters: { id: '123' },
    });
  });

  it('should omit empty request fields', () => {
    const input = getApiRequestLogInput({
      body: null,
      queryStringParameters: null,
      pathParameters: null,
    } as any);

    expect(input).toEqual({});
  });

  it('should keep raw body when JSON parsing fails', () => {
    const input = getApiRequestLogInput({
      body: 'not-json',
    } as any);

    expect(input).toEqual({ body: 'not-json' });
  });
});
