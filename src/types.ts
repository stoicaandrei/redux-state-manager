import type { ReducerBuilder } from 'typescript-fsa-reducers';
import type { Action, ActionCreator, Success } from 'typescript-fsa';
import type { Draft } from 'immer';

export type ExtendedState<State> = State & {
  lastAction: string;
  _loading: Record<string, boolean>;
};

export type API<Payload, Result, State> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successReducer: (state: Draft<State>, result: Result, payload: Payload) => void;
  failReducer?: (state: Draft<State>, error: Error, payload: Payload) => void;
  startReducer?: (state: Draft<State>, payload: Payload) => void;
};

export type ApiResponse<Result> = {
  result: Result | Error;
  status: number;
};

export type SocketAction = {
  type: string;
  meta: string;
  token: string;
  uri: string;
  socketDesc: string;
  payload: any;
};

export type StringSelector<State> = (state: ExtendedState<State>) => string | undefined;
export type NamedSelector<State> = {
  varName: string;
  selector: StringSelector<State>;
};

export type TokenSelector<State> = StringSelector<State>;
export type Selectors<State> = NamedSelector<State>[];

export type Reducer<State> = ReducerBuilder<ExtendedState<State>>;

export type ActionCaller<Payload> = (payload: Payload) => Action<Payload>;
export type LoadingSelectorMixin<State> = {
  loadingSelector: (state: ExtendedState<State>) => boolean;
};

export type CreateApiResult<Payload, State> = ActionCaller<Payload> & LoadingSelectorMixin<State>;

export type SocketActions = {
  [key: string]: ActionCreator<any>;
};

export type StateSelector<T, State> = (state: ExtendedState<State>) => T;
