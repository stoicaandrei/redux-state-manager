import { produce } from 'immer';
import { AsyncActionCreators } from 'typescript-fsa';
import { API, Reducer } from '../types';

type Props<Payload, Result, State> = {
  asyncAction: AsyncActionCreators<Payload, Result, Error>;
  api: API<Payload, Result, State>;
  actionName: string;
  reducer: Reducer<State>;
};

const createReducerCases = <Payload, Result, State>({
  reducer,
  asyncAction,
  actionName,
  api,
}: Props<Payload, Result, State>) => {
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
};

export default createReducerCases;
