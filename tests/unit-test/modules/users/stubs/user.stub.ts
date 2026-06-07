import type { User } from '@/common/models/user.model';
import type { CreateUserInfoRequest } from '@/modules/users/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/users/dtos/responses/create-user-info.response.dto';

export const createUserInfoStub = (): User => {
  return {
    gigyaUuid: '022fca7aee5d439b9b92870b087f2825',
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
    gigyaUuid: '022fca7aee5d439b9b92870b087f2825',
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
