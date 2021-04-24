import { call, put, select, takeEvery } from 'redux-saga/effects';

import ApiCaller from '../ApiCaller';

import type { Action, AsyncActionCreators } from 'typescript-fsa';
import type { API, ApiResponse } from '../types';
import type { Selectors, TokenSelector } from './types';

type Props<Payload, Result, State> = {
  asyncAction: AsyncActionCreators<Payload, Result, Error>;
  tokenSelector: TokenSelector<State>;
  selectors: Selectors<State>;
  apiUrl: string;
  api: API<Payload, Result, State>;
};

const createEffect = <Payload, Result, State>({
  asyncAction,
  tokenSelector,
  selectors,
  apiUrl,
  api,
}: Props<Payload, Result, State>) => {
  return takeEvery(asyncAction.started, function* (action: Action<Payload>): Generator<any> {
    try {
      // fetch auth
      const token = (yield select(tokenSelector)) as string;

      const additionalVars: Record<string, string> = {};
      for (const item of selectors) {
        const { varName, selector } = item;
        additionalVars[varName] = (yield select(selector)) as string;
      }

      // call api
      const { result, status } = (yield call(() =>
        ApiCaller<Payload, Result>({
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
