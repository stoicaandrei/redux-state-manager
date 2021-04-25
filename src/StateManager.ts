import { createStore, compose, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import ApiManager from './ApiManager';

import type { ConstructorProps } from './ApiManager/types';
import type { API } from './types';
import type { StoreEnhancer } from 'redux';

type ReduxMiddleware = () => StoreEnhancer<any>;
type Props = {
  reduxMiddlewares?: ReduxMiddleware[];
};

export default class StateManager<State> {
  private readonly apiManager: ApiManager<State>;
  private readonly reduxMiddlewares: ReduxMiddleware[] = [];

  constructor(props: Props & ConstructorProps<State>) {
    this.apiManager = new ApiManager({
      apiUrl: props.apiUrl,
      selectors: props.selectors,
      tokenSelector: props.tokenSelector,
      initialState: props.initialState,
    });

    if (props.reduxMiddlewares) this.reduxMiddlewares = props.reduxMiddlewares;
  }

  createApi<Payload, Result, T>(actionName: string, api: API<Payload, Result, State>) {
    return this.apiManager.createApi<Payload, Result>(actionName, api);
  }

  getStore() {
    const { reducer } = this.apiManager;
    const saga = this.apiManager.getSaga();

    const sagaMiddleware = createSagaMiddleware();
    const enhancers: StoreEnhancer<any> = compose(applyMiddleware(sagaMiddleware), ...this.reduxMiddlewares);

    const store = createStore(reducer, enhancers);

    sagaMiddleware.run(saga);
    return store;
  }
}
