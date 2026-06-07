import { describe, expect, it } from 'vitest';

import { createUserInfoDtoSchema } from '@/modules/users/dtos/requests/create-user-info.request.dto';

describe('createUserInfoDtoSchema', () => {
  it('accepts valid nickname', () => {
    const result = createUserInfoDtoSchema.safeParse({
      input: { userNickname: 'TestUser' },
    });

    expect(result.success).toBe(true);
  });

  it('trims nickname whitespace', () => {
    const result = createUserInfoDtoSchema.safeParse({
      input: { userNickname: '  TestUser  ' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input.userNickname).toBe('TestUser');
    }
  });

  it('rejects empty nickname', () => {
    const result = createUserInfoDtoSchema.safeParse({
      input: { userNickname: '   ' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing nickname', () => {
    const result = createUserInfoDtoSchema.safeParse({
      input: {},
    });

    expect(result.success).toBe(false);
  });
});
