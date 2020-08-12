import queryString from 'query-string';
import { select } from 'redux-saga/effects';

type apiParams<Payload> = {
  path: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Payload;
  token?: string;
  session_id?: string;
  apiUrl: string;
};

export default async function apiCaller<Payload>({
  path,
  method = 'GET',
  data,
  token,
  session_id,
  endpoint,
  apiUrl,
}: apiParams<Payload>): Promise<any> {
  // session_id is required for the session specific requests
  if (session_id) data = { ...data, session_id: session_id } as any;

  const query = '?' + queryString.stringify((data as any) || {});

  let url = `${apiUrl}/${endpoint}${path}`;
  if (!url.endsWith('/')) url += '/';

  if (method === 'GET') url += query;

  const urlParams = path.split('/').filter(s => s[0] === ':');

  urlParams.forEach(param => {
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
