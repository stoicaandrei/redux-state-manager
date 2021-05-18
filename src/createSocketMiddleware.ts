import {
  SOCKET_CONNECT,
  SOCKET_CONNECTED,
  SOCKET_DISCONNECT,
  SOCKET_COMMAND,
  SOCKET_RECEIVE,
  SOCKET_CLOSED,
  SOCKET_RECONNECT,
  SOCKET_RECONNECTED,
} from './constants';

import { SocketAction } from './types';
import SocketListener from './SocketListener';

export default function createSocketMiddleware<State>(socketListener: SocketListener<State>) {
  return (store: any) => (next: any) => (action: SocketAction) => {
    if (!(action.meta === SOCKET_COMMAND)) {
      return next(action);
    }

    const res = next(action);

    switch (action.type) {
      case SOCKET_CONNECT:
        socketListener.onOpen((socketDesc: string) => {
          store.dispatch({
            type: SOCKET_CONNECTED,
            meta: SOCKET_COMMAND,
            socketDesc,
          });
        });
        socketListener.onClose((socketDesc: string, wasClean: boolean) => {
          store.dispatch({
            type: SOCKET_CLOSED,
            meta: SOCKET_COMMAND,
            socketDesc,
            wasClean,
          });
        });
        socketListener.onMessage((socketDesc: string, message: string) => {
          store.dispatch({
            type: SOCKET_RECEIVE,
            payload: message,
            meta: SOCKET_COMMAND,
            socketDesc,
          });
        });
        socketListener.onReconnect((socketDesc: string) => {
          store.dispatch({
            type: SOCKET_RECONNECT,
            meta: SOCKET_COMMAND,
            socketDesc,
          });
        });
        socketListener.connectToSocket(action.socketDesc, action.token, action.uri);
        break;
      case SOCKET_DISCONNECT:
        socketListener.disconnectFromSocket(action.socketDesc);
        break;
      case SOCKET_RECEIVE:
        const event = action.payload.type;
        if (socketListener.socketEvents.hasOwnProperty(event)) {
          store.dispatch(socketListener.socketEvents[event](action.payload.data));
        }
        break;
      case SOCKET_RECONNECT:
        store.dispatch({
          type: SOCKET_RECONNECTED,
          meta: SOCKET_COMMAND,
          socketDesc: action.socketDesc,
        });
    }

    return res;
  };
}
