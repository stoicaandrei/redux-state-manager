import { call, ForkEffect, put, takeEvery, select } from 'redux-saga/effects';
import { combineReducers } from 'redux';
import { Action, ActionCreator, Success, actionCreatorFactory } from 'typescript-fsa';
import { ReducerBuilder, reducerWithInitialState } from 'typescript-fsa-reducers';
import { produce } from 'immer';

import { API, CreateModuleOptions } from './types';
import apiCaller from './ApiCaller';

import { PING_INTERVAL, PONG_TIMEOUT, PING, PONG, SOCKET_STATES, SOCKET_OPENED } from './constants';

type ConstructorProps = {
  socketUrl?: string;
  apiUrl: string;
};

export default class StateManager {
  readonly sockets: {
    [key: string]: {
      socket: WebSocket;
      uri: string;
      token: string;
    };
  };
  readonly timeouts: {
    [key: string]: NodeJS.Timeout;
  };
  private pingInterval: NodeJS.Timeout | null;
  readonly logging: boolean;

  private handleMessage: (...args: unknown[]) => void;
  private handleOpen: (...args: unknown[]) => void;
  private handleClose: (...args: unknown[]) => void;
  private handleReconnect: (...args: unknown[]) => void;

  readonly socketEvents: {
    // module
    [key: string]: {
      reducer: ReducerBuilder<any>;
      events: {
        [key: string]: ActionCreator<any>;
      };
    };
  };
  private sagaEffects: ForkEffect[] = [];
  readonly socketUrl: string;
  readonly apiUrl: string;

  constructor(props: ConstructorProps) {
    this.sockets = {};
    this.timeouts = {};
    this.pingInterval = null;
    this.logging = true;

    // Callbacks
    this.handleMessage = (a) => console.log(a);
    this.handleOpen = (a) => console.log(a);
    this.handleClose = (a) => console.log(a);
    this.handleReconnect = (a) => console.log(a);

    this.socketEvents = {};

    this.socketUrl = props.socketUrl || '';
    this.apiUrl = props.apiUrl || '';
  }

  private _ping = (socketDesc: string) => {
    this.sockets[socketDesc].socket.send(PING);

    this.timeouts[socketDesc] = setTimeout(() => {
      this.sockets[socketDesc].socket.close(4008, 'ping_timeout');
    }, PONG_TIMEOUT);
  };

  private _onPong = (socketDesc: string) => {
    clearTimeout(this.timeouts[socketDesc]);
  };

  private _listen = (socketDesc: string) => {
    const { socket } = this.sockets[socketDesc];

    socket.onopen = (event) => {
      this.pingInterval = setInterval(() => this._ping(socketDesc), PING_INTERVAL);
      this._log(event, socketDesc);
      this.handleOpen(socketDesc);
    };

    socket.onclose = (event) => {
      clearInterval(this.pingInterval as NodeJS.Timeout);
      console.log(this.sockets);
      // attempt to reconnect if socket connection is dropped

      if (!event.wasClean) {
        const { token, uri } = this.sockets[socketDesc];
        setTimeout(() => this.connectToSocket(socketDesc, token, uri), 10000);
      }

      this.handleClose(socketDesc, event.wasClean);
      this._log(event, socketDesc);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      if (message === PONG) this._onPong(socketDesc);
      else {
        this.handleMessage(socketDesc, JSON.parse(event.data));
        this._log(event, socketDesc);
      }
    };
  };

  private _log = (event: any, socketDesc: string) => {
    this.logging &&
      console.log({
        event,
        state: this.getState(socketDesc),
        socketObj: this.sockets,
      });
  };

  public getState = (socketDesc: string) => SOCKET_STATES[this.sockets[socketDesc].socket.readyState];

  public connectToSocket = (socketDesc: string, token: string, uri: string) => {
    if (this.sockets[socketDesc] && SOCKET_STATES[this.sockets[socketDesc].socket.readyState] === SOCKET_OPENED) return;

    const socket = new WebSocket(`${this.socketUrl}${uri}?token=${token}`);

    this.sockets[socketDesc] = { token, uri, socket };
    this._listen(socketDesc);
  };

