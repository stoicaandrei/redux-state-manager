import type { Reducer, SocketActions } from './types';
import { actionCreatorFactory, Success, ActionCreatorFactory } from 'typescript-fsa';
import produce, { Draft } from 'immer';

type ConstructorProps<State> = {
  reducer: Reducer<State>;
};

export default class SocketManager<State> {
  private readonly reducer: Reducer<State>;
  private readonly actionCreator: ActionCreatorFactory;

  public socketEvents: SocketActions

  constructor(props: ConstructorProps<State>) {
    this.reducer = props.reducer;

    this.actionCreator = actionCreatorFactory();
    this.socketEvents = {};
  }

  createSocketListener<Result>(type: string, onReceive: (state: Draft<State>, result: Result) => void) {
    const action = this.actionCreator<Success<unknown, Result>>(type);
    this.socketEvents[type] = action;

    this.reducer.case(action, (state, { result }) =>
      produce(state, (draft) => {
        onReceive(draft, result as Result);
      }),
    );
  }
}
