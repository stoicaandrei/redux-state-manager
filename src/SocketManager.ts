import type { Reducer } from './types';
import { actionCreatorFactory, ActionCreator, Success, ActionCreatorFactory } from 'typescript-fsa';
import produce, { Draft } from 'immer';

type ConstructorProps<State> = {
  reducer: Reducer<State>;
};

export default class SocketManager<State> {
  private readonly reducer: Reducer<State>;
  private readonly actionCreator: ActionCreatorFactory;

  public socketEvents: {
    [key: string]: ActionCreator<any>;
  };

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
