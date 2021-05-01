import { ExtendedState } from '../types';
import { AsyncActionCreators } from 'typescript-fsa';

type Props<Payload, Result, State> = {
  asyncAction: AsyncActionCreators<Payload, Result, Error>;
  actionName: string;
};

const createReturnAction = <Payload, Result, State>({ asyncAction, actionName }: Props<Payload, Result, State>) => {
  const returnedAction = (payload: Payload) => asyncAction.started(payload);
  returnedAction.loadingSelector = (state: ExtendedState<State>) => state.loading[actionName] as boolean;
  return returnedAction;
};

export default createReturnAction;
