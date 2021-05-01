import type { ApiResponse } from '../types';

import { setAuthorizationHeader, transferUrlParams } from './utils';

type ApiParams<Payload> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: Payload;
  token?: string;
  apiUrl: string;
};

export default async function formRequest<Payload extends Record<string, any>, Result>(
  params: ApiParams<Payload>,
): Promise<ApiResponse<Result>> {
  const { path, method, token, apiUrl } = params;
  const data = { ...params.data };

  let url = `${apiUrl}${path}`;
  if (!url.endsWith('/')) url += '/';

  url = transferUrlParams(data, url);

  const headers = new Headers();
  setAuthorizationHeader(headers, token);

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  const response = await fetch(url, {
    headers,
    method,
    body: formData,
  });

  try {
    return { result: await response.json(), status: response.status };
  } catch (e) {
    return { result: e, status: response.status };
  }
}
