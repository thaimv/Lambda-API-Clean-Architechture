import type { User } from '@/common/models/user.model';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';

export const createUserInfoStub = (): User => {
  return {
    cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
    userNickname: 'example_userNickname',
    cognitoId: 'cognito-id-123',
    createDatetime: new Date(),
    createAuthor: 'admin',
    updateDatetime: new Date(),
    updateAuthor: 'admin',
    deleteDatetime: null,
    deleteAuthor: null,
  };
};

export const createUserInfoResponseStub = (): UserInfoResponse => {
  const userInfoResponse: UserInfoResponse = {
    cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
    userNickname: 'example_userNickname',
    cognitoId: 'cognito-id-123',
  };
  return userInfoResponse;
};
export const createUserInfoRequest = (): CreateUserInfoRequest => {
  const userInfoRequest: CreateUserInfoRequest = {
    input: {
      userNickname: 'example_userNickname',
    },
  };
  return userInfoRequest;
};
