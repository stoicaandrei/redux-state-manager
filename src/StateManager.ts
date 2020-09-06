import { call, ForkEffect, put, takeEvery, select } from 'redux-saga/effects';
import { combineReducers } from 'redux';
import {
  Action,
  ActionCreator,
  Success,
  actionCreatorFactory,
  ActionCreatorFactory,
} from 'typescript-fsa';
import {
  ReducerBuilder,
  reducerWithInitialState,
} from 'typescript-fsa-reducers';
import { produce } from 'immer';

import { API } from './types';
import apiCaller from './ApiCaller';

type ConstructorProps = {
  socketUrl?: string;
  apiUrl?: string;
  selectors?: { varName: string; selector: (state: any) => any }[];
  tokenSelector?: (state: any) => any;
  moduleName: string;
  initialState: Record<string, unknown>;
};

export default class StateManager {
  public reducer: ReducerBuilder<any>;
  public effects: ForkEffect[] = [];
  public socketEvents: {
    [key: string]: ActionCreator<any>;
  };
  readonly socketUrl: string;
  readonly apiUrl: string;

  private selectors: {
    varName: string;
    selector: (state: any) => any;
  }[];
  private tokenSelector: (state: any) => any;

  public moduleName: string;
  public actionCreator: ActionCreatorFactory;

  constructor(props: ConstructorProps) {
    this.socketUrl = props.socketUrl || '';
    this.apiUrl = props.apiUrl || '';

    this.selectors = props.selectors || [];
    this.tokenSelector =
      props.tokenSelector ||
      (() => {
        /*empty*/
      });

    this.moduleName = props.moduleName;
    this.reducer = reducerWithInitialState(props.initialState);
    this.socketEvents = {};

    this.actionCreator = actionCreatorFactory(this.moduleName);
  }

  public createLocalEvent(
    actionName: string,
    reducerFn: (state: any, payload: any) => void
  ) {
    const action = this.actionCreator<any>(actionName);

    this.reducer.case(action, (state, payload) =>
      produce(state, (draft: any) => {
        reducerFn(draft, payload);
      })
    );

    return action;
  }

  public createApi<Payload, Result, ApiState>(
    actionName: string,
    api: API<Payload, Result, ApiState>
  ): (payload: Payload) => Action<Payload> {
    const self = this;
    const asyncAction = this.actionCreator.async<Payload, Result, Error>(
      actionName
    );
    const { reducer, selectors } = this;

    this.effects.push(
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
            })
          );

          if (status.toString()[0] !== '2') {
            // console.log(result);
            return yield put(
              asyncAction.failed({ params: action.payload, error: result })
            );
          }

          yield put(asyncAction.done({ params: action.payload, result }));
        } catch (error) {
          // console.log(error);
          yield put(
            asyncAction.failed({
              params: action.payload,
              error: error.toString(),
            })
          );
        }
      })
    );

    reducer.case(asyncAction.started, (state, payload) =>
      produce(state, (draft: any) => {
        draft.waiting = true;
        draft.error = undefined;
        if (api.startReducer) api.startReducer(draft, payload);
      })
    );

    reducer.case(asyncAction.failed, (state, { params, error }) =>
      produce(state, (draft: any) => {
        draft.waiting = false;
        draft.error = error.toString();
        if (api.failReducer) api.failReducer(draft, error, params as Payload);
      })
    );

    reducer.case(asyncAction.done, (state, { params, result }) =>
      produce(state, (draft: any) => {
        draft.waiting = false;
        api.successReducer(draft, result as Result, params as Payload);
      })
    );

    return (payload: Payload) => asyncAction.started(payload);
  }

  public createSocketListener<Result, ApiState>(
    type: string,
    onReceive: (state: ApiState, result: Result) => void
  ) {
    const action = this.actionCreator<Success<unknown, Result>>(type);
    this.socketEvents[type] = action;

    this.reducer.case(action, (state, payload: any) =>
      produce(state, (draft: any) => {
        onReceive(draft, payload as Result);
      })
    );
  }
}
