import { describe, expect, it } from 'vitest';

import { GetIdentityTokenRequestSchema } from '@/modules/auth/dtos/requests/get-identity-token.request.dto';

describe('GetIdentityTokenRequestSchema', () => {
  it('accepts valid idToken', () => {
    const result = GetIdentityTokenRequestSchema.safeParse({
      idToken: 'header.payload.signature',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty idToken', () => {
    const result = GetIdentityTokenRequestSchema.safeParse({
      idToken: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing idToken', () => {
    const result = GetIdentityTokenRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
