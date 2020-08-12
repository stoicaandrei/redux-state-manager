type options = {
  id?: boolean;
};

export function createSocketConnectAction(
  uri: string,
  socketDesc: string,
  options: options = {}
) {
  return (token: string, sessionId?: string) => ({
    type: 'SOCKET_CONNECT',
    meta: 'SOCKET_COMMAND',
    token,
    uri: options.id ? `${uri}/${sessionId}/` : uri,
    socketDesc,
  });
}

export function createSocketDisconnectAction(
  uri: string,
  socketDesc: string,
  options: options = {}
) {
  return (token: string, sessionId?: string) => ({
    type: 'SOCKET_DISCONNECT',
    meta: 'SOCKET_COMMAND',
    token,
    uri: options.id ? `${uri}/${sessionId}/` : uri,
    socketDesc,
  });
}
