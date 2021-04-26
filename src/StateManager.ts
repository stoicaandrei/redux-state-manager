import { createStore, compose, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

import ApiManager from './ApiManager';

import type { API, Reducer, Selectors, TokenSelector } from './types';
import type { StoreEnhancer } from 'redux';

type ReduxMiddleware = () => StoreEnhancer<any>;

type Props<State> = {
  apiUrl: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  initialState: State;
  reduxMiddlewares?: ReduxMiddleware[];
};

export default class StateManager<State> {
  private readonly apiManager: ApiManager<State>;
  private readonly reduxMiddlewares: ReduxMiddleware[] = [];
  private readonly reducer: Reducer<State>;

  constructor(props: Props<State>) {
    this.reducer = reducerWithInitialState({ ...props.initialState, loading: {}, lastAction: '' });

    this.apiManager = new ApiManager({
      apiUrl: props.apiUrl,
      selectors: props.selectors,
      tokenSelector: props.tokenSelector,
      reducer: this.reducer,
    });

    if (props.reduxMiddlewares) this.reduxMiddlewares = props.reduxMiddlewares;
  }

  createApi<Payload, Result, T>(actionName: string, api: API<Payload, Result, State>) {
    return this.apiManager.createApi<Payload, Result>(actionName, api);
  }

  getStore() {
    const { reducer } = this;
    const saga = this.apiManager.getSaga();

    const sagaMiddleware = createSagaMiddleware();
    const enhancers: StoreEnhancer<any> = compose(applyMiddleware(sagaMiddleware), ...this.reduxMiddlewares);

    const store = createStore(reducer, enhancers);

    sagaMiddleware.run(saga);
    return store;
  }
}
