import type { Reducer, SocketActions } from './types';
import { actionCreatorFactory, ActionCreatorFactory } from 'typescript-fsa';
import produce, { Draft } from 'immer';

type ConstructorProps<State> = {
  socketUrl: string;
  reducer: Reducer<State>;
};

export default class SocketManager<State> {
  private readonly reducer: Reducer<State>;
  private readonly actionCreator: ActionCreatorFactory;

  readonly socketEvents: SocketActions;
  readonly socketUrl: string;

  constructor(props: ConstructorProps<State>) {
    this.socketUrl = props.socketUrl;
    this.reducer = props.reducer;

    this.actionCreator = actionCreatorFactory();
    this.socketEvents = {};
  }

  createSocketListener<Result>(type: string, onReceive: (state: Draft<State>, result: Result) => void) {
    const action = this.actionCreator<Result>(type);
    this.socketEvents[type] = action;

    this.reducer.case(action, (state, result) =>
      produce(state, (draft) => {
        onReceive(draft, result);
      }),
    );
  }

  createSocketConnectAction(uri: string, socketDesc: string, options: { id?: boolean } = {}) {
    return (token: string, id?: number) => ({
      type: 'SOCKET_CONNECT',
      meta: 'SOCKET_COMMAND',
      token,
      uri: options.id ? `${uri}/${id}/` : uri,
      socketDesc,
    });
  }

  createSocketDisconnectAction(uri: string, socketDesc: string, options: { id?: boolean } = {}) {
    return (token: string, id?: number) => ({
      type: 'SOCKET_DISCONNECT',
      meta: 'SOCKET_COMMAND',
      token,
      uri: options.id ? `${uri}/${id}/` : uri,
      socketDesc,
    });
  }
}
