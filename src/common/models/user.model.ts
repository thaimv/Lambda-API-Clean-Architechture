export type User = {
  gigyaUuid: string;
  userNickname: string;
  cognitoId: string | null;
  createDatetime: Date;
  createAuthor: string;
  updateDatetime: Date;
  updateAuthor: string;
  deleteDatetime: Date | null;
  deleteAuthor: string | null;
};
