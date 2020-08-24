import { combineReducers } from 'redux';

import { StateManager } from './index';

export default function combineManagers(managers: StateManager[]) {
  const reducers = managers.map((man) => man.reducers).reduce((p, c) => ({ ...p, ...c }));
  const reducer = combineReducers(reducers);

  const effects = managers.map((man) => man.effects).flat(1);
  const saga = function* () {
    for (const effect of effects) {
      yield effect;
    }
  };

  const events = managers.map((man) => man.events).reduce((p, c) => ({ ...p, ...c }));

  return { reducer, saga, events };
}
