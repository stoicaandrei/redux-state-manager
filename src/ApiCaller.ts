import queryString from 'query-string';

import type { ApiResponse } from './types';

type ApiParams<Payload> = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Payload;
  token?: string;
  apiUrl: string;
};

export default async function apiCaller<Payload, Result>({
  path,
  method = 'GET',
  data,
  token,
  apiUrl,
}: ApiParams<Payload>): Promise<ApiResponse<Result>> {
  const query = '?' + queryString.stringify((data as any) || {});

  let url = `${apiUrl}${path}`;
  if (!url.endsWith('/')) url += '/';

  if (method === 'GET') url += query;

  const urlParams = path.split('/').filter((s) => s[0] === ':');

  urlParams.forEach((param) => {
    const key = param.slice(1);
    url = url.replace(param, (data as any)[key]);
    (data as any)[key] = undefined;
  });

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  if (token) {
    headers.append('Authorization', `JWT ${token}`);
  }

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
