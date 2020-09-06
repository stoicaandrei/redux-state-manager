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
import GlobalManager from './GlobalManager';

export default function createSocketMiddleware(stateManager: GlobalManager) {
  return (store: any) => (next: any) => (action: SocketAction) => {
    let res;
    if (!(action.meta === SOCKET_COMMAND)) {
      return next(action);
    } else {
      res = next(action);
      switch (action.type) {
        case SOCKET_CONNECT:
          stateManager.onOpen((socketDesc: string) => {
            store.dispatch({
              type: SOCKET_CONNECTED,
              meta: SOCKET_COMMAND,
              socketDesc,
            });
          });
          stateManager.onClose((socketDesc: string, wasClean: boolean) => {
            // console.log('closing ', socketDesc, wasClean);
            store.dispatch({
              type: SOCKET_CLOSED,
              meta: SOCKET_COMMAND,
              socketDesc,
              wasClean,
            });
          });
          stateManager.onMessage((socketDesc: string, message: string) => {
            store.dispatch({
              type: SOCKET_RECEIVE,
              payload: message,
              meta: SOCKET_COMMAND,
              socketDesc,
            });
          });
          stateManager.onReconnect((socketDesc: string) => {
            store.dispatch({
              type: SOCKET_RECONNECT,
              meta: SOCKET_COMMAND,
              socketDesc,
            });
          });
          stateManager.connectToSocket(action.socketDesc, action.token, action.uri);
          break;
        case SOCKET_DISCONNECT:
          // console.log('disconecting ');
          stateManager.disconnectFromSocket(action.socketDesc);
          break;
        case SOCKET_RECEIVE:
          const event = action.payload.type;
          if (stateManager.socketEvents.hasOwnProperty(event)) {
            store.dispatch(stateManager.socketEvents[event](action.payload.data));
          } else {
            // console.warn({ event }, 'does not exist');
          }
          break;
        case SOCKET_RECONNECT:
          store.dispatch({
            type: SOCKET_RECONNECTED,
            meta: SOCKET_COMMAND,
            socketDesc: action.socketDesc,
          });
      }
    }
    return res;
  };
}
