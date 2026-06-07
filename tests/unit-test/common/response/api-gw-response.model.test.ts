import { describe, it, expect } from 'vitest';

import { ApiGWResponse } from '@/common/responses/api-response';

describe('Api response of APIGateway', () => {
  it('should create an instance with correct properties', () => {
    // Arrange
    const statusCode = 200;
    const body = { test: 'test' };

    // Act
    const apiResponse = new ApiGWResponse(statusCode, body);

    expect(apiResponse.body).equal(JSON.stringify(body));
    expect(apiResponse.statusCode).equal(statusCode);
  });
});
