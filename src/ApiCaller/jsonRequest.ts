import queryString from 'query-string';

import { setAuthorizationHeader, transferUrlParams } from './utils';

import type { ApiResponse } from '../types';

type ApiParams<Payload> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: Payload;
  token?: string;
  apiUrl: string;
};

export default async function jsonRequest<Payload extends Record<string, any>, Result>(
  params: ApiParams<Payload>,
): Promise<ApiResponse<Result>> {
  const { path, method, token, apiUrl } = params;
  const data = { ...params.data };

  let url = `${apiUrl}${path}`;
  if (!url.endsWith('/')) url += '/';

  url = transferUrlParams(data, url);

  if (method === 'GET') {
    const query = '?' + new URLSearchParams(data).toString();
    url += query;
  }

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  setAuthorizationHeader(headers, token);

  const response = await fetch(url, {
    headers,
    method,
    body: method !== 'GET' ? JSON.stringify(data) : undefined,
  });

  try {
    return { result: await response.json(), status: response.status };
  } catch (e) {
    return { result: e, status: response.status };
  }
}