  public disconnectFromSocket = (socketDesc: string) => {
    console.log(this.sockets);
    this.sockets[socketDesc].socket.close();
  };

  public onOpen = (func: any) => {
    this.handleOpen = func;
  };

  public onReconnect = (func: any) => {
    this.handleReconnect = func;
  };

  public onMessage = (func: any) => {
    this.handleMessage = func;
  };

  public onClose = (func: any) => {
    this.handleClose = func;
  };

  // this is used to define different reducers for different apis
  public createModule(name: string, { initialState, single }: CreateModuleOptions = {}) {
    if (!initialState) {
      initialState = single ? { item: {} } : { items: [] };
      initialState = { ...initialState, waiting: false };
    }

    this.socketEvents[name] = {
      reducer: reducerWithInitialState(initialState),
      events: {},
    };
  }

  public createLocalEvent<Payload, ApiState>(
    module: string,
    actionName: string,
    reducerFn: (state: ApiState, payload: Payload) => void,
  ) {
    const action = actionCreatorFactory(module)<Payload>(actionName);

    const { reducer } = this.socketEvents[module];

    reducer.case(action, (state, payload) =>
      produce(state, (draft: any) => {
        reducerFn(draft, payload);
      }),
    );

    return action;
  }

  public createApi<Payload, Result, ApiState>(
    module: string,
    actionName: string,
    api: API<Payload, Result, ApiState>,
  ): (payload: Payload) => Action<Payload> {
    const self = this;
    const asyncAction = actionCreatorFactory(module).async<Payload, Result, Error>(actionName);

    this.sagaEffects.push(
      // when this action is dispatched
      takeEvery(asyncAction.started, function* (action: Action<Payload>) {
        try {
          // fetch auth
          const token = yield select((state) => state.auth.item.token);
          const session_id = yield select((state) => state.session.item?.session?.id);
          // call api
          const { result, status } = yield call(() =>
            apiCaller<Payload>({
              endpoint: module,
              ...api,
              data: action.payload,
              token,
              session_id,
              apiUrl: self.apiUrl,
            }),
          );

          if (status.toString()[0] !== '2') {
            console.log(result);
            return yield put(asyncAction.failed({ params: action.payload, error: result }));
          }

          yield put(asyncAction.done({ params: action.payload, result }));
        } catch (error) {
          console.log(error);
          yield put(asyncAction.failed({ params: action.payload, error }));
        }
      }),
    );

    const { reducer } = this.socketEvents[module];

    reducer.case(asyncAction.started, (state, payload) =>
      produce(state, (draft: any) => {
        draft.waiting = true;
        draft.error = undefined;
        if (api.startReducer) api.startReducer(draft, payload);
      }),
    );

    reducer.case(asyncAction.failed, (state, { params, error }) =>
      produce(state, (draft: any) => {
        draft.waiting = false;
        draft.error = error;
        if (api.failReducer) api.failReducer(draft, error, params as Payload);
      }),
    );

    reducer.case(asyncAction.done, (state, { params, result }) =>
      produce(state, (draft: any) => {
        draft.waiting = false;
        api.successReducer(draft, result as Result, params as Payload);
      }),
    );

    return (payload: Payload) => asyncAction.started(payload);
  }

  public createSocketListener<Payload, Result, ApiState>(
    module: string,
    event: string,
    onReceive: (state: ApiState, result: Result) => void,
  ) {
    const action = actionCreatorFactory(module)<Success<Payload, Result>>(event);
    const { reducer } = this.socketEvents[module];

    this.socketEvents[module].events[event] = action;

    reducer.case(action, (state, payload: any) =>
      produce(state, (draft: any) => {
        onReceive(draft, payload as Result);
      }),
    );
  }

  get events() {
    return this.socketEvents;
  }

  get reducer() {
    const reducers: {
      [key: string]: ReducerBuilder<any>;
    } = {};

    Object.entries(this.socketEvents).forEach(([key, val]) => {
      reducers[key] = val.reducer;
    });

    return combineReducers(reducers);
  }

  get saga() {
    const self = this;
    return function* () {
      for (const effect of self.sagaEffects) {
        yield effect;
      }
    };
  }
}
