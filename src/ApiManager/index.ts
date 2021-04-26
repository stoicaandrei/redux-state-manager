import { actionCreatorFactory } from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

import { produce } from 'immer';

import type { ReducerBuilder } from 'typescript-fsa-reducers';
import type { ActionCreatorFactory } from 'typescript-fsa';
import type { ForkEffect } from 'redux-saga/effects';

import type {
  NamedSelector,
  StringSelector,
  CreateApiResult,
  ExtendedState,
  Selectors, TokenSelector,
} from './types';
import type { API, Reducer } from '../types';
import createEffect from './createEffect';

const emptySelector = () => '';

type ConstructorProps<State> = {
  apiUrl: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  reducer: Reducer<State>
}

export default class ApiManager<S> {
  private apiUrl: string;
  private selectors: NamedSelector<ExtendedState<S>>[];
  private tokenSelector: StringSelector<ExtendedState<S>>;

  readonly reducer: Reducer<S>;
  private actionCreator: ActionCreatorFactory;
  private effects: ForkEffect[] = [];

  constructor(props: ConstructorProps<S>) {
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

  createApi<Payload, Result>(
    actionName: string,
    api: API<Payload, Result, ExtendedState<S>>,
  ): CreateApiResult<Payload, Result> {
    const asyncAction = this.actionCreator.async<Payload, Result, Error>(actionName);
    const { reducer, tokenSelector, selectors, apiUrl } = this;

    const effect = createEffect({ asyncAction, tokenSelector, selectors, apiUrl, api });
    this.effects.push(effect);

    reducer.case(asyncAction.started, (state, payload) =>
      produce(state, (draft: ExtendedState<S>) => {
        draft.loading[actionName] = true;
        if (api.startReducer) api.startReducer(draft, payload);
      }),
    );

    reducer.case(asyncAction.failed, (state, { params, error }) =>
      produce(state, (draft: ExtendedState<S>) => {
        draft.lastAction = actionName;
        draft.loading[actionName] = false;
        if (api.failReducer) api.failReducer(draft, error, params as Payload);
      }),
    );

    reducer.case(asyncAction.done, (state, { params, result }) =>
      produce(state, (draft: ExtendedState<S>) => {
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
