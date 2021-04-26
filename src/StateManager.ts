import { createStore, compose, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import ApiManager from './ApiManager';

import type { ConstructorProps, ExtendedState, Selectors, TokenSelector } from './ApiManager/types';
import type { API, Reducer } from './types';
import type { StoreEnhancer } from 'redux';
import { ReducerBuilder, reducerWithInitialState } from 'typescript-fsa-reducers';

type ReduxMiddleware = () => StoreEnhancer<any>;

type Props<State> = {
  apiUrl: string;
  selectors?: Selectors<State>;
  tokenSelector?: TokenSelector<State>;
  initialState: Partial<ExtendedState<State>>;
  reduxMiddlewares?: ReduxMiddleware[];
};

export default class StateManager<State> {
  private readonly apiManager: ApiManager<State>;
  private readonly reduxMiddlewares: ReduxMiddleware[] = [];
  private readonly reducer: Reducer<State>;

  constructor(props: Props<State>) {
    const initialState = props.initialState;
    initialState.loading = {};
    this.reducer = reducerWithInitialState(initialState);

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
