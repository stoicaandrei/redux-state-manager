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
  apiUrl?: string;
  selectors?: { varName: string; selector: (state: any) => any }[];
  tokenSelector?: (state: any) => any;
  moduleName: string;
  initialState: Record<string, unknown>;
};

export default class StateManager {
  readonly socketEvents: {
    // module
    [key: string]: {
      reducer: ReducerBuilder<any>;
      events: {
        [key: string]: ActionCreator<any>;
      };
      selectors: { varName: string; selector: (state: any) => any }[];
    };
  };
  private sagaEffects: ForkEffect[] = [];
  readonly socketUrl: string;
  readonly apiUrl: string;

  private selectors: {
    varName: string;
    selector: (state: any) => any;
  }[];
  private tokenSelector: (state: any) => any;

  private readonly moduleName: string;

  constructor(props: ConstructorProps) {
    this.socketEvents = {};

    this.socketUrl = props.socketUrl || '';
    this.apiUrl = props.apiUrl || '';

    this.selectors = props.selectors || [];
    this.tokenSelector =
      props.tokenSelector ||
      (() => {
        /*empty*/
      });

    this.moduleName = props.moduleName;
    this.createModule(this.moduleName, { initialState: props.initialState });
  }

  // this is used to define different reducers for different apis
  public createModule(name: string, { initialState, single, selectors }: CreateModuleOptions = {}) {
    if (!initialState) {
      initialState = single ? { item: {} } : { items: [] };
      initialState = { ...initialState, waiting: false };
    }

    this.socketEvents[name] = {
      reducer: reducerWithInitialState(initialState),
      events: {},
      selectors: selectors ? selectors : [],
    };
  }

  public createLocalEvent(actionName: string, reducerFn: (state: any, payload: any) => void) {
    const action = actionCreatorFactory(this.moduleName)<any>(actionName);

    const { reducer } = this.socketEvents[this.moduleName];

    reducer.case(action, (state, payload) =>
      produce(state, (draft: any) => {
        reducerFn(draft, payload);
      }),
    );

    return action;
  }

  public createApi<Payload, Result, ApiState>(
    actionName: string,
    api: API<Payload, Result, ApiState>,
  ): (payload: Payload) => Action<Payload> {
    const self = this;
    const asyncAction = actionCreatorFactory(this.moduleName).async<Payload, Result, Error>(actionName);
    const { reducer, selectors } = this.socketEvents[this.moduleName];

    this.sagaEffects.push(
      // when this action is dispatched
      takeEvery(asyncAction.started, function* (action: Action<Payload>) {
        // console.log('doing something');
        try {
          // fetch auth
          const token = yield select(self.tokenSelector);

          const additionalVars: { [key: string]: any } = {};
          for (const item of self.selectors) {
            const { varName, selector } = item;
            additionalVars[varName] = yield select(selector);
          }
          for (const item of selectors) {
            const { varName, selector } = item;
            additionalVars[varName] = yield select(selector);
          }

          // call api
          const { result, status } = yield call(() =>
            apiCaller<Payload>({
              ...api,
              data: { ...action.payload, ...additionalVars } as any,
              token,
              apiUrl: self.apiUrl,
            }),
          );

          if (status.toString()[0] !== '2') {
            // console.log(result);
            return yield put(asyncAction.failed({ params: action.payload, error: result }));
          }

          yield put(asyncAction.done({ params: action.payload, result }));
        } catch (error) {
          // console.log(error);
          yield put(
            asyncAction.failed({
              params: action.payload,
              error: error.toString(),
            }),
          );
        }
      }),
    );

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
        draft.error = error.toString();
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

  public createSocketListener<Result, ApiState>(event: string, onReceive: (state: ApiState, result: Result) => void) {
    const action = actionCreatorFactory(this.moduleName)<Success<unknown, Result>>(event);
    const { reducer } = this.socketEvents[this.moduleName];

    this.socketEvents[this.moduleName].events[event] = action;

    reducer.case(action, (state, payload: any) =>
      produce(state, (draft: any) => {
        onReceive(draft, payload as Result);
      }),
    );
  }

  get events() {
    return this.socketEvents;
  }

  get reducers() {
    const reducers: {
      [key: string]: ReducerBuilder<any>;
    } = {};

    Object.entries(this.socketEvents).forEach(([key, val]) => {
      reducers[key] = val.reducer;
    });

    return reducers;
  }

  get reducer() {
    return combineReducers(this.reducers);
  }

  get effects() {
    return this.sagaEffects;
  }

  get saga() {
    const self = this;
    return function* () {
      for (const effect of self.effects) {
        yield effect;
      }
    };
  }
}
