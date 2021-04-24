import { Action } from 'typescript-fsa';

export type API<Payload, Result, ApiState> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Payload;
  auth?: boolean;
  successReducer: (state: ApiState, result: Result, payload: Payload) => void;
  failReducer?: (state: ApiState, error: Error, payload: Payload) => void;
  startReducer?: (state: ApiState, payload: Payload) => void;
};

export type ApiResponse<Result> = {
  result: Result | Error;
  status: number;
};
