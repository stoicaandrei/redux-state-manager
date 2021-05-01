export const setAuthorizationHeader = (headers: Headers, token?: string, tokenType?: 'JWT') => {
  if (!token) return;

  headers.append('Authorization', `${tokenType} ${token}`);
};

export const transferUrlParams = ({ ...data }: Record<string, any>, url: string) => {
  const urlParams = url.split('/').filter((s) => s[0] === ':');

  urlParams.forEach((param) => {
    const key = param.slice(1);
    url = url.replace(param, data[key]);
    delete data[key];
  });

  return url;
};
