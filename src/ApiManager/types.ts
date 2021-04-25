import { Action } from 'typescript-fsa';
import { API } from '../types';

export type StringSelector<State> = (state: State) => string | undefined;
export type NamedSelector<State> = {
  varName: string;
  selector: StringSelector<State>;
};

export type ExtendedState<State> = State & {
  lastAction: string;
  loading: Record<string, boolean>;
};

export type TokenSelector<State> = StringSelector<State>;
export type Selectors<State> = NamedSelector<State>[];

export type ConstructorProps<State> = {
  apiUrl: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  initialState: Partial<ExtendedState<State>>;
};

export type ActionCaller<Payload> = (payload: Payload) => Action<Payload>;
export type LoadingSelectorMixin<State> = {
  loadingSelector: (state: State) => boolean;
};

export type CreateApiResult<Payload, State> = ActionCaller<Payload> & LoadingSelectorMixin<State>;
