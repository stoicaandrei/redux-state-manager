import { AsyncActionCreators } from 'typescript-fsa';

export type API<Payload, Result, ApiState> = {
  path: string;
  endpoint?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Payload;
  auth?: boolean;
  successReducer: (state: ApiState, result: Result, payload: Payload) => void;
  failReducer?: (state: ApiState, error: Error, payload: Payload) => void;
  startReducer?: (state: ApiState, payload: Payload) => void;
};

export type ApiStateList<Entity> = {
  items: Entity[];
  waiting: boolean;
  error?: Error;
};

export type ApiStateSingle<Entity> = {
  item: Entity;
  waiting: boolean;
  error?: Error;
};

export type SocketAction = {
  type: string;
  meta: string;
  token: string;
  uri: string;
  socketDesc: string;
  payload: any;
};

export type CreateModuleOptions = {
  initialState?: Record<string, unknown>;
  single?: boolean;
};
