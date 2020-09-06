import { combineReducers } from 'redux';

import { StateManager } from './index';

export default function combineManagers(managers: StateManager[]) {
  const reducers = managers.reduce((p, c) => ({ ...p, [c.moduleName]: c.reducer }), {});
  const reducer = combineReducers(reducers);

  const effects = managers.map((man) => man.effects).flat(1);
  const saga = function* () {
    for (const effect of effects) {
      yield effect;
    }
  };

  const socketEvents = managers.map((man) => man.socketEvents).reduce((p, c) => ({ ...p, ...c }));

  return { reducer, saga, socketEvents };
}
