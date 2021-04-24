import { createStore, compose, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import ApiManager from './ApiManager';

import { ConstructorProps } from './ApiManager/types';

export default class StateManager<State> {
  private readonly apiManager: ApiManager<State>;

  constructor(props: ConstructorProps<State>) {
    this.apiManager = new ApiManager({
      apiUrl: props.apiUrl,
      selectors: props.selectors,
      tokenSelector: props.tokenSelector,
      initialState: props.initialState,
    });
  }

  createApi<Payload, Result, T>(actionName: string, api: API<Payload, Result, State>) {
    return this.apiManager.createApi<Payload, Result>(actionName, api);
  }

  getStore() {
    const { reducer } = this.apiManager;
    const saga = this.apiManager.getSaga();

    const sagaMiddleware = createSagaMiddleware();
    const enhancers = compose(applyMiddleware(sagaMiddleware));

    const store = createStore(reducer, enhancers);

    sagaMiddleware.run(saga);
    return store;
  }
}
