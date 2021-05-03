import { actionCreatorFactory } from 'typescript-fsa';

import createEffect from './createEffect';
import createReducerCases from './createReducerCases';
import createReturnAction from './createReturnAction';

import type { ActionCreatorFactory } from 'typescript-fsa';
import type { ForkEffect } from 'redux-saga/effects';
import type { API, Reducer, CreateApiResult, Selectors, TokenSelector } from '../types';

const emptySelector = () => '';

type ConstructorProps<State> = {
  apiUrl: string;
  permanentParamsSelectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  reducer: Reducer<State>;
};

export default class ApiManager<State> {
  private apiUrl: string;
  private permanentParamsSelectors: Selectors<State>;
  private tokenSelector: TokenSelector<State>;

  readonly reducer: Reducer<State>;
  private actionCreator: ActionCreatorFactory;
  private effects: ForkEffect[] = [];

  private handledActions: Record<string, boolean> = {};

  constructor(props: ConstructorProps<State>) {
    this.apiUrl = props.apiUrl;
    this.permanentParamsSelectors = props.permanentParamsSelectors || [];
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

  createJsonRequest<Payload extends Record<string, any>, Result>(
    actionName: string,
    api: API<Payload, Result, State>,
  ): CreateApiResult<Payload, State> {
    const asyncAction = this.actionCreator.async<Payload, Result, Error>(actionName);

    if (this.handledActions[actionName]) return createReturnAction({ asyncAction, actionName });
    this.handledActions[actionName] = true;

    const { reducer, tokenSelector, permanentParamsSelectors, apiUrl } = this;

    const effect = createEffect({
      asyncAction,
      tokenSelector,
      permanentParamsSelectors,
      apiUrl,
      api,
      requestType: 'json',
    });
    this.effects.push(effect);
    createReducerCases({ reducer, asyncAction, actionName, api });

    return createReturnAction({ asyncAction, actionName });
  }

  createFormRequest<Payload extends Record<string, string | Blob>, Result>(
    actionName: string,
    api: API<Payload, Result, State>,
  ): CreateApiResult<Payload, State> {
    const asyncAction = this.actionCreator.async<Payload, Result, Error>(actionName);

    if (this.handledActions[actionName]) return createReturnAction({ asyncAction, actionName });
    this.handledActions[actionName] = true;

    const { reducer, tokenSelector, permanentParamsSelectors, apiUrl } = this;

    const effect = createEffect({
      asyncAction,
      tokenSelector,
      permanentParamsSelectors,
      apiUrl,
      api,
      requestType: 'form',
    });
    this.effects.push(effect);
    createReducerCases({ reducer, asyncAction, actionName, api });

    return createReturnAction({ asyncAction, actionName });
  }
}
