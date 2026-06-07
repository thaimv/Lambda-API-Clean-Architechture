export type SuccessResponseInput<T> = {
  data: T;
  code?: string;
  message?: string;
  statusCode?: number;
};

export type SuccessResponseBody<T> = {
  result: {
    code: string;
    message: string;
  };
  data: T;
};

export type ErrorResponseInput<T> = {
  code: string;
  message: string;
  detail: T;
  statusCode: number;
};

export type ErrorResponseBody<T> = {
  result: {
    code: string;
    message: string;
  };
  error: {
    error_message: string;
    error_detail: T;
  };
};

export type ApiResponseData<T> = {
  data: T;
};
