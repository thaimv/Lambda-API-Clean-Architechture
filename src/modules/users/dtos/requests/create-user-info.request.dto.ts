import { z } from 'zod';

export const createUserInfoDtoSchema = z.object({
  input: z.object({
    userNickname: z.string().trim().min(1),
  }),
});

export type CreateUserInfoRequest = z.infer<typeof createUserInfoDtoSchema>;
