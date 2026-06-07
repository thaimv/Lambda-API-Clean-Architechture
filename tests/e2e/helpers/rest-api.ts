import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import axios from 'axios';

import type { AwsCredentials } from '~/e2e/helpers/cognito-auth';

export type RestApiConfig = {
  baseUrl: string;
  /** AWS credentials for SigV4 signing (service: execute-api). Omit for non-IAM endpoints. */
  credentials?: AwsCredentials;
  /** Additional auth headers (e.g. x-api-key, Cookie). Omit for unauthenticated. */
  authHeaders?: Record<string, string>;
};

export type RestResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export interface IRestApi {
  get<T = unknown>(path: string): Promise<RestResponse<T>>;
  post<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  put<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  patch<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  delete<T = unknown>(path: string): Promise<RestResponse<T>>;
}

/** Combine staged base URL with a relative path (preserves `/dev` stage prefix). */
export function resolveRequestUrl(baseUrl: string, path: string): URL {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(relativePath, base);
}

export class RestApi implements IRestApi {
  private readonly signer?: SignatureV4;

  constructor(private readonly config: RestApiConfig) {
    if (config.credentials) {
      this.signer = new SignatureV4({
        credentials: config.credentials,
        region: process.env.AWS_REGION ?? 'eu-west-2',
        service: 'execute-api',
        sha256: Sha256,
      });
    }
  }

  private async sendRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<RestResponse<T>> {
    const url = resolveRequestUrl(this.config.baseUrl, path);
    const rawBody = body === undefined ? undefined : JSON.stringify(body);

    const baseHeaders: Record<string, string> = {
      ...this.config.authHeaders,
    };
    if (rawBody !== undefined) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    let headers = baseHeaders;

    if (this.signer) {
      const httpRequest = new HttpRequest({
        method,
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { ...baseHeaders, host: url.hostname },
        body: rawBody,
      });
      const signed = await this.signer.sign(httpRequest);
      headers = signed.headers as Record<string, string>;
    }

    const response = await axios.request<T>({
      method,
      url: url.toString(),
      data: body,
      headers,
      validateStatus: () => true,
    });

    return { statusCode: response.status, body: response.data };
  }

  get<T = unknown>(path: string): Promise<RestResponse<T>> {
    return this.sendRequest<T>('GET', path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    return this.sendRequest<T>('POST', path, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    return this.sendRequest<T>('PUT', path, body);
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    return this.sendRequest<T>('PATCH', path, body);
  }

  delete<T = unknown>(path: string): Promise<RestResponse<T>> {
    return this.sendRequest<T>('DELETE', path);
  }
}
