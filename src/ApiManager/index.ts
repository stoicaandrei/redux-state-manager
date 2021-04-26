import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

import { produce, Draft } from 'immer';
import createEffect from './createEffect';

import type { ReducerBuilder } from 'typescript-fsa-reducers';
import type { ActionCreatorFactory } from 'typescript-fsa';
import type { ForkEffect } from 'redux-saga/effects';
import type { API, Reducer, CreateApiResult, Selectors, TokenSelector } from '../types';

const emptySelector = () => '';

type ConstructorProps<State> = {
  apiUrl: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  reducer: Reducer<State>;
};

export default class ApiManager<State> {
  private apiUrl: string;
  private selectors: Selectors<State>;
  private tokenSelector: TokenSelector<State>;

  readonly reducer: Reducer<State>;
  private actionCreator: ActionCreatorFactory;
  private effects: ForkEffect[] = [];

  constructor(props: ConstructorProps<State>) {
    this.apiUrl = props.apiUrl;
    this.selectors = props.selectors || [];
    this.tokenSelector = props.tokenSelector || emptySelector;

    this.reducer = props.reducer;
    this.actionCreator = actionCreatorFactory();
  }

  getSaga() {
    const { effects } = this;

    return function* () {
      for (const effect of effects) yield effect;
    };
  }

  createApi<Payload, Result>(actionName: string, api: API<Payload, Result, State>): CreateApiResult<Payload, Result> {
    const asyncAction = this.actionCreator.async<Payload, Result, Error>(actionName);
    const { reducer, tokenSelector, selectors, apiUrl } = this;

    const effect = createEffect({ asyncAction, tokenSelector, selectors, apiUrl, api });
    this.effects.push(effect);

    reducer.case(asyncAction.started, (state, payload) =>
      produce(state, (draft) => {
        draft.loading[actionName] = true;
        if (api.startReducer) api.startReducer(draft, payload);
      }),
    );

    reducer.case(asyncAction.failed, (state, { params, error }) =>
      produce(state, (draft) => {
        draft.lastAction = actionName;
        draft.loading[actionName] = false;
        if (api.failReducer) api.failReducer(draft, error, params as Payload);
      }),
    );

    reducer.case(asyncAction.done, (state, { params, result }) =>
      produce(state, (draft) => {
        draft.lastAction = actionName;
        draft.loading[actionName] = false;
        api.successReducer(draft, result as Result, params as Payload);
      }),
    );

    const returnedAction = (payload: Payload) => asyncAction.started(payload);

    returnedAction.loadingSelector = (state: any) => state.loading[actionName] as boolean;

    return returnedAction;
  }
}
