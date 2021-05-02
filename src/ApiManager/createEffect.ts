import { call, put, select, takeEvery } from 'redux-saga/effects';

import { formRequest, jsonRequest } from '../ApiCaller';

import type { Action, AsyncActionCreators } from 'typescript-fsa';
import type { API, ApiResponse, Selectors, TokenSelector } from '../types';

type Props<Payload, Result, State> = {
  asyncAction: AsyncActionCreators<Payload, Result, Error>;
  tokenSelector: TokenSelector<State>;
  permanentParamsSelectors: Selectors<State>;
  apiUrl: string;
  api: API<Payload, Result, State>;
  requestType: 'json' | 'form';
};

const callers = {
  json: jsonRequest,
  form: formRequest,
};

const createEffect = <Payload, Result, State>({
  asyncAction,
  tokenSelector,
  permanentParamsSelectors,
  apiUrl,
  api,
  requestType,
}: Props<Payload, Result, State>) => {
  return takeEvery(asyncAction.started, function* (action: Action<Payload>): Generator<any> {
    try {
      // fetch auth
      const token = (yield select(tokenSelector)) as string;

      const additionalVars: Record<string, string> = {};
      for (const item of permanentParamsSelectors) {
        const { varName, selector } = item;
        additionalVars[varName] = (yield select(selector)) as string;
      }

      // call api
      const { result, status } = (yield call(() =>
        callers[requestType]<Payload, Result>({
          ...api,
          data: { ...additionalVars, ...action.payload },
          token,
          apiUrl,
        }),
      )) as ApiResponse<Result>;

      if (status.toString()[0] !== '2') {
        return yield put(
          asyncAction.failed({
            params: action.payload,
            error: result as Error,
          }),
        );
      }

      yield put(asyncAction.done({ params: action.payload, result: result as Result }));
    } catch (error) {
      yield put(
        asyncAction.failed({
          params: action.payload,
          error: error.toString(),
        }),
      );
    }
  });
};

export default createEffect;
