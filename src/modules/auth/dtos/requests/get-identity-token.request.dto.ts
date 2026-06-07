import { z } from 'zod';

export const GetIdentityTokenRequestSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

export type GetIdentityTokenRequestDto = z.infer<typeof GetIdentityTokenRequestSchema>;
