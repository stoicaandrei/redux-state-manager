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
import StateManager from './StateManager';

export default function createSocketMiddleware(stateManager: StateManager<any>) {
  return (store: any) => (next: any) => (action: SocketAction) => {
    let res;
    let module;
    let event;
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
          [module, event] = action.payload.type.split('.');
          if (stateManager.events.hasOwnProperty(module) && stateManager.events[module].events.hasOwnProperty(event)) {
            store.dispatch(stateManager.events[module].events[event](action.payload.data));
          } else {
            // console.warn({ module, event }, 'does not exist');
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
