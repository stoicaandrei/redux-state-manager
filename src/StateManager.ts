import { createStore, compose, applyMiddleware } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import createSagaMiddleware from 'redux-saga';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

import ApiManager from './ApiManager';
import SocketManager from './SocketManager';

import createSocketMiddleware from './createSocketMiddleware';
import { getDispatchHook, getSelectorHook } from './hooks';

import type { Reducer, Selectors, TokenSelector } from './types';
import type { StoreEnhancer } from 'redux';

type Props<State> = {
  apiUrl?: string;
  socketUrl?: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  initialState: State;
};

export default class StateManager<State> {
  private readonly apiManager: ApiManager<State>;
  private readonly socketManager: SocketManager<State>;
  private readonly reducer: Reducer<State>;

  constructor(props: Props<State>) {
    this.reducer = reducerWithInitialState({ ...props.initialState, loading: {}, lastAction: '' });

    this.apiManager = new ApiManager({
      apiUrl: props.apiUrl || '',
      selectors: props.selectors,
      tokenSelector: props.tokenSelector,
      reducer: this.reducer,
    });
    this.socketManager = new SocketManager({ reducer: this.reducer, socketUrl: props.socketUrl || '' });
  }

  public get managers() {
    return {
      apiManager: this.apiManager,
      socketManager: this.socketManager,
    };
  }

  public get selectors() {
    return {
      useSelector: getSelectorHook<State>(),
      useDispatch: getDispatchHook(),
    };
  }

  getStore() {
    const { reducer } = this;
    const saga = this.apiManager.getSaga();

    const sagaMiddleware = createSagaMiddleware();
    const enhancers: StoreEnhancer<any> = compose(
      applyMiddleware(sagaMiddleware),
      createSocketMiddleware(this.socketManager),
      devToolsEnhancer({}),
    );

    const store = createStore(reducer, enhancers);

    sagaMiddleware.run(saga);
    return store;
  }
}
